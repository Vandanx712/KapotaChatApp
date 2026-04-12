import { asynchandller } from "../util/asynchandller.js";
import { Conversation } from "../models/conversation.model.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../util/apierror.js";
import { deleteImage, uploadChatPic } from "../lib/cloudinary.js";
import { StoragePath } from "../util/filepath.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const DEFAULT_USERS_LIMIT = 30;
const MAX_USERS_LIMIT = 100;

const getConversationRoomId = (conversation) => {
  const id = conversation?.conversationId || conversation?._id;
  return id ? id.toString() : "";
};

const createSystemMessages = async (conversationId, texts) => {
  if (!texts.length) return [];
  const payload = texts.map((text) => ({
    conversationId,
    text,
    system: true,
    isSeen: true,
  }));
  return Message.insertMany(payload);
};

const emitSystemMessages = async (messages, conversation, type) => {
  if (!messages.length || !conversation) return;
  messages.forEach((newMessage) => {
    io.to(conversation._id.toString()).emit("newmessage", newMessage);
  });

  if (!conversation.groupname) return;
  const con = await buildGroupConversationPayload(conversation);
  if (con) emitRefresh(type, con);
};

const emitRefresh = (type, conversation) => {
  const roomId = getConversationRoomId(conversation);
  if (!roomId) return;
  io.to(roomId).emit("refresh", type, conversation);
};

const joinUsersToRoom = async (userIds, room, isgroup) => {
  const uniqueIds = Array.from(new Set(userIds.map((id) => id.toString())));
  const roomId = getConversationRoomId(room);
  const groupPayload = isgroup
    ? await buildGroupConversationPayload(room)
    : null;
  uniqueIds.forEach((userId) => {
    const socketId = getReceiverSocketId(userId);
    if (!socketId) return;
    const socket = io.sockets.sockets.get(socketId);
    if (socket && roomId) socket.join(roomId);
    if (isgroup && groupPayload) {
      io.to(socketId).emit("refresh", "NEW_CONVERSATION", groupPayload);
    }
  });
};

const leaveUsersFromRoom = (userIds, room) => {
  const uniqueIds = Array.from(new Set(userIds.map((id) => id.toString())));
  const roomId = getConversationRoomId(room);
  uniqueIds.forEach((userId) => {
    const socketId = getReceiverSocketId(userId);
    if (!socketId) return;
    const socket = io.sockets.sockets.get(socketId);
    if (socket && roomId) socket.leave(roomId);
    io.to(socketId).emit("refresh", "EXIT_GROUP", room);
  });
};

const getUserDetail = async (id) => {
  const user = await User.findById(id).select("fullname profilePic").lean();
  return user;
};

const getMemberDetail = async (conversation) => {
  const groupdetail = {
    groupname: conversation.groupname,
    groupIcon: conversation.groupIcon,
    membersDetail: {},
  };

  for (const p of conversation.participants) {
    const isPopulated =
      p.userId && typeof p.userId === "object" && p.userId.fullname;

    let userData;
    let userIdString;

    if (isPopulated) {
      userData = p.userId;
      userIdString = p.userId._id.toString();
    } else {
      userIdString = p.userId.toString();
      userData = await getUserDetail(p.userId);
    }

    if (userData) {
      groupdetail.membersDetail[userIdString] = {
        fullname: userData.fullname,
        role: p.role,
        profilePic: userData.profilePic,
      };
    }
  }

  return groupdetail;
};

const buildGroupConversationPayload = async (conversation) => {
  if (!conversation?.groupname) return null;
  const groupdetail = await getMemberDetail(conversation);
  return {
    conversationId: conversation._id,
    oruserId: "",
    name: "",
    profilePic: "",
    isgroup: true,
    groupdetail,
    unseenMsg: 0,
    bgImage: conversation.bgImage ?? {},
    lastmessage: conversation.lastMessage ? conversation.lastMessage : "",
  };
};

