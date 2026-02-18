import { deleteImage, uploadChatPic } from "../lib/cloudinary.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getMessages = asynchandller(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(401, "Select Conversation");

  const messages = await Message.find({ conversationId: id }).lean();

  return res.status(200).json({
    success: true,
    message: "Fetch all messages successfully",
    messages,
  });
});

export const sendMessage = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { text, image } = req.body;
  const senderId = req.user._id;

  if (!id) throw new ApiError(401, "Select Conversation");

  const conversation = await Conversation.findById(id).lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  let messageimage;

  if (image) {
    const key = StoragePath("", {
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: false,
      includeMessageFolder: true,
    });
    messageimage = await uploadChatPic(key, image);
  }

  const newMessage = await Message.create({
    conversationId: id,
    sender: senderId,
    text: text,
    image: messageimage,
  });

  await Conversation.updateOne({ _id: id }, { lastMessage: newMessage._id });

  const oruser = conversation.participants.find(
    (user) => user.userId.toString() !== senderId.toString(),
  );

  const mysocketId = getReceiverSocketId(senderId);
  if (mysocketId) {
    io.to(mysocketId).emit("newmessage", newMessage);
  }

  const receiversocketId = getReceiverSocketId(oruser.userId);
  if (receiversocketId) {
    io.to(receiversocketId).emit("newmessage", newMessage);
  }

  return res.status(200).json({
    success: true,
    message: "Message create successfully",
    newMessage,
  });
});

export const updateMsgStatus = async (id, userId) => {
  try {
    await Message.updateOne(
      {
        _id: id,
      },
      { seenBy: userId, isSeen: true },
    );
  } catch (error) {
    console.log(error);
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

  const oruser = conversation.participants.find(
    (user) => user.userId.toString() !== _id.toString(),
  );

  const msg = { ...message._doc, userId: _id };
  const mysocketId = getReceiverSocketId(_id);
  if (mysocketId) {
    io.to(mysocketId).emit("reacted", msg);
  }

  const receiversocketId = getReceiverSocketId(oruser.userId);
  if (receiversocketId) {
    io.to(receiversocketId).emit("reacted", msg);
  }

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
        text: "🚫 This message was deleted",
        reacted: "",
        image: null,
      },
      { new: true },
    );
    if (conversation.lastMessage.toString() === id) {
      await Conversation.updateOne(
        { _id: conversation._id },
        { lastMessage: message._id },
      );
    }
    msg.image && await deleteImage(msg.image?.key);
  }

  const oruser = conversation.participants.find(
    (user) => user.userId.toString() !== _id.toString(),
  );

  const mysocketId = getReceiverSocketId(_id);
  if (mysocketId) {
    io.to(mysocketId).emit("delete", msg);
  }

  const receiversocketId = getReceiverSocketId(oruser.userId);
  if (receiversocketId) {
    io.to(receiversocketId).emit("delete", msg);
  }

  return res.status(200).json({
    success: true,
    message: "Message deleted successfully",
  });
});
