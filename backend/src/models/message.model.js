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
    media: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Media",
      default: null,
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
    reactions: {
      type: [
        new mongoose.Schema(
          {
            userId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            emoji: {
              type: String,
              required: true,
              trim: true,
              maxlength: 32,
            },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    replyTo: {
      type: new mongoose.Schema(
        {
          messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            required: true,
          },
          sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
          },
          preview: {
            type: String,
            required: true,
            maxlength: 500,
          },
          deleted: {
            type: Boolean,
            default: false,
          },
        },
        { _id: false },
      ),
      default: null,
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

messageSchema.index({ conversationId: 1, _id: -1 });
messageSchema.index({ conversationId: 1, text: "text" }, { weights: { text: 10 } });

export const Message = mongoose.model("Message", messageSchema);
