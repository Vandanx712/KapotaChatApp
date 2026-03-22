import { asynchandller } from "../util/asynchandller.js";
import { ApiError } from "../util/apierror.js";
import { StoragePath } from "../util/filepath.js";
import { uploadChatPic } from "../lib/cloudinary.js";
import { Post } from "../models/post.model.js";

export const createPost = asynchandller(async (req, res) => {
  const user = req.user;
  const { image, caption, location, hideLikes, disableShare, isArchived } =
    req.body;

  if (!image) {
    throw new ApiError(401, "Image must be required");
  }

  let userlocation = location;
  if (location == null) {
    userlocation = {
      name: "",
      type: "Point",
      coordinates: [user.location.lng, user.location.lat],
    };
  }

  const path = StoragePath("", {
    includeMainFolder: true,
    includeAvatarFolder: false,
    includeUserProfilePic: false,
    includeConversation: false,
    includeMessageFolder: false,
    includePostFolder: true,
  });

  const img = await uploadChatPic(path, image);

  await Post.create({
    user: user._id,
    image: img,
    location: userlocation,
    caption: caption ?? null,
    hideLike: hideLikes,
    disableShare: disableShare,
    isArchived: isArchived,
  });

  return res.status(200).json({
    success: true,
    message: "Post create successfully",
  });
});

export const updatePostSetting = asynchandller(async (req, res) => {
  const { postId, hideLikes, disableShare, isArchived } = req.body;
  const { _id } = req.user;

  if (!postId) throw new ApiError(401, "First select post");

  const post = await Post.findOne({ user: _id, _id: postId });
  if (!post) throw new ApiError(400, "Post not found");

  post.hideLike = hideLikes;
  post.disableShare = disableShare;
  post.isArchived = isArchived;

  await post.save();

  return res.status(200).json({
    success: true,
    message: "Post update successfully",
  });
});

export const deletePost = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) {
    throw new ApiError(401, "First select post");
  }

  const post = await Post.findOne({ user: _id, _id: id });
  if (!post) throw new ApiError(400, "Post not found");

  await Post.deleteOne({ user: _id, _id: post._id });

  return res.status(200).json({
    success: true,
    message: "Post delete successfully",
  });
});

export const userAllPost = asynchandller(async (req, res) => {
  const { _id } = req.user;

  const posts = await Post.find({ user: _id }).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    message: "Fetch all posts successfully",
    posts,
  });
});

export const postFeed = asynchandller(async (req, res) => {
  const user = req.user;
  const limit = 10;

  const { cursor } = req.query;

  const coordinates = [user.location.lng, user.location.lat];

  let baseQuery = {
    isArchived: false,
  };

  if (cursor) {
    baseQuery._id = { $lt: cursor };
  }

  const nearByPosts = await Post.find({
    ...baseQuery,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates,
        },
        $maxDistance: 5000,
      },
    },
  })
    .sort({ _id: -1 })
    .limit(limit)
    .populate("user", "fullname profilePic")
    .lean();

  const ids = nearByPosts.map((post) => post._id);

  let remaining = limit - nearByPosts.length;

  let globalPosts = [];

  if (remaining > 0) {
    globalPosts = await Post.find({
      ...baseQuery,
      _id: { $nin: ids },
    })
      .sort({ _id: -1 })
      .limit(remaining)
      .populate("user", "fullname profilePic")
      .lean();
  }

  const finalPosts = [...nearByPosts, ...globalPosts];

  const nextCursor =
    finalPosts.length > 0 ? finalPosts[finalPosts.length - 1]._id : null;

  return res.status(200).json({
    success: true,
    posts: finalPosts,
    nextCursor,
  });
});
