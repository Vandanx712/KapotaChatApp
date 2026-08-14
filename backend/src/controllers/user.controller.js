import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { deleteImage, getAvatars, uploadChatPic } from "../lib/cloudinary.js";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import {
  enqueueLegacyAssetDeletion,
  scheduleMediaDeletion,
} from "../lib/jobsQueue.js";
import { Session } from "../models/session.model.js";
import { io } from "../lib/socket.js";
import { TrustedDevice } from "../models/trustedDevice.model.js";
import {
  clearTrustedDeviceCookie,
  requirePrimaryTrustedDevice,
} from "../lib/tonken.js";
import {
  DEFAULT_USERS_LIMIT,
  MAX_USERS_LIMIT,
  parsePaginationParams,
  buildPaginationQuery,
  processPaginationResults,
} from "../util/pagination.js";

const queueAssetCleanup = async ({ keys = [], messages = [] }) => {
  const filteredKeys = [...new Set(keys.filter(Boolean))];
  if (filteredKeys.length === 0 && messages.length === 0) return;

  await enqueueLegacyAssetDeletion({
    keys: filteredKeys,
    messages,
  });
};

//getall predefind avatars
export const getPreAvatars = asynchandller(async (req, res) => {
  const { gender } = req.body;
  if (!gender) throw new ApiError(401, "Missing field");

  const path = StoragePath(gender, {
    includeMainFolder: true,
    includeAvatarFolder: true,
    includeUserProfilePic: false,
    includeMessageFolder: false,
  });

  const avatars = await getAvatars(path);

  return res.status(200).json({
    success: true,
    message: "Fetch all preavatars successfully",
    avatars,
  });
});

export const updateProfilePic = asynchandller(async (req, res) => {
  const { profilePic, picUrl, oldkey } = req.body;
  const { _id } = req.user;

  let pic;
  if (profilePic) {
    const path = StoragePath("", {
      includeMainFolder: true,
      includeAvatarFolder: false,
      includeUserProfilePic: true,
      includeMessageFolder: false,
    });
    pic = await uploadChatPic(path, profilePic);
    if (oldkey.length > 0) {
      await deleteImage(oldkey);
    }
  } else if (picUrl) {
    pic = picUrl;
  }

  const user = await User.findByIdAndUpdate(
    _id,
    { profilePic: pic },
    { new: true },
  ).select("-password");

  return res.status(200).json({
    success: true,
    message: "ProfilePic update successfully",
    user,
  });
});

export const updateProfile = asynchandller(async (req, res) => {
  const { fullname, bio } = req.body;
  const { _id } = req.user;

  if (!fullname || !bio) throw new ApiError(401, "Missing field");
  const user = await User.findByIdAndUpdate(
    _id,
    { fullname, bio },
    { new: true },
  ).select("-password");

  return res.status(200).json({
    success: true,
    message: "Profile update successfully",
    user,
  });
});

