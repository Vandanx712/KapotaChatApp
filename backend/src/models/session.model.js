import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    trustedDevice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrustedDevice",
    },
    userAgent: {
      type: String,
    },
    deviceName: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      index: { expires: 0 },
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

sessionSchema.index({ user: 1, expireAt: 1 });

export const Session = mongoose.model("Session", sessionSchema);
