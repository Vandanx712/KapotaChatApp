import { Worker } from "bullmq";
import connectDb from "../db/db.js";
import { Media } from "../models/media.model.js";
import { deleteCloudinaryAsset, deleteImage } from "./cloudinary.js";
import { registerMediaCleanupScheduler } from "./jobsQueue.js";
import { redis } from "./redis.js";

const PENDING_MAX_AGE = 60 * 60 * 1000;
const FAILED_MAX_AGE = 60 * 60 * 1000;
const READY_MAX_AGE = 24 * 60 * 60 * 1000;
const DELETING_RETRY_AGE = 10 * 60 * 1000;
const CLEANUP_BATCH_SIZE = 100;

const deleteMediaRecord = async (mediaId) => {
  const media = await Media.findById(mediaId);
  if (!media || media.status === "deleted") return;

  if (media.status !== "deleting") {
    throw new Error(`Media ${mediaId} is not scheduled for deletion`);
  }

  await deleteCloudinaryAsset({
    publicId: media.publicId,
    resourceType: media.resourceType,
    deliveryType: media.deliveryType,
  });

  await Media.updateOne(
    { _id: media._id, status: "deleting" },
    {
      $set: {
        status: "deleted",
        secureUrl: null,
      },
    },
  );
};

const cleanupAbandonedMedia = async () => {
  const now = Date.now();
  const candidates = await Media.find({
    $or: [
      {
        attachedToId: null,
        status: "pending",
        createdAt: { $lt: new Date(now - PENDING_MAX_AGE) },
      },
      {
        attachedToId: null,
        status: "failed",
        updatedAt: { $lt: new Date(now - FAILED_MAX_AGE) },
      },
      {
        attachedToId: null,
        status: "ready",
        updatedAt: { $lt: new Date(now - READY_MAX_AGE) },
      },
      {
        status: "deleting",
        updatedAt: { $lt: new Date(now - DELETING_RETRY_AGE) },
      },
    ],
  })
    .select("_id status")
    .limit(CLEANUP_BATCH_SIZE)
    .lean();

  for (const candidate of candidates) {
    if (candidate.status !== "deleting") {
      const claimed = await Media.updateOne(
        {
          _id: candidate._id,
          status: candidate.status,
          attachedToId: null,
        },
        { $set: { status: "deleting" } },
      );

      if (claimed.modifiedCount === 0) continue;
    }

    await deleteMediaRecord(candidate._id);
  }
};

await connectDb();
await registerMediaCleanupScheduler();

const worker = new Worker(
  "jobs",
  async (job) => {
    switch (job.name) {
      case "delete-media":
        await deleteMediaRecord(job.data.mediaId);
        return;

      case "cleanup-media":
        await cleanupAbandonedMedia();
        return;

      case "delete-msg-Img": {
        const { keys = [], messages = [] } = job.data;
        const imageKeys = [
          ...keys,
          ...messages.map((message) => message.image?.key),
        ];

        for (const key of new Set(imageKeys.filter(Boolean))) {
          await deleteImage(key);
        }
        return;
      }

      default:
        return;
    }
  },
  {
    connection: redis,
    concurrency: 10,
  },
);

worker.on("completed", (job) => {
  console.log(`${job.name} has completed`);
});

worker.on("failed", (job, error) => {
  console.error(`${job?.name || "Unknown job"} failed`, error);
});

worker.on("error", (error) => {
  console.error("Worker error", error);
});
