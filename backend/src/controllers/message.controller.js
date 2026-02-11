import { uploadChatPic } from "../lib/cloudinary.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getMessages = asynchandller(async (req, res) => {
  const { id } = req.params;

  if (!id) throw new ApiError(401, "Select Conversation");

  const [conversationDetail, messages] = await Promise.all([
    Conversation.findById(id).lean(),
    Message.find({ conversationId: id }).lean(),
  ]);

  return res.status(200).json({
    success: true,
    message: "Fetch all messages successfully",
    conversationId: conversationDetail._id,
    bgImage: conversationDetail.bgImage,
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
  const oruser = conversation.participants.find(
    (user) => user.userId.toString() !== senderId.toString(),
  );

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

export const updateMsgStatus = async (id,userId) => {  try {
    await Message.updateOne(
      {
        _id:id,
      },
      { seenBy:userId ,isSeen:true},
    );
  } catch (error) {console.log(error)}
};
