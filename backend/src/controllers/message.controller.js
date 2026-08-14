import { uploadChatPic } from "../lib/cloudinary.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import {
  DEFAULT_MESSAGE_LIMIT,
  MAX_MESSAGE_LIMIT,
  parsePaginationParams,
  buildPaginationQuery,
  processPaginationResults,
} from "../util/pagination.js";
import mongoose from "mongoose";
import { Media } from "../models/media.model.js";
import {
  enqueueLegacyAssetDeletion,
  scheduleMediaDeletion,
} from "../lib/jobsQueue.js";

const MEDIA_CLIENT_FIELDS = [
  "_id",
  "purpose",
  "resourceType",
  "originalName",
  "mimeType",
  "bytes",
  "width",
  "height",
  "duration",
  "format",
  "status",
].join(" ");

const getParticipantConversation = async (conversationId, userId, select) => {
  const conversation = await Conversation.findById(conversationId)
    .select(select)
    .lean();

  if (!conversation) throw new ApiError(400, "Conversation not found");

  const isParticipant = conversation.participants.some(
    (participant) => participant.userId.toString() === userId.toString(),
  );
  if (!isParticipant) {
    throw new ApiError(403, "You are not a member of this conversation");
  }

  return conversation;
};

const getReplyPreview = (message) => {
  if (message.post?._id) return "Shared post";
  if (message.media) return message.text?.trim() || "Attachment";
  if (message.image?.url) return message.text?.trim() || "Photo";
  return message.text?.trim() || "Message";
};

const createReplySnapshot = async (replyToId, conversationId, userId) => {
  if (!replyToId) return null;

  const target = await Message.findOne({
    _id: replyToId,
    conversationId,
    system: { $ne: true },
    deletedForEveryone: { $ne: true },
    deletedFor: { $ne: userId },
  })
    .select("_id sender text image media post")
    .lean();

  if (!target) {
    throw new ApiError(400, "The message you are replying to is unavailable");
  }

  return {
    messageId: target._id,
    sender: target.sender,
    preview: getReplyPreview(target).slice(0, 500),
    deleted: false,
  };
};

const applyReaction = async ({ conversation, messageId, userId, emoji }) => {
  const participantIds = new Set(
    conversation.participants.map((participant) => participant.userId.toString()),
  );
  const userIdString = userId.toString();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const currentMessage = await Message.findOne({
      _id: messageId,
      conversationId: conversation._id,
      system: { $ne: true },
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: userId },
    }).lean();

    if (!currentMessage) {
      throw new ApiError(404, "Message not found");
    }

    const reactions = (currentMessage.reactions || []).filter((reaction) =>
      participantIds.has(reaction.userId.toString()),
    );
    const previousReaction = reactions.find(
      (reaction) => reaction.userId.toString() === userIdString,
    );

    let action;
    let nextReactions;

    if (previousReaction?.emoji === emoji) {
      action = "removed";
      nextReactions = reactions.filter(
        (reaction) => reaction.userId.toString() !== userIdString,
      );
    } else if (previousReaction) {
      action = "replaced";
      nextReactions = reactions.map((reaction) =>
        reaction.userId.toString() === userIdString
          ? { userId, emoji }
          : reaction,
      );
    } else {
      if (reactions.length >= participantIds.size) {
        throw new ApiError(409, "Every participant has already reacted");
      }
      action = "added";
      nextReactions = [...reactions, { userId, emoji }];
    }

    const legacyReaction = nextReactions.at(-1)?.emoji || "";

    const updatedMessage = await Message.findOneAndUpdate(
      {
        _id: currentMessage._id,
        conversationId: conversation._id,
        __v: currentMessage.__v,
      },
      {
        $set: {
          reactions: nextReactions,
          // Retained for clients that have not yet moved to reactions[].
          reacted: legacyReaction,
        },
        $inc: { __v: 1 },
      },
      { new: true, runValidators: true },
    ).lean();

    if (updatedMessage) {
      return {
        message: updatedMessage,
        action,
        emoji: action === "removed" ? previousReaction?.emoji : emoji,
      };
    }
  }

  throw new ApiError(409, "Reaction changed. Please try again");
};