export const deleteAccount = asynchandller(async (req, res) => {
  const { password } = req.body;
  const { _id } = req.user;

  await requirePrimaryTrustedDevice(req);

  if (!password) throw new ApiError(401, "Password is required");

  const user = await User.findById(_id).select("password profilePic");
  if (!user) throw new ApiError(404, "User not found");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(400, "Invalid password");

  const userPosts = await Post.find({ user: _id })
    .select("_id image media")
    .lean();
  const postIds = userPosts.map((post) => post._id);

  const conversations = await Conversation.find({
    "participants.userId": _id,
  })
    .select("participants groupname bgImage groupIcon")
    .lean();

  const directConversations = conversations.filter(
    (conversation) => !conversation.groupname,
  );
  const groupConversations = conversations.filter((conversation) =>
    Boolean(conversation.groupname),
  );
  const directConversationIds = directConversations.map(
    (conversation) => conversation._id,
  );

  const keysToDelete = [
    user.profilePic?.key,
    ...userPosts.map((post) => post.image?.key),
    ...directConversations.map((conversation) => conversation.bgImage?.key),
    ...directConversations.map((conversation) => conversation.groupIcon?.key),
  ];

  const mediaMessages = [];
  const mediaIdsToDelete = userPosts.map((post) => post.media).filter(Boolean);

  if (directConversationIds.length > 0) {
    const directMessages = await Message.find({
      conversationId: { $in: directConversationIds },
    })
      .select("image media")
      .lean();

    mediaMessages.push(...directMessages);
    mediaIdsToDelete.push(
      ...directMessages.map((message) => message.media).filter(Boolean),
    );

    await Message.deleteMany({
      conversationId: { $in: directConversationIds },
    });
    await Conversation.deleteMany({
      _id: { $in: directConversationIds },
    });
  }

  for (const conversation of groupConversations) {
    const currentParticipant = conversation.participants.find(
      (participant) => participant.userId.toString() === _id.toString(),
    );

    const remainingParticipants = conversation.participants.filter(
      (participant) => participant.userId.toString() !== _id.toString(),
    );

    if (remainingParticipants.length === 0) {
      keysToDelete.push(conversation.bgImage?.key, conversation.groupIcon?.key);

      const groupMessages = await Message.find({
        conversationId: conversation._id,
      })
        .select("image media")
        .lean();

      mediaMessages.push(...groupMessages);
      mediaIdsToDelete.push(
        ...groupMessages.map((message) => message.media).filter(Boolean),
      );

      await Message.deleteMany({ conversationId: conversation._id });
      await Conversation.deleteOne({ _id: conversation._id });
      continue;
    }

    const hasAdmin = remainingParticipants.some(
      (participant) => participant.role === "admin",
    );

    if (currentParticipant?.role === "admin" && !hasAdmin) {
      remainingParticipants[0] = {
        ...remainingParticipants[0],
        role: "admin",
      };
    }

    await Conversation.updateOne(
      { _id: conversation._id },
      { participants: remainingParticipants },
    );
  }

  if (postIds.length > 0) {
    await Message.updateMany(
      { "post._id": { $in: postIds } },
      {
        $set: { "post.unavailable": true },
        $unset: { "post.image": "", "post.media": "" },
      },
    );

    await Like.deleteMany({
      $or: [{ user: _id }, { post: { $in: postIds } }],
    });
    await Post.deleteMany({ _id: { $in: postIds } });
  } else {
    await Like.deleteMany({ user: _id });
  }

  const sessions = await Session.find({
    user: user._id,
  });
  sessions.forEach((session) => {
    io.to(session._id.toString()).emit("force-logout");
  });
  await Session.deleteMany({ user: user._id });
  await TrustedDevice.deleteMany({ user: user._id });
  clearTrustedDeviceCookie(res);

  if (mediaIdsToDelete.length > 0) {
    await scheduleMediaDeletion({ _id: { $in: mediaIdsToDelete } });
  }

  await User.deleteOne({ _id });
  await queueAssetCleanup({
    keys: keysToDelete,
    messages: mediaMessages,
  });

  res.clearCookie("token", { maxAge: 0 });

  return res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

export const getallUsers = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const { cursor, safeLimit } = parsePaginationParams(
    req,
    DEFAULT_USERS_LIMIT,
    MAX_USERS_LIMIT,
  );

  const baseQuery = {
    _id: {
      $ne: _id,
    },
  };

  const query = buildPaginationQuery(baseQuery, cursor);
  if (cursor) {
    query._id = { ...(query._id || {}), $lt: cursor };
  }

  const docs = await User.find(query)
    .select("-password -email")
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const { page: users, hasMore, nextCursor } = processPaginationResults(
    docs,
    safeLimit,
    { reverse: false },
  );

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    users,
    filtered: users,
    nextCursor,
    hasMore,
  });
});

export const getUserById = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Missing field");

  const { cursor, safeLimit } = parsePaginationParams(
    req,
    12,
    50,
  );

  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new ApiError(400, "User not found");

  const baseQuery = {
    user: user._id,
    isArchived: false,
  };

  const postQuery = buildPaginationQuery(baseQuery, cursor);

  const postDocs = await Post.find(postQuery)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const { page: userposts, hasMore, nextCursor } = processPaginationResults(
    postDocs,
    safeLimit,
    { reverse: false },
  );

  const userpostIds = userposts.map((p) => p._id);
  const likedPosts = await Like.find({
    user: _id,
    post: { $in: userpostIds },
  }).lean();
  const likedPostIds = new Set(likedPosts.map((l) => l.post.toString()));

  const finalPosts = userposts.map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post._id.toString()),
  }));

  const totalPosts = await Post.countDocuments({
    user: user._id,
    isArchived: false,
  });

  return res.status(200).json({
    success: true,
    message: "Fetch detail successfully",
    user: {
      ...user,
      postsCount: totalPosts,
      posts: finalPosts,
    },
    nextCursor,
    hasMore,
  });
});
