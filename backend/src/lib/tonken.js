import jwt from "jsonwebtoken";
import { TrustedDevice } from "../models/trustedDevice.model.js";
import { ApiError } from "../util/apierror.js";

const isProduction = process.env.NODE_ENV === "production";
const sameSitePolicy = isProduction ? "none" : "lax";

export const generateToken = (userId, sessionId, res) => {
  const token = jwt.sign({ userId, sessionId }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSitePolicy,
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });

  return token;
};

//trusted device cookie part
export const TRUSTED_DEVICE_COOKIE = "trustedDeviceId";

export const setTrustedDeviceCookie = (res, trustedDeviceId) => {
  res.cookie(TRUSTED_DEVICE_COOKIE, trustedDeviceId.toString(), {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSitePolicy,
    maxAge: 365 * 24 * 60 * 60 * 1000,
  });
};

export const clearTrustedDeviceCookie = (res) => {
  res.clearCookie(TRUSTED_DEVICE_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: sameSitePolicy,
  });
};

export const getTrustedDeviceFromRequest = async (req, userId) => {
  const trustedDeviceId =
    req?.cookies?.[TRUSTED_DEVICE_COOKIE] || req.headers["x-device-id"];
  if (!trustedDeviceId) return null;

  const trustedDevice = await TrustedDevice.findOne({
    _id: trustedDeviceId,
    user: userId,
    isRevoked: false,
  });

  if (!trustedDevice) return null;

  trustedDevice.lastUsedAt = new Date();
  trustedDevice.ipAddress = req.ip || trustedDevice.ipAddress;
  await trustedDevice.save();

  return trustedDevice;
};

export const requirePrimaryTrustedDevice = async (req) => {
  const trustedDeviceId = req.session?.trustedDevice;

  if (!trustedDeviceId)
    throw new ApiError(
      403,
      "Use your primary device in the Kapota app to perform this action",
    );

  const trustedDevice = await TrustedDevice.findOne({
    _id: trustedDeviceId,
    user: req.user._id,
    isPrimary: true,
    isRevoked: false,
  }).lean();

  if (!trustedDevice)
    throw new ApiError(
      403,
      "Use your primary device in the Kapota app to perform this action",
    );

  return trustedDevice;
};