const emitReaction = (conversationId, payload) => {
  io.to(conversationId.toString()).emit("messageReaction", payload);
  io.to(conversationId.toString()).emit("reacted", {
    ...payload,
    userId: payload.reaction.userId,
    reacted: payload.reacted || "",
  });
};

export const getMessages = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");
  await getParticipantConversation(id, _id, "_id participants");

  const { cursor, safeLimit } = parsePaginationParams(
    req,
    DEFAULT_MESSAGE_LIMIT,
    MAX_MESSAGE_LIMIT,
  );

  const baseQuery = {
    conversationId: id,
    deletedFor: { $ne: _id },
  };

  const query = buildPaginationQuery(baseQuery, cursor);

  const docs = await Message.find(query)
    .populate({
      path: "media",
      select: MEDIA_CLIENT_FIELDS,
    })
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const { page: messages, hasMore, nextCursor } = processPaginationResults(
    docs,
    safeLimit,
  );

  return res.status(200).json({
    success: true,
    message: "Fetch all messages successfully",
    messages,
    nextCursor,
    hasMore,
  });
});

export const getMessageImgs = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");
  await getParticipantConversation(id, _id, "_id participants");

  const { cursor, safeLimit } = parsePaginationParams(req, 5, 5);

  const baseQuery = {
    conversationId: id,
    deletedFor: { $ne: _id },
    deletedForEveryone: { $ne: true },
    $or: [
      { "image.url": { $exists: true } },
      { media: { $ne: null } },
    ],
  };

  const query = buildPaginationQuery(baseQuery, cursor);

  const docs = await Message.find(query)
    .populate({
      path: "media",
      select: MEDIA_CLIENT_FIELDS,
    })
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const { page: messages, hasMore, nextCursor } = processPaginationResults(
    docs,
    safeLimit,
  );

  return res.status(200).json({
    success: true,
    message: "Fetch all image messages successfully",
    messages,
    nextCursor,
    hasMore,
  });
});

export const searchMessages = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { q } = req.query;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");
  if (!q || q.trim().length === 0) throw new ApiError(401, "Missing field");
  await getParticipantConversation(id, _id, "_id participants");

  const { safeLimit } = parsePaginationParams(req, 20, 50);

  const messages = await Message.find(
    {
      conversationId: id,
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: _id },
      $text: { $search: q },
    },
    { score: { $meta: "textScore" } },
  )
    .select("_id text sender createdAt")
    .sort({ score: { $meta: "textScore" } })
    .limit(safeLimit)
    .lean();

  return res.status(200).json({
    success: true,
    message: "Search messages successfully",
    messages,
  });
});

