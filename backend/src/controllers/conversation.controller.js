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
    .populate('lastMessage','text sender')
    .lean();

  const filtered = await Promise.all(
    conversations.map(async (con) => {
      const otheruser = con.participants.filter(
        (par) => par.userId.toString() != _id.toString(),
      );
      const [user, unseen] = await Promise.all([
        User.findById(otheruser[0].userId)
          .select(" fullname profilePic ")
          .lean(),
        Message.countDocuments({ conversationId: con._id, isSeen: false }),
      ]);

      return {
        conversationId: con._id,
        oruserId: user._id,
        name: user.fullname,
        profilePic: user.profilePic,
        groupname: con.groupname,
        groupIcon: con.groupIcon,
        unseenMsg: unseen,
        bgImage: con.bgImage,
        lastmessage: con.lastMessage ? con.lastMessage : '',
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
    .select("-password -email")
    .lean();

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants")
    .lean();

  const filtered = users.filter((user) => {
    const exist = conversations.find((con) =>
      con.participants.find(  (par) => par.userId.toString() === user._id.toString()),
    );
    return !exist;
  });

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    filtered,
  });
});
