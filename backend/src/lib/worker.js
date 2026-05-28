import { Queue, Worker } from "bullmq";
import { redis } from "./redis.js";
import { deleteImage } from "./cloudinary.js";

export const jobsQueue = new Queue("jobs", {
  connection: redis,
});

const worker = new Worker(
  "jobs",
  async (job) => {
    switch (job.name) {
      case "delete-msg-Img":
        const { keys, messages } = job.data;

        for (const message of messages) {
          if (message.image?.key) {
            keys.push(message.image?.key);
          }
        }

        for (const key of keys) {
          await deleteImage(key);
        }
        
        break;

      default:
        break;
    }
  },
  {
    connection: redis,
    removeOnComplete: {
      age: 1800,
      count: 100,
      limit: 10,
    },
    removeOnFail: {
      age: 3600,
      limit: 10,
    },
    concurrency: 10,
  },
);

worker.on("completed", (job) => {
  console.log(`${job.name} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job.name} has failed with ${err.message}`);
});
