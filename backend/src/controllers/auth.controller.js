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
import { enforceSessionLimit } from "../lib/sessionLimit.js";
import { createQrLoginRequest, getQrLoginRequest, saveQrLoginRequest, verifyBrowserSecret, verifyQrToken, withQrLoginLock } from "../lib/qrLogin.js";

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

// for reactnative
// import { Platform } from "react-native";

// const deviceInfo = {
//   os: Platform.OS, // android or ios
//   osVersion: String(Platform.Version),
//   deviceType: "mobile",
// };

// await fetch(`${API_URL}/register`, {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   },
//   body: JSON.stringify({
//     // Other registration fields
//     deviceInfo,
//   }),
// });

export const verifySignupOtp = asynchandller(async (req, res) => {
  const { fullname, email, password, gender, location, otp, deviceInfo } = req.body;
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

  const agent = req.get("user-agent") || "";
  const deviceName = deviceInfo?.os
    ? `${deviceInfo.os} ${deviceInfo.osVersion || ""}`.trim()
    : getDeviceInfo(agent);

  const trustedDevice = await TrustedDevice.create({
    user: newuser._id,
    deviceName,
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

  const token = generateToken(newuser._id, session._id, res);

  return res.status(201).json({
    success: true,
    message: "Signup successfully",
    token,
    trustedDeviceId: trustedDevice._id.toString(),
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

  await enforceSessionLimit(user)

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

  const token = generateToken(user._id, session._id, res);
  return res.status(200).json({
    success: true,
    message: "Login successfully",
    token,
    trustedDeviceId: trustedDevice._id.toString(),
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


// linked device part

export const requestQrLogin = asynchandller(async (req, res) => {
  const userAgent = req.headers["user-agent"] || "";

  const qrRequest = await createQrLoginRequest({
    deviceName: getDeviceInfo(userAgent),
    userAgent,
    ipAddress: req.ip || ""
  })

  const qrPayload = JSON.stringify({
    type: "kapota-qr-login",
    version: 1,
    requestId: qrRequest.requestId,
    qrToken: qrRequest.qrToken,
  })

  return res.status(201).json({
    success: true,
    message: "QR login request created",
    qr: {
      requestId: qrRequest.requestId,
      browserSecret: qrRequest.browserSecret,
      qrPayload,
      expiresAt: qrRequest.expiresAt,
    }
  })
})

export const scanQrLogin = asynchandller(async (req, res) => {
  const { requestId, qrToken } = req.body

  if (!requestId || !qrToken) throw new ApiError(400, "Scan QR code")

  const result = await withQrLoginLock(requestId, async () => {
    const loginRequest = await getQrLoginRequest(requestId)

    if (!loginRequest) throw new ApiError(410, "QR code expired or does not exist")
    if (loginRequest.status !== "pending") throw new ApiError(409, "QR code was already used")
    if (!verifyQrToken(qrToken, loginRequest)) throw new ApiError(401, "Invaild QR code")

    const requestDeviceId = req.headers["x-device-id"]?.toString();
    const sessionTrustedDeviceId = req.session?.trustedDevice?.toString();

    if (
      !requestDeviceId ||
      !sessionTrustedDeviceId ||
      requestDeviceId !== sessionTrustedDeviceId
    ) throw new ApiError(401, "Mobile device verification failed");

    const approvingDevice = await TrustedDevice.findOne({
      _id: sessionTrustedDeviceId,
      user: req.user._id,
      isRevoked: false,
    }).lean();

    if (!approvingDevice) {
      throw new ApiError(
        403,
        "This device is no longer trusted",
      );
    }

    loginRequest.status = "approved";
    loginRequest.userId = req.user._id.toString();

    loginRequest.approvedBySessionId =
      req.session._id.toString();

    loginRequest.approvedByTrustedDeviceId =
      approvingDevice._id.toString();

    loginRequest.approvedAt = new Date().toISOString();

    const saved = await saveQrLoginRequest(loginRequest)

    if (!saved) {
      throw new ApiError(
        410,
        "QR login request expired",
      );
    }

    return loginRequest;
  })
  return res.status(200).json({
    success: true,
    message: "Kapota Web linked successfully",
    requestId: result.requestId,
    browserDevice: result.browser?.deviceName || "Unknown device",
  });
})

export const completeQrLogin = asynchandller(async (req, res) => {
  const { requestId, browserSecret } = req.body

  if (!requestId || !browserSecret) throw new ApiError(400, "requestId and browserSecret are required");

  const result = await withQrLoginLock(requestId, async () => {
    const loginRequest = await getQrLoginRequest(requestId)

    if (!loginRequest) throw new ApiError(410, "QR login request expired");
    if (
      !verifyBrowserSecret(
        browserSecret,
        loginRequest,
      )
    ) throw new ApiError(401, "Invalid browser login secret");

    if (loginRequest.status === "pending") return { status: "pending" };

    if (loginRequest.status === "completed") {
      const [user, session, trustedDevice] = await Promise.all([
        User.findById(loginRequest.userId).select("-password").lean(),
        Session.findOne({
          _id: loginRequest.completedSessionId,
          user: loginRequest.userId,
          expireAt: { $gt: new Date() }
        }).lean(),
        TrustedDevice.findOne({
          _id: loginRequest.completedTrustedDeviceId,
          user: loginRequest.userId,
          isRevoked: false
        }).lean()
      ])

      if (!user || !session || !trustedDevice) {
        throw new ApiError(
          410,
          "Completed login session is unavailable",
        );
      }
      setTrustedDeviceCookie(res, trustedDevice._id);
      generateToken(user._id, session._id, res);
      return {
        status: "completed",
        user,
        session,
        trustedDevice,
      };
    }
    if (loginRequest.status !== "approved") {
      throw new ApiError(
        409,
        "QR login request cannot be completed",
      );
    }
    const user = await User.findById(
      loginRequest.userId,
    )
      .select("-password")
      .lean();

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    await enforceSessionLimit(user);

    const userAgent = req.headers["user-agent"] || "";

    let trustedDevice = null;
    let session = null;

    try {
      trustedDevice = await TrustedDevice.create({
        user: user._id,
        deviceName: getDeviceInfo(userAgent),
        userAgent,
        ipAddress: req.ip || "",
        isPrimary: false,
        trustedAt: new Date(),
        lastUsedAt: new Date(),
      });

      session = await Session.create({
        user: user._id,
        trustedDevice: trustedDevice._id,
        userAgent,
        deviceName: trustedDevice.deviceName,
        ipAddress: req.ip || "",
      });

      loginRequest.status = "completed";

      loginRequest.completedSessionId =
        session._id.toString();

      loginRequest.completedTrustedDeviceId =
        trustedDevice._id.toString();

      loginRequest.completedAt =
        new Date().toISOString();

      const saved = await saveQrLoginRequest(
        loginRequest,
        COMPLETED_LOGIN_TTL_SECONDS,
      );

      if (!saved) {
        throw new ApiError(
          410,
          "QR login request expired during completion",
        );
      }
    } catch (error) {
      if (session?._id) {
        await Session.deleteOne({
          _id: session._id,
        });
      }

      if (trustedDevice?._id) {
        await TrustedDevice.deleteOne({
          _id: trustedDevice._id,
        });
      }

      throw error;
    }

    setTrustedDeviceCookie(res, trustedDevice._id);
    generateToken(user._id, session._id, res);

    return {
      status: "completed",
      user,
      session,
      trustedDevice,
    };
  })
  if (result.status === "pending") {
    return res.status(200).json({
      success: true,
      message: "Waiting for QR scan",
      status: "pending",
    });
  }

  return res.status(200).json({
    success: true,
    message: "QR login completed successfully",
    status: "completed",
    trustedDeviceId:
      result.trustedDevice._id.toString(),
    user: formatUser(result.user),
  });
})
