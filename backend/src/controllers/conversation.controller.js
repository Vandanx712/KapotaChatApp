import { asynchandller } from "../util/asynchandller.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const getConversation = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants.userId groupname groupIcon lastMessage")
    .lean();

  const filtered = conversations.map(async (con) => {
    const otheruser = con.participants.find((par) => par.userId !== _id);
    const [user, message] = await Promise.all([
      User.findById(otheruser.userId).select("name profilePic").lean(),
      con.lastMessage
        ? Message.findById(con.lastMessage).select("content").lean()
        : "",
    ]);

    return {
      conversationId: con._id,
      oruserId:user._id,
      name: user.fullname,
      profilePic: user.profilePic,
      groupname : con.groupname,
      groupIcon : con.groupIcon,
      lasmessage: con.lastMessage ? message.content:'',
    };
  });

  return res.status(200).json({
    success: true,
    message: "Fetch conversations successfully",
    filtered,
  });
});
