import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    system: {
      type: Boolean,
      default: false,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
    },
    image: {
      type: mongoose.Schema.Types.Mixed,
    },
    post: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    reacted: {
      type: String,
    },
    deletedFor: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1 });

export const Message = mongoose.model("Message", messageSchema);
