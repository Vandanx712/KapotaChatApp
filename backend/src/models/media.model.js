import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            default: null,
        },

        purpose: {
            type: String,
            enum: [
                "avatar",
                "chat_attachment",
                "post",
                "chat_background",
            ],
            required: true,
        },

        provider: {
            type: String,
            enum: ["cloudinary"],
            default: "cloudinary",
        },

        providerAssetId: {
            type: String,
            unique: true,
            sparse: true,
        },

        publicId: {
            type: String,
            unique: true,
            sparse: true,
        },

        resourceType: {
            type: String,
            enum: ["image", "video", "raw"],
        },

        deliveryType: {
            type: String,
            enum: ["upload", "private", "authenticated"],
            default: "upload",
        },

        originalName: String,
        mimeType: String,
        bytes: Number,
        width: Number,
        height: Number,
        duration: Number,
        format: String,
        version: Number,

        secureUrl: String,

        status: {
            type: String,
            enum: ["pending", "ready", "attached", "failed", "deleted"],
            default: "pending",
            index: true,
        },

        attachedToModel: {
            type: String,
            enum: ["Message", "Post", "User", "Conversation"],
            default: null,
        },

        attachedToId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: "attachedToModel",
            default: null,
        },
    },
    { timestamps: true },
);

mediaSchema.index({ conversationId: 1, createdAt: -1 });
mediaSchema.index({ owner: 1, purpose: 1, createdAt: -1 });
mediaSchema.index({ status: 1, createdAt: 1 });

export const Media = mongoose.model("Media", mediaSchema);