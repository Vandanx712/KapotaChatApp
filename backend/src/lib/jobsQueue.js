import { Queue } from "bullmq";
import { Media } from "../models/media.model.js";
import { redis } from "./redis.js";

export const jobsQueue = new Queue("jobs", {
  connection: redis,
});

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: {
    age: 1800,
    count: 1000,
  },
  removeOnFail: {
    age: 86400,
    count: 1000,
  },
};

export const enqueueMediaDeletion = (mediaId) =>
  jobsQueue.add(
    "delete-media",
    { mediaId: mediaId.toString() },
    defaultJobOptions,
  );

export const scheduleMediaDeletion = async (filter) => {
  const candidates = await Media.find({
    ...filter,
    status: {
      $in: ["pending", "ready", "attached", "deleting", "failed"],
    },
  })
    .select("_id")
    .lean();

  if (candidates.length === 0) return [];

  const mediaIds = candidates.map((media) => media._id);

  await Media.updateMany(
    {
      _id: { $in: mediaIds },
      status: { $ne: "deleted" },
    },
    { $set: { status: "deleting" } },
  );

  const queued = await Promise.allSettled(
    mediaIds.map((mediaId) => enqueueMediaDeletion(mediaId)),
  );

  queued.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Could not enqueue media deletion", result.reason);
    }
  });

  return mediaIds;
};

export const enqueueLegacyAssetDeletion = ({ keys = [], messages = [] }) => {
  const uniqueKeys = [...new Set(keys.filter(Boolean))];
  if (uniqueKeys.length === 0 && messages.length === 0) return null;

  return jobsQueue.add(
    "delete-msg-Img",
    { keys: uniqueKeys, messages },
    defaultJobOptions,
  );
};

export const registerMediaCleanupScheduler = () =>
  jobsQueue.upsertJobScheduler(
    "media-cleanup",
    { every: 15 * 60 * 1000 },
    {
      name: "cleanup-media",
      data: {},
      opts: {
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    },
  );
