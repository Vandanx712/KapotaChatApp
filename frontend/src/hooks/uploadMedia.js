
import axios from "axios";
import {
    completeMediaUpload,
    prepareMediaUpload,
} from "../lib/axios";

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const completeWithRetry = async (assetId) => {
    const retryDelays = [0, 500, 1500];

    for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
        if (retryDelays[attempt] > 0) {
            await wait(retryDelays[attempt]);
        }

        try {
            return await completeMediaUpload(assetId);
        } catch (error) {
            const canRetry = error.response?.status === 409;
            const isLastAttempt = attempt === retryDelays.length - 1;

            if (!canRetry || isLastAttempt) {
                throw error;
            }
        }
    }

    throw new Error("Could not complete media upload");
};

export const uploadMedia = async ({
    file,
    purpose,
    conversationId = null,
    onProgress,
    signal,
}) => {
    if (!(file instanceof File)) {
        throw new TypeError("A browser File is required");
    }

    onProgress?.({ phase: "preparing", percent: 0 });

    const ticket = await prepareMediaUpload({
        purpose,
        conversationId,
        originalName: file.name,
        mimeType: file.type,
        bytes: file.size,
    });

    const formData = new FormData();

    formData.append("file", file);
    formData.append("api_key", ticket.apiKey);

    Object.entries(ticket.uploadParams).forEach(([key, value]) => {
        formData.append(key, String(value));
    });

    const uploadUrl =
        `https://api.cloudinary.com/v1_1/` +
        `${ticket.cloudName}/${ticket.resourceType}/upload`;

    await axios.post(uploadUrl, formData, {
        signal,

        // Let Axios create the multipart boundary. Do not set Content-Type manually.
        onUploadProgress: ({ loaded, total }) => {
            const uploadSize = total || file.size;
            const percent = uploadSize
                ? Math.min(Math.round((loaded / uploadSize) * 100), 100)
                : 0;

            onProgress?.({ phase: "uploading", percent });
        },
    });

    onProgress?.({ phase: "verifying", percent: 100 });

    const completed = await completeWithRetry(ticket.assetId);

    onProgress?.({ phase: "complete", percent: 100 });

    return completed.media;
};