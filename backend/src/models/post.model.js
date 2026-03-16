import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    image: {
      type: mongoose.Schema.Types.Mixed,
    },

    caption: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    filter: {
      name: {
        type: String,
        default: "Original",
      },
      strength: {
        type: Number,
        default: 1,
        min: 0,
        max: 2,
      },
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

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
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

export const Post = mongoose.model("Post", postSchema);
