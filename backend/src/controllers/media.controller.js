import { Media } from "../models/media.model.js";
import { Conversation } from "../models/conversation.model.js";
import { createUploadSignature, getCloudinaryAsset, createPrivateMediaUrl } from "../lib/cloudinary.js";
import { asynchandller } from "../util/asynchandller.js";
import { ApiError } from "../util/apierror.js";

const MB = 1024 * 1024;

const uploadPolicies = {
    avatar: {
        maxBytes: 10 * MB,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    },
    chat_background: {
        maxBytes: 30 * MB,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"]
    },
    post: {
        maxBytes: 250 * MB,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"],
    },
    chat_attachment: {
        maxBytes: 100 * MB,
        mimeTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "audio/mpeg",
            "audio/mp4",
            "audio/ogg",
            "audio/wav",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
    },
};

const getResourceType = (mimeType) => {
    if (mimeType.startsWith("image/")) return "image";

    if (mimeType.startsWith("video/") || mimeType.startsWith("audio/")) {
        return "video";
    }

    return "raw";
};

const rawExtensions = {
    "application/pdf": "pdf",
    "text/plain": "txt",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
};

export const prepareMediaUpload = asynchandller(async (req, res) => {
    const { purpose, conversationId, originalName, mimeType, bytes } = req.body;
    const userId = req.user._id;
    const policy = uploadPolicies[purpose];
    const fileSize = Number(bytes);

    if (!policy) {
        throw new ApiError(400, "Unsupported media purpose");
    }

    if (!originalName || !mimeType || !Number.isInteger(fileSize)) {
        throw new ApiError(400, "Invalid file information");
    }

    if (fileSize <= 0 || fileSize > policy.maxBytes) {
        throw new ApiError(400, "File size is not allowed");
    }

    if (!policy.mimeTypes.includes(mimeType)) {
        throw new ApiError(400, "File type is not allowed");
    }

    if (purpose === "chat_attachment") {
        if (!conversationId) {
            throw new ApiError(400, "Conversation is required");
        }

        const conversation = await Conversation.exists({
            _id: conversationId,
            "participants.userId": userId,
        });

        if (!conversation) {
            throw new ApiError(403, "You cannot upload to this conversation");
        }
    }

    const resourceType = getResourceType(mimeType);
    const deliveryType =
        purpose === "chat_attachment" ? "authenticated" : "upload";

    const media = new Media({
        owner: userId,
        conversationId:
            purpose === "chat_attachment" ? conversationId : null,
        purpose,
        resourceType,
        deliveryType,
        originalName: originalName.trim().slice(0, 255),
        mimeType,
        bytes: fileSize,
        status: "pending",
    });

    const extension = resourceType === "raw" ? rawExtensions[mimeType] : null;

    media.publicId = [
        `kapota/${purpose}/${media._id}`,
        extension ? `.${extension}` : "",
    ].join("");
    await media.save();

    const timestamp = Math.floor(Date.now() / 1000);

    const uploadParams = {
        timestamp,
        public_id: media.publicId,
        type: deliveryType,
        overwrite: false,
    };

    const credentials = createUploadSignature(uploadParams);

    return res.status(201).json({
        success: true,
        assetId: media._id,
        resourceType,
        uploadParams,
        ...credentials,
    });
});


export const completeMediaUpload = asynchandller(async (req, res) => {
    const { assetId } = req.body;
    const userId = req.user._id;

    if (!assetId) {
        throw new ApiError(400, "Media asset is required");
    }

    const media = await Media.findOne({
        _id: assetId,
        owner: userId,
    });

    if (!media) {
        throw new ApiError(404, "Media upload was not found");
    }

    if (media.status === "ready") {
        return res.status(200).json({
            success: true,
            media: {
                _id: media._id,
                purpose: media.purpose,
                resourceType: media.resourceType,
                status: media.status,
            },
        });
    }

    if (media.status !== "pending") {
        throw new ApiError(409, "Media upload cannot be completed");
    }

    const remoteAsset = await getCloudinaryAsset({
        publicId: media.publicId,
        resourceType: media.resourceType,
        deliveryType: media.deliveryType,
    });

    if (!remoteAsset) {
        throw new ApiError(409, "Uploaded media is not available yet");
    }

    const policy = uploadPolicies[media.purpose];

    const identityMatches =
        remoteAsset.public_id === media.publicId &&
        remoteAsset.resource_type === media.resourceType &&
        remoteAsset.type === media.deliveryType;

    const validSize =
        Number.isFinite(remoteAsset.bytes) &&
        remoteAsset.bytes > 0 &&
        remoteAsset.bytes <= policy.maxBytes;

    if (!identityMatches || !validSize) {
        media.status = "failed";
        await media.save();

        throw new ApiError(400, "Uploaded media failed verification");
    }

    media.providerAssetId = remoteAsset.asset_id;
    media.bytes = remoteAsset.bytes;
    media.width = remoteAsset.width ?? null;
    media.height = remoteAsset.height ?? null;
    media.duration = remoteAsset.duration ?? null;
    media.format = remoteAsset.format ?? null;
    media.version = remoteAsset.version ?? null;
    media.secureUrl = remoteAsset.secure_url ?? null;
    media.status = "ready";

    await media.save();

    return res.status(200).json({
        success: true,
        media: {
            _id: media._id,
            purpose: media.purpose,
            resourceType: media.resourceType,
            mimeType: media.mimeType,
            originalName: media.originalName,
            bytes: media.bytes,
            width: media.width,
            height: media.height,
            duration: media.duration,
            format: media.format,
            status: media.status,

            url: media.deliveryType === "upload" ? media.secureUrl : null,
        },
    });
});

export const getMediaAccess = asynchandller(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    const attachment = req.query.disposition === "attachment";

    const media = await Media.findOne({
        _id: id,
        purpose: "chat_attachment",
        status: "attached",
        attachedToModel: "Message",
    }).lean();

    if (!media) {
        throw new ApiError(404, "Media is unavailable");
    }

    const isParticipant = await Conversation.exists({
        _id: media.conversationId,
        "participants.userId": userId,
    });

    if (!isParticipant) {
        throw new ApiError(404, "Media is unavailable");
    }

    const visibleMessage = await Message.exists({
        _id: media.attachedToId,
        conversationId: media.conversationId,
        media: media._id,
        deletedForEveryone: { $ne: true },
        deletedFor: { $ne: userId },
    });

    if (!visibleMessage) {
        throw new ApiError(404, "Media is unavailable");
    }

    if (media.resourceType !== "raw" && !media.format) {
        throw new ApiError(409, "Media format is unavailable");
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

    const url = createPrivateMediaUrl({
        publicId: media.publicId,
        format: media.format,
        resourceType: media.resourceType,
        deliveryType: media.deliveryType,
        expiresAt,
        attachment,
    });

    res.set("Cache-Control", "private, no-store");

    return res.status(200).json({
        success: true,
        access: {
            url,
            disposition: attachment ? "attachment" : "inline",
            expiresAt: new Date(expiresAt * 1000).toISOString(),
        },
    });
});