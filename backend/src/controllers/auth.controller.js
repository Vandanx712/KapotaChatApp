import { asynchandller } from "../util/asynchandller.js";
import { ApiError } from "../util/apierror.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import {
  generateToken,
  getTrustedDeviceFromRequest,
  requirePrimaryTrustedDevice,
  setTrustedDeviceCookie,
} from "../lib/tonken.js";
import { getAvatars } from "../lib/cloudinary.js";
import { StoragePath } from "../util/filepath.js";
import { reverseGeocoding } from "./service.controller.js";
import { Session } from "../models/session.model.js";
import { io } from "../lib/socket.js";
import { createOtp, verifyOtp } from "../lib/otp.js";
import { sendOtpMail } from "../lib/mail.js";
import { TrustedDevice } from "../models/trustedDevice.model.js";

const getDeviceInfo = (ua = "") => {
  const osMap = {
    Android: "Android",
    iPhone: "iPhone",
    iPad: "iPad",
    "Windows NT 10.0": "Windows 10",
    "Windows NT 11.0": "Windows 11",
    "Mac OS X": "MacOS",
    Linux: "Linux",
  };

  const browserMap = {
    Edg: "Edge",
    Chrome: "Chrome",
    Firefox: "Firefox",
    Safari: "Safari",
  };

  const os =
    Object.entries(osMap).find(([key]) => ua.includes(key))?.[1] || "Unknown";

  const browser =
    Object.entries(browserMap).find(([key]) => ua.includes(key))?.[1] ||
    "Unknown";

  return `${os} - ${browser}`;
};

export const requestSignupOtp = asynchandller(async (req, res) => {
  const { fullname, email, password, gender, location } = req.body;
  const normalizedEmail = email?.toLowerCase()?.trim();

  if (
    [fullname, normalizedEmail, password, gender].some((field) => !field) ||
    location?.lat == null ||
    location?.lng == null
  )
    throw new ApiError(401, "Missing Fields");
  if (password.length < 6)
    throw new ApiError(400, "Password must be at least 6 character");

  const userexisted = await User.findOne({ email: normalizedEmail }).lean();
  if (userexisted) throw new ApiError(400, "Email already exists");

  const purpose = "signup_verify";
  const { otp } = await createOtp({ email: normalizedEmail, purpose });

  await sendOtpMail({ to: normalizedEmail, otp, purpose });

  return res.status(200).json({
    success: true,
    message: "OTP sent to your email",
  });
});

export const verifySignupOtp = asynchandller(async (req, res) => {
  const { fullname, email, password, gender, location, otp } = req.body;
  const normalizedEmail = email?.toLowerCase()?.trim();

  if (
    [fullname, normalizedEmail, password, gender, otp].some(
      (field) => !field,
    ) ||
    location?.lat == null ||
    location?.lng == null
  )
    throw new ApiError(401, "Missing Fields");

  await verifyOtp({ email: normalizedEmail, purpose: "signup_verify", otp });

  const userexisted = await User.findOne({ email: normalizedEmail }).lean();
  if (userexisted) throw new ApiError(400, "Email already exists");

  const hashedpassword = await bcrypt.hash(password, 12);

  const path = StoragePath(gender, {
    includeMainFolder: true,
    includeAvatarFolder: true,
    includeUserProfilePic: false,
  });

  const genderImages = await getAvatars(path);
  const index = Math.floor(Math.random() * genderImages.length);

  const locName = await reverseGeocoding(location);

  const newuser = await User.create({
    fullname,
    email: normalizedEmail,
    password: hashedpassword,
    profilePic: genderImages[index],
    gender: gender,
    bio: "Hello guys! I am using Kapota",
    location: {
      name: locName,
      lat: location.lat,
      lng: location.lng,
    },
    loginlimits: 3,
    isEmailVerified: true,
    emailVerifiedAt: new Date(),
  });

  const agent = req.headers["user-agent"] || "";

  const trustedDevice = await TrustedDevice.create({
    user: newuser._id,
    deviceName: getDeviceInfo(agent),
    userAgent: agent,
    ipAddress: req.ip || "",
    isPrimary: true,
    lastUsedAt: new Date(),
  });

  setTrustedDeviceCookie(res, trustedDevice._id);

  const session = await Session.create({
    user: newuser._id,
    trustedDevice: trustedDevice._id,
    userAgent: agent,
    deviceName: trustedDevice.deviceName,
    ipAddress: req.ip || "",
  });

  generateToken(newuser._id, session._id, res);

  return res.status(201).json({
    success: true,
    message: "Signup successfully",
    user: {
      _id: newuser._id,
      fullname: newuser.fullname,
      email: newuser.email,
      profilePic: newuser.profilePic,
      bio: newuser.bio,
      gender: newuser.gender,
      location: newuser.location,
      createdAt: newuser.createdAt,
    },
  });
});

