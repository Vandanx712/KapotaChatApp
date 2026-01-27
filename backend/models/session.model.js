import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refreshToken: {
      type: mongoose.Schema.Types.String,
    },
    deviceInfo: {
      type: mongoose.Schema.Types.String,
    },
    ipAddress: {
      type: mongoose.Schema.Types.String,
    },
    isValid: {
      type: mongoose.Schema.Types.Boolean,
      default: true,
    },
    expiresAt: {
      type: mongoose.Schema.Types.Date,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ userId: 1 });

export const Session = mongoose.model("Session", sessionSchema);
