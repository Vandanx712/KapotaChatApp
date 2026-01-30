import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["admin", "member"],
        },
      },
    ],
    groupname: {
      type: String,
    },
    groupIcon: {
      type: mongoose.Schema.Types.Mixed,
    },
    muted: {
      type: Boolean,
      default: false,
    },
    bgImage: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model("Conversation", conversationSchema);
