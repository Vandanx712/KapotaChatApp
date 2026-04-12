import { asynchandller } from "../util/asynchandller.js";
import { ApiError } from "../util/apierror.js";
import { StoragePath } from "../util/filepath.js";
import { uploadChatPic } from "../lib/cloudinary.js";
import { Post } from "../models/post.model.js";
import { Like } from "../models/like.model.js";
import { io } from "../lib/socket.js";

const DEFAULT_POST_LIMIT = 12;
const DEFAULT_FEED_LIMIT = 10;
const MAX_POST_LIMIT = 50;
const NEARBY_MAX_DISTANCE_METERS = 5000;
const EARTH_RADIUS_METERS = 6378137;

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
  const { cursor, limit } = req.query;

  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_POST_LIMIT, 1),
    MAX_POST_LIMIT,
  );

  const query = { user: _id };

  if (cursor) {
    query._id = { $lt: cursor };
  }

  const docs = await Post.find(query)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .lean();

  const hasMore = docs.length > safeLimit;
  const posts = hasMore ? docs.slice(0, safeLimit) : docs;
  const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

  const [summary = null] = await Post.aggregate([
    {
      $match: {
        user: _id,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        archived: {
          $sum: { $cond: ["$isArchived", 1, 0] },
        },
        hiddenLikes: {
          $sum: { $cond: ["$hideLike", 1, 0] },
        },
        shareDisabled: {
          $sum: { $cond: ["$disableShare", 1, 0] },
        },
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    message: "Fetch all posts successfully",
    posts,
    nextCursor,
    hasMore,
    summary: summary || {
      total: 0,
      archived: 0,
      hiddenLikes: 0,
      shareDisabled: 0,
    },
  });
});

export const postFeed = asynchandller(async (req, res) => {
  const user = req.user;
  const { cursor, limit } = req.query;
  const safeLimit = Math.min(
    Math.max(parseInt(limit, 10) || DEFAULT_FEED_LIMIT, 1),
    MAX_POST_LIMIT,
  );

  const coordinates = [user.location.lng, user.location.lat];

  const baseQuery = {
    isArchived: false,
    user: { $ne: user._id },
  };

  if (cursor) {
    baseQuery._id = { $lt: cursor };
  }

  const nearByPosts = await Post.find({
    ...baseQuery,
    location: {
      $geoWithin: {
        $centerSphere: [
          coordinates,
          NEARBY_MAX_DISTANCE_METERS / EARTH_RADIUS_METERS,
        ],
      },
    },
  })
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .populate("user", "fullname profilePic")
    .lean();

  const nearbyIds = nearByPosts.map((post) => post._id);
  const globalQuery = {
    ...baseQuery,
  };

  if (nearbyIds.length > 0) {
    globalQuery._id = {
      ...(globalQuery._id || {}),
      $nin: nearbyIds,
    };
  }

  const globalPosts = await Post.find(globalQuery)
    .sort({ _id: -1 })
    .limit(safeLimit + 1)
    .populate("user", "fullname profilePic")
    .lean();

  const posts = [...nearByPosts, ...globalPosts]
    .sort((a, b) => b._id.toString().localeCompare(a._id.toString()))
    .slice(0, safeLimit);

  const hasMore = nearByPosts.length > safeLimit || globalPosts.length > safeLimit;
  const finalids = posts.map((p) => p._id);

  const likedPosts = await Like.find({
    user: user._id,
    post: { $in: finalids },
  }).lean();
  const likedPostIds = new Set(likedPosts.map((l) => l.post.toString()));

  const finalPosts = posts.map((post) => ({
    ...post,
    isLiked: likedPostIds.has(post._id.toString()),
  }));

  const nextCursor =
    hasMore && posts.length > 0 ? posts[posts.length - 1]._id : null;

  return res.status(200).json({
    success: true,
    posts: finalPosts,
    nextCursor,
    hasMore,
  });
});

export const postLiked = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;
  if (!id) throw new ApiError(401, "Select one post");

  const existing = await Like.findOne({
    user: _id,
    post: id,
  });

  if (existing) {
    await Like.deleteOne({ _id: existing._id });
    await Post.findByIdAndUpdate(id, { $inc: { likesCount: -1 } });
    return res.status(200).json({ liked: false });
  }

  await Like.create({
    user: _id,
    post: id,
  });

  await Post.findByIdAndUpdate(id, { $inc: { likesCount: 1 } });

  io.to(id).emit("postLiked", {
    postId: id,
    id,
    likesCountChange: existing ? -1 : 1,
  });

  return res.status(200).json({
    liked: true,
  });
});

export const getPostDetail = asynchandller(async (req, res) => {
  const { id } = req.params;
  const { _id } = req.user;

  if (!id) throw new ApiError(401, "Select one post");

  const post = await Post.findOne({
    _id: id,
    isArchived: false,
  })
    .populate("user", "fullname profilePic")
    .lean();

  if (!post) throw new ApiError(404, "Post not found");

  const likedPost = await Like.findOne({
    user: _id,
    post: id,
  }).lean();

  return res.status(200).json({
    success: true,
    post: {
      ...post,
      isLiked: Boolean(likedPost),
    },
  });
});
