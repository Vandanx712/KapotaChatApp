import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandller.js";
import { StoragePath } from "../util/filepath.js";
import { deleteImage, getAvatars, uploadChatPic } from "../lib/cloudinary.js";
import { User } from "../models/user.model.js";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";

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
  const users = await User.find({ _id: { $ne: _id } })
    .select("-password -email")
    .lean();

  return res.status(200).json({
    success: true,
    message: "Fetch all users successfully",
    users,
  });
});

export const getUserById = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Missing field");

  const user = await User.findById(id).select("-password").lean();
  if (!user) throw new ApiError(400, "User not found");
  const userposts = await Post.find({ user: user._id, isArchived: false })
    .sort({ createdAt: -1 })
    .lean();

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

  return res.status(200).json({
    success: true,
    message: "Fetch detail successfully",
    user: {
      ...user,
      posts: finalPosts,
    },
  });
});
