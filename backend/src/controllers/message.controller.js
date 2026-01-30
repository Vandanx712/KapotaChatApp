import { uploadChatPic } from "../lib/cloudinary.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";

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

  if (!text || !image) throw new ApiError(401, "Missings Field");
  if (!id) throw new ApiError(401, "Select Conversation");

  let messageimage;

  if (image) {
    const key = StoragePath({
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: false,
      includeMessageFolder: true,
    });
    messageimage = uploadChatPic(key,image)
  }

  const newMessage = await Message.create({
    conversationId:id,
    sender:senderId,
    text:text,
    image:messageimage
  })

  // socket logic 

  return res.status(200).json({
    success:true,
    message:'Message create successfully',
    newMessage
  })
});