export const getConversation = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants groupname bgImage groupIcon lastMessage")
    .populate("lastMessage", "text image sender deletedFor deletedForEveryone")
    .populate({
      path: "participants.userId",
      select: "_id fullname profilePic",
    })
    .sort({ updatedAt: -1 })
    .lean();

  if (!conversations.length) {
    return res.status(200).json({ success: true, filtered: [] });
  }

  const conversationIds = conversations.map((c) => c._id);
  const unseenCounts = await Message.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        sender: { $ne: _id },
        deletedFor: { $ne: _id },
        deletedForEveryone: { $ne: true },
        system: { $ne: true },
        seenBy: { $ne: _id },
      },
    },
    {
      $group: {
        _id: "$conversationId",
        count: { $sum: 1 },
      },
    },
  ]);

  const unseenMap = unseenCounts.reduce((acc, curr) => {
    acc[curr._id.toString()] = curr.count;
    return acc;
  }, {});

  const filtered = await Promise.all(
    conversations.map(async (con) => {
      const groupdetail = con.groupname ? await getMemberDetail(con) : {};

      const otheruser = con.participants.find(
        (par) => par.userId._id.toString() != _id.toString(),
      );

      return {
        conversationId: con._id,
        oruserId: otheruser?.userId?._id ?? "",
        name: otheruser?.userId?.fullname ?? "",
        profilePic: otheruser?.userId?.profilePic ?? "",
        isgroup: con.groupname ? true : false,
        groupdetail,
        unseenMsg: unseenMap[con._id.toString()] || 0,
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

  const newConversation = await Conversation.create({
    participants: [{ userId: _id }, { userId: oruserId }],
  });

  await joinUsersToRoom(
    newConversation.participants.map((par) => par.userId),
    newConversation,
    false,
  );

  const currentUser = await getUserDetail(_id);
  const otherUser = await getUserDetail(oruserId);
  if (!otherUser) throw new ApiError(400, "User not found");

  const baseConversation = {
    conversationId: newConversation._id,
    isgroup: false,
    groupdetail: {},
    unseenMsg: 0,
    bgImage: newConversation.bgImage ?? {},
    lastmessage: newConversation.lastMessage ? newConversation.lastMessage : "",
  };

  const forCurrentUser = {
    ...baseConversation,
    oruserId: otherUser._id,
    name: otherUser.fullname,
    profilePic: otherUser.profilePic,
  };

  const forOtherUser = {
    ...baseConversation,
    oruserId: currentUser?._id || _id,
    name: currentUser?.fullname || "",
    profilePic: currentUser?.profilePic || "",
  };

  const currentSocketId = getReceiverSocketId(_id.toString());
  if (currentSocketId) {
    io.to(currentSocketId).emit("refresh", "NEW_CONVERSATION", forCurrentUser);
  }

  const otherSocketId = getReceiverSocketId(oruserId.toString());
  if (otherSocketId) {
    io.to(otherSocketId).emit("refresh", "NEW_CONVERSATION", forOtherUser);
  }
  return res.status(200).json({
    success: true,
    message: "New conversation create successfully",
  });
});

export const deleteConversation = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Missing field");

  const conversation = await Conversation.findById(id).lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  const user = conversation.participants.find(
    (u) => u.userId.toString() == _id.toString(),
  );
  if (user.role !== "admin" && conversation.groupname)
    throw new ApiError(400, "you can't perform this action");

  const messages = await Message.find({
    conversationId: conversation._id,
  }).lean();

  for (const message of messages) {
    if (message.image) {
      await deleteImage(message.image?.key);
    }
  }

  await Message.deleteMany({ conversationId: conversation._id });
  if (conversation.bgImage) {
    await deleteImage(conversation.bgImage.key);
  }
  if (conversation.groupIcon) {
    await deleteImage(conversation.groupIcon.key);
  }
  const participantIds = conversation.participants.map((p) =>
    p.userId.toString(),
  );

  emitRefresh("DELETE_CONVERSATION", conversation);

  await Conversation.deleteOne({ _id: conversation._id });
  return res.status(200).json({
    success: true,
    message: "Conversation delete successfully",
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
  const { cursor, limit } = req.query;

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_USERS_LIMIT, 1),
    MAX_USERS_LIMIT,
  );

  const conversations = await Conversation.find({
    "participants.userId": { $eq: _id },
  })
    .select("participants")
    .lean();

  const userIdSet = new Set([_id.toString()]);

  for (const conversation of conversations) {
    for (const participant of conversation.participants) {
      userIdSet.add(participant.userId.toString());
    }
  }

  const userIds = Array.from(userIdSet);

  const query = {
    _id: { $nin: userIds },
  };

  if (cursor) {
    query._id.$lt = cursor;
  }

  const docs = await User.find(query)
    .select("-password -email")
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = docs.length > safeLimit;
  const users = hasMore ? docs.slice(0, safeLimit) : docs;
  const nextCursor = hasMore ? users[users.length - 1]._id : null;

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    users,
    filtered: users,
    nextCursor,
    hasMore,
  });
});

//group part

export const createGroup = asynchandller(async (req, res) => {
  const { participants, groupname, groupIcon } = req.body;
  const { _id } = req.user;

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

  const actor = await getUserDetail(_id);
  const actorName = actor?.fullname || "Someone";
  const participantIds = participants.map((p) => p.userId.toString());
  await joinUsersToRoom(participantIds, newgroup, true);
  const addedIds = participantIds.filter((id) => id !== _id.toString());
  if (addedIds.length > 0) {
    const addedUsers = await User.find({ _id: { $in: addedIds } })
      .select("fullname")
      .lean();
    const nameMap = new Map(
      addedUsers.map((user) => [user._id.toString(), user.fullname]),
    );
    const texts = addedIds.map(
      (id) => `${actorName} added ${nameMap.get(id) || "a member"}`,
    );
    const systemMessages = await createSystemMessages(newgroup._id, texts);
    newgroup.lastMessage = systemMessages[systemMessages.length - 1]._id;
    await newgroup.save();
    emitSystemMessages(systemMessages, newgroup, "NEW_CONVERSATION");
  }

  return res.status(200).json({
    success: true,
    message: "Group create successfully",
  });
});

