import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
    },

    image: {
      type: mongoose.Schema.Types.Mixed,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    location: {
      name: String,
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    hideLike: {
      type: Boolean,
      default: false,
    },

    disableShare: {
      type: Boolean,
      default: false,
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.index({ location: "2dsphere", likesCount: -1, createdAt: -1 });
postSchema.index({ user: 1, _id: -1 });
postSchema.index({ isArchived: 1, _id: -1 });

export const Post = mongoose.model("Post", postSchema);
