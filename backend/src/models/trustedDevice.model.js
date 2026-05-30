import mongoose from "mongoose";

const trustedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    isPrimary: {
      type: Boolean,
      default: false,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    trustedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

trustedDeviceSchema.index({ user: 1, isPrimary: 1 });
trustedDeviceSchema.index({ user: 1, isRevoked: 1 });

export const TrustedDevice = mongoose.model(
  "TrustedDevice",
  trustedDeviceSchema,
);
