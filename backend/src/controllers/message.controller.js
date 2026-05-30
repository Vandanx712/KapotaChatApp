import { deleteImage, uploadChatPic } from "../lib/cloudinary.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Post } from "../models/post.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const DEFAULT_MESSAGE_LIMIT = 30;
const MAX_MESSAGE_LIMIT = 100;

export const getMessages = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { cursor, limit } = req.query;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_MESSAGE_LIMIT, 1),
    MAX_MESSAGE_LIMIT,
  );

  const query = {
    conversationId: id,
    deletedFor: { $ne: _id },
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await Message.find(query)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = docs.length > safeLimit;
  const page = hasMore ? docs.slice(0, safeLimit) : docs;
  const messages = page.reverse();
  const nextCursor = hasMore ? messages[0]._id : null;

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
  const { cursor, limit } = req.query;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");

  const query = {
    conversationId: id,
    deletedFor: { $ne: _id },
    "image.url": { $exists: true },
  };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await Message.find(query).sort({ _id: -1 }).limit(6).lean();

  const hasMore = docs.length > 5;
  const page = hasMore ? docs.slice(0, 5) : docs;
  const messages = page.reverse();
  const nextCursor = hasMore ? messages[0]._id : null;

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
  const { q, limit } = req.query;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select Conversation");
  if (!q || q.trim().length === 0) throw new ApiError(401, "Missing field");

  const safeLimit = Math.min(parseInt(limit, 10) || 20, 50);
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
  const { text, image, postId } = req.body;
  const senderId = req.user._id;

  if (!id) throw new ApiError(401, "Select Conversation");

  const conversation = await Conversation.findById(id).lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  let messageimage;
  let sharedPost = null;

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
    const post = await Post.findById(postId).select("image").lean();

    if (!post) throw new ApiError(400, "Post not found");
    if (post.disableShare)
      throw new ApiError(400, "This post cannot be shared");
    if (post.isArchived) throw new ApiError(400, "This post is archived");

    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

    sharedPost = {
      _id: post._id,
      image: post.image,
    };
  }

  const newMessage = await Message.create({
    conversationId: id,
    sender: senderId,
    text: postId ? "Send a post" : text,
    image: messageimage,
    post: sharedPost,
    seenBy: [senderId],
  });

  await Conversation.updateOne({ _id: id }, { lastMessage: newMessage._id });

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

export const updateMessage = asynchandller(async (req, res) => {
  const { conversationId, text, emoji } = req.body;
  const { id } = req.params;
  const { _id } = req.user;

  if (!conversationId || (!text && !emoji))
    throw new ApiError(401, "Missing field");

  const conversation = await Conversation.findById(conversationId)
    .select("_id participants")
    .lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  let message = {};
  if (emoji) {
    message = await Message.findOneAndUpdate(
      { conversationId: conversation._id, _id: id },
      { reacted: emoji },
      { new: true },
    );
  } else {
    message = await Message.findOneAndUpdate(
      { conversationId: conversation._id, _id: id, isSeen: false },
      { text: text },
      { new: true },
    );
  }
  if (!message) throw new ApiError(401, "Message not found");

  const msg = { ...message._doc, userId: _id };

  io.to(conversation._id.toString()).emit("reacted", msg);

  return res.status(200).json({
    success: true,
    message: "Upadte message successfully",
  });
});

export const deleteMessage = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { conversationId, deleteType } = req.body;
  const { _id } = req.user;

  if (!conversationId || !deleteType) throw new ApiError(401, "Missing field");
  const conversation = await Conversation.findById(conversationId)
    .select("_id participants lastMessage")
    .lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

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
    message = await Message.findOneAndUpdate(
      { conversationId: conversation._id, _id: id },
      {
        deletedForEveryone: true,
        reacted: "",
        image: null,
      },
      { new: true },
    );
    if (conversation.lastMessage.toString() === msg._id.toString()) {
      await Conversation.updateOne(
        { _id: conversation._id },
        { lastMessage: message._id },
      );
    }
    msg.image && (await deleteImage(msg.image?.key));
  }

  io.to(conversation._id.toString()).emit("delete", message);

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});

export const clearChat = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Missing field");
  const conversation = await Conversation.findById(id).select("_id").lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

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
