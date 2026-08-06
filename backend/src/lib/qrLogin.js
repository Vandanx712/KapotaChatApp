import { redis } from "./redis.js";
import { ApiError } from "../util/apierror.js"
import crypto from "crypto";

const QR_LOGIN_PREFIX = "kapota:qr-login:";
const QR_LOGIN_LOCK_PREFIX = "kapota:qr-login-lock:";

export const QR_LOGIN_TTL_SECONDS = 180;
export const COMPLETED_LOGIN_TTL_SECONDS = 30;

const getRequestKey = (requestId) =>
    `${QR_LOGIN_PREFIX}${requestId}`;

const getLockKey = (requestId) =>
    `${QR_LOGIN_LOCK_PREFIX}${requestId}`;

const createRandomValue = () => crypto.randomBytes(32).toString("base64url")
const hashValue = (value) => crypto.createHash("sha256").update(value).digest("hex")

const compareHashedValue = (plainValue, expectedHash) => {
    if (!plainValue || !expectedHash) return false
    const actualHash = hashValue(plainValue)
    const actualBuffer = Buffer.from(actualHash, "hex")
    const expectedBuffer = Buffer.from(expectedHash, "hex")

    if (actualBuffer.length !== expectedBuffer.length) return false

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer)
}

export const createQrLoginRequest = async ({
    deviceName,
    userAgent,
    ipAddress
}) => {
    const requestId = crypto.randomUUID()
    const qrToken = createRandomValue()
    const browserSecret = createRandomValue()

    const createdAt = new Date()
    const expireAt = new Date(createdAt.getTime() + QR_LOGIN_TTL_SECONDS * 1000)

    const request = {
        requestId,

        status: "pending",
        targetPlatform: "web",

        qrTokenHash: hashValue(qrToken),
        browserSecretHash: hashValue(browserSecret),

        browser: {
            deviceName,
            userAgent,
            ipAddress,
        },

        userId: null,
        approvedBySessionId: null,
        approvedByTrustedDeviceId: null,
        approvedAt: null,

        completedSessionId: null,
        completedTrustedDeviceId: null,
        completedAt: null,

        createdAt: createdAt.toISOString(),
        expiresAt: expireAt.toISOString(),
    };

    await redis.set(getRequestKey(requestId), JSON.stringify(request), "EX", QR_LOGIN_TTL_SECONDS)

    return {
        requestId,
        qrToken,
        browserSecret,
        expiresAt: expireAt.toISOString()
    }
}

export const getQrLoginRequest = async (requestId) => {
    const storedRequest = await redis.get(getRequestKey(requestId))

    if (!storedRequest) return null;

    return JSON.parse(storedRequest)
}

export const saveQrLoginRequest = async (request, custkomTtlSeconds) => {
    let ttlSeconds = custkomTtlSeconds

    if (!ttlSeconds) {
        ttlSeconds = await redis.ttl(getRequestKey(request.requestId))
    }

    if (ttlSeconds <= 0) {
        return false
    }

    await redis.set(getRequestKey(request.requestId), JSON.stringify(request), "EX", ttlSeconds)
    return true
}

export const deleteQrLoginRequest = async (requestId) => {
    await redis.del(getRequestKey(requestId));
};

export const verifyQrToken = (qrToken, request) =>
    compareHashedValue(qrToken, request.qrTokenHash);

export const verifyBrowserSecret = (browserSecret, request) =>
    compareHashedValue(
        browserSecret,
        request.browserSecretHash,
    );

export const withQrLoginLock = async (requestId, callback) => {
    const lockKey = getLockKey(requestId)
    const lockValue = crypto.randomBytes(16).toString("hex")

    const acquired = await redis.set(lockKey, lockValue, "EX", 10, "NX")

    if (acquired !== "OK") {
        throw new ApiError(409, "QR login request is already being processed")
    }

    try {
        return await callback()
    } finally {
        await redis.eval(
            `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        end

        return 0
      `,
            1,
            lockKey,
            lockValue,
        )
    }
}
