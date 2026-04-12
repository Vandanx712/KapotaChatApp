import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { deleteImage, getAvatars, uploadChatPic } from "../lib/cloudinary.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";

const DEFAULT_USERS_LIMIT = 30;
const DEFAULT_PROFILE_POST_LIMIT = 12;
const MAX_USERS_LIMIT = 100;
const MAX_PROFILE_POST_LIMIT = 50;

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

export const getallUsers = asynchandller(async (req, res) => {
  const { _id } = req.user;
  const { cursor, limit } = req.query;

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_USERS_LIMIT, 1),
    MAX_USERS_LIMIT,
  );

  const query = {
    _id: {
      $ne: _id,
    },
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

export const getUserById = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  const { cursor, limit } = req.query;

  if (!id) throw new ApiError(401, "Missing field");

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_PROFILE_POST_LIMIT, 1),
    MAX_PROFILE_POST_LIMIT,
  );

  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new ApiError(400, "User not found");

  const postQuery = {
    user: user._id,
    isArchived: false,
  };

  if (cursor) {
    postQuery._id = { $lt: cursor };
  }

  const postDocs = await Post.find(postQuery)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = postDocs.length > safeLimit;
  const userposts = hasMore ? postDocs.slice(0, safeLimit) : postDocs;
  const nextCursor = hasMore ? userposts[userposts.length - 1]._id : null;

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
