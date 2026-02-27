import { asynchandller } from "../util/asynchandller.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";
import { deleteImage, uploadChatPic } from "../lib/cloudinary.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

let userconversations = [];
export const getUserConversations = () => {
  return userconversations.map((con) => con._id);
};

export const getConversation = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants groupname bgImage groupIcon lastMessage")
    .populate("lastMessage", "text image sender deletedFor deletedForEveryone")
    .sort({ updatedAt: -1 })
    .lean();

  userconversations = conversations;

  const filtered = await Promise.all(
    conversations.map(async (con) => {
      const groupdetail = {};

      if (con.groupname) {
        groupdetail.groupname = con.groupname;
        groupdetail.groupIcon = con.groupIcon;
        const membersDetail = {};
        for (const member of con.participants) {
          const memberdetail = await User.findById(member.userId)
            .select("fullname")
            .lean();
          if (!membersDetail[member.userId]) {
            membersDetail[member.userId.toString()] = {
              fullname: memberdetail.fullname,
              role: member.role,
            };
          }
        }
        groupdetail.membersDetail = membersDetail;
      }

      const otheruser = con.participants.find(
        (par) => par.userId.toString() != _id.toString(),
      );
      const [user, unseen] = await Promise.all([
        User.findById(otheruser.userId).select(" fullname profilePic ").lean(),
        Message.countDocuments({ conversationId: con._id, isSeen: false }),
      ]);

      return {
        conversationId: con._id,
        oruserId: user._id,
        name: user.fullname,
        profilePic: user.profilePic,
        isgroup: con.groupname ? true : false,
        groupdetail,
        unseenMsg: unseen,
        bgImage: con.bgImage,
        lastmessage: con.lastMessage ? con.lastMessage : "",
      };
    }),
  );

  return res.status(200).json({
    success: true,
    message: "Fetch conversations successfully",
    filtered,
  });
});

//conversation create part
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

export const createGroup = asynchandller(async (req, res) => {
  const { participants, groupname, groupIcon } = req.body;

  if (
    [groupname, groupIcon].some((field) => field == "") &&
    participants.length == 0
  )
    throw new ApiError(401, "Missing fields");

  const incorrectformat = participants.filter(
    (par) => !par.userId || !par.role,
  );
  if (incorrectformat.length > 0)
    throw new ApiError(401, "Something missing in the members field");

  const existedgroup = await Conversation.findOne({ groupname: groupname })
    .select("_id")
    .lean();
  if (existedgroup) throw new ApiError(400, "A groupname already exist");

  const path = StoragePath("", {
    includeMainFolder: true,
    includeAvatarFolder: false,
    includeUserProfilePic: false,
    includeConversation: true,
    includeMessageFolder: false,
  });

  const groupimg = await uploadChatPic(path, groupIcon);

  const newgroup = await Conversation.create({
    participants,
    groupname,
    groupIcon: groupimg,
  });

  // participants.forEach(par => {
  //   const socketId = getReceiverSocketId(par.userId);
  //   if(socketId) {
  //     io.to(socketId).emit('creategroup')
  //   }
  // });

  return res.status(200).json({
    success: true,
    message: "Group create successfully",
  });
});

export const setBgimage = asynchandller(async (req, res) => {
  const { id, oldkey, image } = req.body;

  const conversation = await Conversation.findById(id).select("_id").lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  if (oldkey) {
    await deleteImage(oldkey);
  }

  const path = StoragePath("", {
    includeMainFolder: true,
    includeAvatarFolder: false,
    includeUserProfilePic: false,
    includeConversation: true,
    includeMessageFolder: false,
  });

  const bgimage = await uploadChatPic(path, image);

  await Conversation.updateOne({ _id: conversation._id }, { bgImage: bgimage });
  return res.status(200).json({
    success: true,
    message: "Update Chat theme successfully",
    bgimage,
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
      con.participants.find(
        (par) => par.userId.toString() === user._id.toString(),
      ),
    );
    return !exist;
  });

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    filtered,
  });
});
