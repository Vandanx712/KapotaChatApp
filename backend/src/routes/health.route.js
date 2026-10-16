import { Router } from "express";
import mongoose from "mongoose";
import { redis } from "../lib/redis.js";

const healthRoute = Router();

healthRoute.get("/", async (req, res) => {
    const startTime = Date.now();
    const checks = {
        database: { status: "unknown", latencyMs: 0 },
        redis: { status: "unknown", latencyMs: 0 },
    };

    let isHealthy = true;

    // 1. Check MongoDB Atlas Connection & Ping
    try {
        const dbStart = Date.now();
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.db.admin().ping();
            checks.database = {
                status: "up",
                latencyMs: Date.now() - dbStart,
            };
        } else {
            isHealthy = false;
            checks.database = {
                status: "down",
                error: `Mongoose connection state: ${mongoose.connection.readyState}`,
            };
        }
    } catch (error) {
        isHealthy = false;
        checks.database = {
            status: "down",
            error: error.message,
        };
    }

    // 2. Check Redis Ping
    try {
        const redisStart = Date.now();
        const pong = await redis.ping();
        if (pong === "PONG") {
            checks.redis = {
                status: "up",
                latencyMs: Date.now() - redisStart,
            };
        } else {
            isHealthy = false;
            checks.redis = {
                status: "degraded",
                error: `Unexpected ping response: ${pong}`,
            };
        }
    } catch (error) {
        isHealthy = false;
        checks.redis = {
            status: "down",
            error: error.message,
        };
    }

    // 3. Process Memory & Telemetry
    const memoryUsage = process.memoryUsage();
    const payload = {
        status: isHealthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        checkLatencyMs: Date.now() - startTime,
        dependencies: checks,
        system: {
            rssMb: (memoryUsage.rss / 1024 / 1024).toFixed(2),
            heapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
        },
    };

    // Return 200 if all services pass, or 503 if any service is down:
    const statusCode = isHealthy ? 200 : 503;
    return res.status(statusCode).json(payload);
});

export default healthRoute