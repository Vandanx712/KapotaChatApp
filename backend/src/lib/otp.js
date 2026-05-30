import { OtpToken } from "../models/otp.model.js";
import { ApiError } from "../util/apierror.js";
import bcrypt from "bcrypt";

export const createOtp = async ({ email, purpose }) => {
  if (!email) throw new ApiError(401, "Email is required");
  if (!purpose) throw new ApiError(401, "OTP purpose is required");

  const normalizedEmail = email.toLowerCase().trim();
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpHash = await bcrypt.hash(otp, 10);

  await OtpToken.deleteMany({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
  });

  await OtpToken.create({
    email: normalizedEmail,
    purpose,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  return { otp };
};

export const verifyOtp = async ({ email, purpose, otp }) => {
  if (!email || !otp) throw new ApiError(401, "Email and Otp are required");
  if (!purpose) throw new ApiError(401, "OTP purpose is required");

  const normalizedEmail = email.toLowerCase().trim();
  const otpToken = await OtpToken.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (!otpToken) throw new ApiError(400, "OTP expired or invalid");

  if (otpToken.attempts >= otpToken.maxAttempts)
    throw new ApiError(429, "Too many OTP attempts");

  const isvalid = await bcrypt.compare(otp, otpToken.otpHash);
  if (!isvalid) {
    otpToken.attempts += 1;
    await otpToken.save();
    throw new ApiError(400, "Invalid OTP");
  }

  otpToken.consumedAt = new Date();
  await otpToken.save();

  return true;
};