export const sendMessage = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { text, image, mediaId, postId, replyToId } = req.body;
  const senderId = req.user._id;
  const messageText = typeof text === "string" ? text.trim() : "";

  if (!id) throw new ApiError(401, "Select Conversation");
  if (!messageText && !image && !mediaId && !postId) {
    throw new ApiError(400, "A message, attachment, or post is required");
  }

  if (image && mediaId) {
    throw new ApiError(400, "Send either legacy image or media, not both");
  }

  if (mediaId && !mongoose.isValidObjectId(mediaId)) {
    throw new ApiError(400, "Attachment is invalid");
  }

  const conversation = await getParticipantConversation(
    id,
    senderId,
    "_id participants",
  );

  let messageimage;
  let sharedPost = null;
  const replyTo = await createReplySnapshot(replyToId, id, senderId);

  if (image) {
    const key = StoragePath("", {
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: false,
      includeMessageFolder: true,
    });
    messageimage = await uploadChatPic(key, image);
  }

  if (postId) {
    const post = await Post.findById(postId)
      .select("image media caption disableShare isArchived")
      .lean();

    if (!post) throw new ApiError(400, "Post not found");
    if (post.disableShare)
      throw new ApiError(400, "This post cannot be shared");
    if (post.isArchived) throw new ApiError(400, "This post is archived");

    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

    sharedPost = {
      _id: post._id,
      image: post.image,
      media: post.media,
      caption: post.caption,
    };
  }

  const messageId = new mongoose.Types.ObjectId();
  let claimedMedia = null;

  if (mediaId) {
    claimedMedia = await Media.findOneAndUpdate(
      {
        _id: mediaId,
        owner: senderId,
        conversationId: conversation._id,
        purpose: "chat_attachment",
        status: "ready",
        attachedToId: null,
        attachedToModel: null
      }, {
      $set: {
        status: "attached",
        attachedToModel: "Message",
        attachedToId: messageId,
      }
    }, { new: true }
    )

    if (!claimedMedia) throw new ApiError(400, "Attachment is invalid or already used")
  }

  let createdMessage;

  try {
    createdMessage = await Message.create({
      _id: messageId,
      conversationId: conversation._id,
      sender: senderId,
      text: postId ? "Send a post" : messageText,
      image: messageimage,
      media: claimedMedia?._id ?? null,
      post: sharedPost,
      replyTo,
      seenBy: [senderId],
    });
  } catch (error) {
    if (claimedMedia) {
      await Media.updateOne(
        {
          _id: claimedMedia._id,
          attachedToId: messageId,
        },
        {
          $set: {
            status: "ready",
            attachedToModel: null,
            attachedToId: null,
          },
        },
      );
    }

    throw error;
  }

  const newMessage = await Message.findById(createdMessage._id)
    .populate({
      path: "media",
      select: MEDIA_CLIENT_FIELDS,
    })
    .lean();

  if (!newMessage) {
    throw new ApiError(500, "Created message could not be loaded");
  }

  await Conversation.updateOne({ _id: id }, { lastMessage: createdMessage._id });

  io.to(conversation._id.toString()).emit("newmessage", newMessage);

  return res.status(200).json({
    success: true,
    message: "Message create successfully",
    newMessage,
  });
});

