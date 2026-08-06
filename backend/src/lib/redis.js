import IORedis, { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

if (process.env.NODE_ENV !== "prodution" && !process.env.REDIS_URL) {
  console.log("REDIS_URL is missing");
}

export const redis = process.env.NODE_ENV === "production" ?
  new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  }) : new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });

redis.on("error", (error) => {
  console.error("Redis error:", error.message);
});