export const login = asynchandller(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field == ""))
    throw new ApiError(401, "Missing Fields");

  const normalizedEmail = email?.toLowerCase()?.trim();
  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw new ApiError(400, "User not found");

  const ispasswordvalid = await bcrypt.compare(password, user.password);
  if (!ispasswordvalid) throw new ApiError(400, "Invalid credentials");

  const loginlimits = user.loginlimits || 3;
  const agent = req.headers["user-agent"] || "";

  let trustedDevice = await getTrustedDeviceFromRequest(req, user._id);

  await Session.deleteMany({
    user: user._id,
    expireAt: { $lte: new Date() },
  });

  const activeSessions = await Session.find({
    user: user._id,
    expireAt: { $gte: new Date() },
  })
    .populate("trustedDevice", "isPrimary")
    .sort({ lastSeenAt: 1 })
    .lean();

  if (activeSessions.length >= loginlimits) {
    const removableSessions = activeSessions.filter(
      (session) => !session.trustedDevice?.isPrimary,
    );

    if (removableSessions.length === 0)
      throw new ApiError(403, "Device limit reached");

    const sessionsToRemove = removableSessions.slice(
      0,
      activeSessions.length - loginlimits + 1,
    );

    await Session.deleteMany({
      _id: { $in: sessionsToRemove.map((session) => session._id) },
    });

    sessionsToRemove.map((session) => {
      io.to(session._id.toString()).emit("force-logout");
    });
  }

  if (!trustedDevice) {
    trustedDevice = await TrustedDevice.create({
      user: user._id,
      deviceName: getDeviceInfo(agent),
      userAgent: agent,
      ipAddress: req.ip || "",
      isPrimary: false,
      trustedAt: new Date(),
      lastUsedAt: new Date(),
    });

    setTrustedDeviceCookie(res, trustedDevice._id);
  }

  const session = await Session.create({
    user: user._id,
    trustedDevice: trustedDevice._id,
    userAgent: trustedDevice.userAgent || agent,
    deviceName: trustedDevice.deviceName || getDeviceInfo(agent),
    ipAddress: req.ip || trustedDevice.ipAddress || "",
  });

  generateToken(user._id, session._id, res);
  return res.status(200).json({
    success: true,
    message: "Login successfully",
    user: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      gender: user.gender,
      location: user.location,
      createdAt: user.createdAt,
    },
  });
});

export const logout = asynchandller(async (req, res) => {
  const sessionId = req.session._id;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie("token", { maxAge: 0 });
  res.status(200).json({
    success: true,
    message: "Logout successfully",
  });
});

export const checkAuth = asynchandller(async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Fetch verify user",
    user: req.user,
  });
});

export const requestForgotPasswordOtp = asynchandller(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(401, "Email is requied");

  const normalizedEmail = email?.toLowerCase()?.trim();

  const user = await User.findOne({ email: normalizedEmail }).lean();
  if (!user) throw new ApiError(400, "User not found");

  const purpose = "forgot_password";
  const { otp } = await createOtp({ email: normalizedEmail, purpose });

  await sendOtpMail({ to: normalizedEmail, otp, purpose });

  return res.status(200).json({
    success: true,
    message: "Password reset code sent to your email",
  });
});

export const verifyForgotPasswordOtp = asynchandller(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !password || !otp) throw new ApiError(401, "Missing field");

  const normalizedEmail = email?.toLowerCase()?.trim();

  if (password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters");
  }

  await verifyOtp({ email: normalizedEmail, otp, purpose: "forgot_password" });

  const user = await User.findOne({ email: normalizedEmail });
  if (!user)
    throw new ApiError(400, "If this  email exists, a code  was sent.");

  const sessions = await Session.find({ user: user._id }).select("_id").lean();

  const hashedpassword = await bcrypt.hash(password, 12);
  user.password = hashedpassword;
  await user.save();

  sessions.forEach((session) => {
    io.to(session._id.toString()).emit("force-logout");
  });

  await Session.deleteMany({ user: user._id });
  await TrustedDevice.deleteMany({ user: user._id, isPrimary: false });

  return res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

//session part - multi device login

export const getActivesessions = asynchandller(async (req, res) => {
  const sessionId = req.session._id;
  const now = new Date();

  await Session.deleteMany({
    user: req.user._id,
    expireAt: { $lte: now },
  });

  const sessions = await Session.find({
    user: req.user._id,
    expireAt: { $gt: now },
  })
    .populate("trustedDevice", "isPrimary")
    .sort({ lastSeenAt: -1 })
    .lean();

  const formatted = sessions.map((session) => ({
    ...session,
    isCurrent: session._id.toString() === sessionId.toString(),
    isPrimaryDevice: Boolean(session.trustedDevice?.isPrimary),
  }));

  const currentSession = formatted.find((session) => session.isCurrent);

  return res.status(200).json({
    success: true,
    message: "Fetch active sessions successfully",
    sessions: formatted,
    canManageDevices: Boolean(currentSession?.isPrimaryDevice),
  });
});

export const logoutOne = asynchandller(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  await requirePrimaryTrustedDevice(req);

  const existsession = await Session.findOne({
    _id: id,
    user: userId,
  })
    .select("_id")
    .lean();
  if (!existsession) throw new ApiError(401, "This session already logout");

  await Session.deleteOne({ _id: existsession._id, user: userId });

  io.to(existsession._id.toString()).emit("force-logout");

  return res.status(200).json({
    success: true,
    message: "Device logout successfully",
  });
});

export const logoutOthers = asynchandller(async (req, res) => {
  const sessionId = req.session._id;
  const userId = req.user._id;

  await requirePrimaryTrustedDevice(req);

  const sessions = await Session.find({
    user: userId,
    _id: { $ne: sessionId },
  })
    .select("_id")
    .lean();

  await Session.deleteMany({ user: userId, _id: { $ne: sessionId } });

  sessions.forEach((session) => {
    io.to(session._id.toString()).emit("force-logout");
  });

  return res.status(200).json({
    success: true,
    message: "Other device are logout successfully",
  });
});