export const updateGroupDetail = asynchandller(async (req, res) => {
  const { conversationId, groupname, groupIcon, oldkey } = req.body;
  const { _id } = req.user;

  if (!conversationId || !groupname) throw new ApiError(401, "Missing Field");

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) throw new ApiError(400, "Conversation not found");

  const user = conversation.participants.find(
    (u) => u.userId.toString() == _id.toString(),
  );
  if (user.role !== "admin")
    throw new ApiError(400, "you can't perform this action");

  conversation.groupname = groupname;
  if (groupIcon) {
    const path = StoragePath("", {
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: false,
      includeConversation: true,
      includeMessageFolder: false,
    });
    await deleteImage(oldkey);
    conversation.groupIcon = await uploadChatPic(path, groupIcon);
  }
  await conversation.save();

  io.to(conversation._id.toString()).emit("udGroupDetail", conversation);

  return res.status(200).json({
    success: true,
    message: "Update group detail successfully",
  });
});

export const getOtherUsers = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const { cursor, limit } = req.query;
  if (!id) throw new ApiError(401, "Select group conversation");

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_USERS_LIMIT, 1),
    MAX_USERS_LIMIT,
  );

  const conversation = await Conversation.findById(id).lean();
  if (!conversation) throw new ApiError(400, "Conversation not found");

  const userIds = [
    ...conversation.participants.map((user) => user.userId.toString()),
    _id.toString(),
  ];

  const query = {
    _id: { $nin: userIds },
  };

  if (cursor) {
    query._id.$lt = cursor;
  }

  const docs = await User.find(query)
    .select("-password -email")
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = docs.length > safeLimit;
  const users = hasMore ? docs.slice(0, safeLimit) : docs;
  const nextCursor = hasMore ? users[users.length - 1]._id : null;

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    users,
    filtered: users,
    nextCursor,
    hasMore,
  });
});

export const updateMembers = asynchandller(async (req, res) => {
  const { id, participants } = req.body;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select group");
  if (participants.length == 0)
    throw new ApiError(401, "At least 1 member is required");

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(400, "Conversation not found");

  const user = conversation.participants.find(
    (u) => u.userId.toString() == _id.toString(),
  );
  if (user.role !== "admin")
    throw new ApiError(400, "you can't perform this action");

  const prevIds = conversation.participants.map((p) => p.userId.toString());
  const nextIds = participants.map((p) => p.userId.toString());
  const addedIds = nextIds.filter((id) => !prevIds.includes(id));
  const removedIds = prevIds.filter((id) => !nextIds.includes(id));

  conversation.participants = participants;
  await conversation.save();

  await joinUsersToRoom(addedIds, conversation, true);
  leaveUsersFromRoom(removedIds, conversation);

  if (addedIds.length > 0 || removedIds.length > 0) {
    const actor = await getUserDetail(_id);
    const actorName = actor?.fullname || "Someone";
    const changedIds = [...new Set([...addedIds, ...removedIds])];
    const changedUsers = await User.find({ _id: { $in: changedIds } })
      .select("fullname")
      .lean();
    const nameMap = new Map(
      changedUsers.map((u) => [u._id.toString(), u.fullname]),
    );

    const texts = [
      ...addedIds.map(
        (id) => `${actorName} added ${nameMap.get(id) || "a member"}`,
      ),
      ...removedIds.map(
        (id) => `${actorName} removed ${nameMap.get(id) || "a member"}`,
      ),
    ];

    const systemMessages = await createSystemMessages(conversation._id, texts);
    conversation.lastMessage = systemMessages[systemMessages.length - 1]._id;
    await conversation.save();
    emitSystemMessages(systemMessages, conversation, "UPDATE_MEMBERS");
  }

  return res.status(200).json({
    success: true,
    message: "Member update successfully",
  });
});

export const exitGroup = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select conversation");

  const conversation = await Conversation.findById(id);
  if (!conversation) throw new ApiError(400, "Conversation not found");

  const user = conversation.participants.find(
    (u) => u.userId.toString() == _id.toString(),
  );

  const index = conversation.participants.indexOf(user);
  if (user.role == "admin") {
    const admins = conversation.participants.filter(
      (par) => par.role == "admin" && par.userId.toString() !== _id.toString(),
    );
    if (admins.length == 0) {
      if (index > -1) {
        const nextIndex = (index + 1) % conversation.participants.length;
        conversation.participants[nextIndex].role = "admin";
      }
    }
  }

  leaveUsersFromRoom([_id], conversation);

  const userdetail = await getUserDetail(_id);
  const text = [`${userdetail.fullname} left`];

  const systemMessages = await createSystemMessages(conversation._id, text);
  conversation.lastMessage = systemMessages[systemMessages.length - 1]._id;

  conversation.participants.splice(index, 1);
  await conversation.save();
  emitSystemMessages(systemMessages, conversation, "UPDATE_MEMBERS");

  return res.status(200).json({
    success: true,
    message: "Exit group successfully",
  });
});
