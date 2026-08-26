import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    bio: {
      type: String,
    },
    profilePic: {
      type: mongoose.Schema.Types.Mixed,
    },
    loginlimits: {
      type: Number,
      default: 3,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    location: {
      name: { type: String },
      lng: { type: Number },
      lat: { type: Number },
    }, // [lng, lat]
    isOnline: {
      type: Boolean,
      default: false,
    },
    mediaSettings: {
      autoDownload: {
        type: Boolean,
        default: true
      },
      maxAutoDownloadBytes: {
        type: Number,
        default: 10 * 1024 * 1024 //10mb 
      }
    }
  },
  { timestamps: true },
);

userSchema.index({ email: 1 });

export const User = mongoose.model("User", userSchema);