export const updateMsgStatus = async (id, userId) => {
  try {
    const message = await Message.findById(id).lean();
    if (!message) return null;
    if (message.system) return null;
    if (message.sender?.toString() === userId.toString()) return null;

    const conversation = await Conversation.findById(message.conversationId)
      .select("participants")
      .lean();
    if (!conversation) return null;

    const senderId = message.sender?.toString();
    const participantIds = conversation.participants
      .filter((p) => senderId !== p.userId.toString())
      .map((p) => p.userId.toString());
    const seenBySet = new Set(
      (message.seenBy || []).map((sid) => sid.toString()),
    );
    seenBySet.add(userId.toString());
    const isSeen = participantIds.every((pid) => seenBySet.has(pid));

    const updated = await Message.findByIdAndUpdate(
      id,
      { $addToSet: { seenBy: userId }, isSeen },
      { new: true },
    ).lean();

    return updated;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const reactToMessage = asynchandller(async (req, res) => {
  const { conversationId, emoji } = req.body;
  const { id } = req.params;
  const { _id } = req.user;

  if (!conversationId || typeof emoji !== "string" || !emoji.trim()) {
    throw new ApiError(400, "A reaction is required");
  }
  if (emoji.trim().length > 32) {
    throw new ApiError(400, "Reaction is too long");
  }

  const conversation = await getParticipantConversation(
    conversationId,
    _id,
    "_id participants",
  );
  const result = await applyReaction({
    conversation,
    messageId: id,
    userId: _id,
    emoji: emoji.trim(),
  });
  const payload = {
    ...result.message,
    reaction: {
      userId: _id.toString(),
      emoji: result.emoji,
      action: result.action,
    },
  };

  emitReaction(conversation._id, payload);

  return res.status(200).json({
    success: true,
    message: result.action === "removed" ? "Reaction removed" : "Reaction updated",
    reaction: result.action,
    updatedMessage: payload,
  });
});

export const updateMessage = asynchandller(async (req, res) => {
  const { conversationId, text, emoji } = req.body;
  const { id } = req.params;
  const { _id } = req.user;

  if (!conversationId || (!text && !emoji)) {
    throw new ApiError(401, "Missing field");
  }
  if (emoji && (typeof emoji !== "string" || !emoji.trim() || emoji.trim().length > 32)) {
    throw new ApiError(400, "Reaction is invalid");
  }
  if (!emoji && (typeof text !== "string" || !text.trim())) {
    throw new ApiError(400, "Message text is required");
  }

  const conversation = await getParticipantConversation(
    conversationId,
    _id,
    "_id participants",
  );

  if (emoji) {
    const result = await applyReaction({
      conversation,
      messageId: id,
      userId: _id,
      emoji: emoji.trim(),
    });
    const payload = {
      ...result.message,
      reaction: {
        userId: _id.toString(),
        emoji: result.emoji,
        action: result.action,
      },
    };
    emitReaction(conversation._id, payload);

    return res.status(200).json({
      success: true,
      message: "Reaction updated",
      updatedMessage: payload,
    });
  }

  const message = await Message.findOneAndUpdate(
    {
      conversationId: conversation._id,
      _id: id,
      isSeen: false,
      sender: _id,
      deletedForEveryone: { $ne: true },
    },
    { text: text.trim() },
    { new: true },
  ).lean();
  if (!message) throw new ApiError(401, "Message not found");

  io.to(conversation._id.toString()).emit("messageUpdated", message);
  // Existing clients use this event for both edits and reactions.
  io.to(conversation._id.toString()).emit("reacted", {
    ...message,
    userId: _id.toString(),
  });

  return res.status(200).json({
    success: true,
    message: "Message updated successfully",
    updatedMessage: message,
  });
});

export const deleteMessage = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { conversationId, deleteType } = req.body;
  const { _id } = req.user;

  if (!conversationId || !["deleteForMe", "deleteForEveryone"].includes(deleteType)) {
    throw new ApiError(400, "Invalid delete request");
  }
  const conversation = await getParticipantConversation(
    conversationId,
    _id,
    "_id participants lastMessage",
  );

  const msg = await Message.findOne({
    conversationId: conversation._id,
    _id: id,
  }).lean();
  if (!msg) throw new ApiError(400, "Message not found");

  let message;
  if (deleteType === "deleteForMe") {
    message = await Message.findOneAndUpdate(
      { conversationId: conversation._id, _id: id },
      { $addToSet: { deletedFor: _id } },
      { new: true },
    );
  } else {
    if (msg.sender?.toString() !== _id.toString()) {
      throw new ApiError(403, "You cannot delete this message for everyone");
    }

    message = await Message.findOneAndUpdate(
      { conversationId: conversation._id, _id: id },
      {
        deletedForEveryone: true,
        reacted: "",
        reactions: [],
        image: null,
        media: null,
      },
      { new: true },
    );
    if (conversation.lastMessage?.toString() === msg._id.toString()) {
      await Conversation.updateOne(
        { _id: conversation._id },
        { lastMessage: message._id },
      );
    }
    await Message.updateMany(
      {
        conversationId: conversation._id,
        "replyTo.messageId": msg._id,
      },
      {
        $set: {
          "replyTo.preview": "This message was deleted",
          "replyTo.deleted": true,
        },
      },
    );
    if (msg.media) {
      await scheduleMediaDeletion({
        _id: msg.media,
        attachedToModel: "Message",
        attachedToId: msg._id,
      });
    }

    if (msg.image?.key) {
      await enqueueLegacyAssetDeletion({ keys: [msg.image.key] });
    }
  }

  io.to(conversation._id.toString()).emit("delete", message);
  if (deleteType !== "deleteForMe") {
    io.to(conversation._id.toString()).emit("replyTargetDeleted", {
      conversationId: conversation._id.toString(),
      messageId: msg._id.toString(),
    });
  }

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});

export const clearChat = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Missing field");
  const conversation = await getParticipantConversation(
    id,
    _id,
    "_id participants",
  );

  await Message.updateMany(
    { conversationId: id },
    { $addToSet: { deletedFor: _id } },
  );

  const mysocketId = getReceiverSocketId(_id);
  if (mysocketId) {
    io.to(mysocketId).emit("clearchat", conversation);
  }

  return res.status(200).json({
    success: true,
    message: "Chat clear successfully",
  });
});
