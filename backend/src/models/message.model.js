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
    text: {
      type: String,
    },
    image:{
      type:mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true },
);

messageSchema.index({ conversationId: 1 });

export const Message = mongoose.model("Message", messageSchema);
