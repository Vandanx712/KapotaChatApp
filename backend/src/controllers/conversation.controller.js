import { asynchandller } from "../util/asynchandller.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";

export const getConversation = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants groupname groupIcon lastMessage")
    .lean();

  const filtered = await Promise.all(
    conversations.map(async (con) => {
      const otheruser = con.participants.filter(
        (par) => par.userId.toString() != _id.toString()
      );
      const [user, message] = await Promise.all([
        User.findById(otheruser[0].userId).select(" fullname profilePic ").lean(),
        con.lastMessage
          ? Message.find({conversationId:con._id,isSeen:false}).select("text").lean()
          : "",
      ]);

      return {
        conversationId: con._id,
        oruserId: user._id,
        name: user.fullname,
        profilePic: user.profilePic,
        groupname: con.groupname,
        groupIcon: con.groupIcon,
        unseenMsg:message.length,
        lasmessage: message[message.length - 1].text,
      };
    }),
  );

  return res.status(200).json({
    success: true,
    message: "Fetch conversations successfully",
    filtered,
  });
});

export const createConversation = asynchandller(async (req, res) => {
  const { oruserId } = req.params;
  const { _id } = req.user;

  if (!oruserId)
    throw new ApiError(401, "Please select user to start new conversation");

  const existed = await Conversation.findOne({
    "participants.userId": { $all: [oruserId, _id] },
  })
    .select("_id")
    .lean();
  if (existed)
    return res.status(400).json({
      success: false,
      message: "Conversation with this user is allready exist",
    });

  await Conversation.create({
    participants: [{ userId: _id }, { userId: oruserId }],
  });

  return res.status(200).json({
    success: true,
    message: "New conversation create successfully",
  });
});

//get surrounding users
export const getSurrUsers = asynchandller(async (req, res) => {
  const { _id } = req.user;
  const users = await User.find({ _id: { $ne: _id } })
    .select("-password")
    .lean();

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    users,
  });
});
