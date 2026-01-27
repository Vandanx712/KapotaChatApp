import { User } from "../models/user.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Session } from "../models/session.model.js";

const generateAccessToken = async (user) => {
  try {
    const accessToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.ACCESS_TOKEN,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE },
    );
    return accessToken;
  } catch (error) {
    console.log(`Error is in Token generation:`, error);
  }
};

const generaterefreshToken = async (user) => {
  try {
    const refreshToken = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phoneNo,
      },
      process.env.REFRESH_TOKEN,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRE },
    );
    return refreshToken;
  } catch (error) {
    console.log(`Error is in Token generation:`, error);
  }
};

const accessOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 24 * 60 * 60 * 1000,
};
const refreshOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 15 * 24 * 60 * 60 * 1000,
};

export const login = asynchandller(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field == ""))
    throw new ApiError(400, "Missing fields");

  const user = await User.findOne({ email: email });
  if (!user) throw new ApiError(400, "Invalid Email");

  const passwordvalid = await bcrypt.compare(password, user.password);
  if (!passwordvalid) throw new ApiError(400, "Invalid Password");

  const accesstoken = await generateAccessToken(user);
  const refreshtoken = await generaterefreshToken(user);

  const now = new Date();
  now.setDate(now.getDate() + 15);

  const session = await Session.find({ userId: user._id, isValid: true }).sort({
    createdAt: 1,
  });
  if (session.length >= user.loginlimit) {
    await Session.updateOne(
      { _id: session[0]._id },
      {
        refreshToken: refreshtoken,
        deviceInfo: req.headers["user-agent"],
        ipAddress: req.ip,
        expiresAt: now,
      },
    );
  } else if (session.length == 0) {
    await Session.create({
      userId: user.id,
      deviceInfo: req.headers["user-agent"],
      ipAddress: req.ip,
      expiresAt: now,
      isValid: true,
    });
  } else {
    for (const Ses of session) {
      if (Ses.deviceInfo === req.headers["user-agent"]) {
        await Session.updateOne(
          { _id: Ses._id },
          { refreshToken: refreshtoken, ipAddress: req.ip, expiresAt: now },
        );
        break;
      } else {
        await Session.create({
          userId: user.id,
          deviceInfo: req.headers["user-agent"],
          ipAddress: req.ip,
          expiresAt: now,
          isValid: true,
        });
        break;
      }
    }
  }

  return res
    .status(200)
    .cookie("accesstoken", accesstoken, accessOptions)
    .cookie("refreshtoken", refreshtoken, refreshOptions)
    .json({
      success: true,
      message: "Login successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phoneNo,
        token: accesstoken,
      },
    });
});

export const refresh = asynchandller(async (req, res) => {
  const AccessToken = req.cookies?.accesstoken;
  const RefreshToken = req.cookies?.refreshtoken;

  if (!RefreshToken)
    return res.status(400).json({
      success: false,
      message: "Invaild token",
    });

  const decoded = jwt.verify(RefreshToken, process.env.REFRESH_TOKEN);
  const user = await User.findById(decoded.id);

  if (!user)
    return res.status(400).json({
      success: false,
      message: "Invaild token",
    });

  const now = new Date();

  const session = await Session.findOne({
    $and: [{ userId: user.id }, { deviceInfo: req.headers["user-agent"] }],
  });
  if (session.refreshToken !== RefreshToken || now > session.expiresAt)
    return res.status(400).json({
      success: false,
      message: "Invaild token",
    });

  now.setDate(now.getDate() + 15);
  const accesstoken = await generateAccessToken(user);
  const refreshtoken = await generaterefreshToken(user);

  await Session.updateOne(
    { _id: session._id },
    { refreshToken: refreshtoken, expiresAt: now },
  );

  return res
    .status(200)
    .cookie("accesstoken", accesstoken, accessOptions)
    .cookie("refreshtoken", refreshtoken, refreshOptions)
    .json({
      success: true,
      message: "Login successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phoneNo,
        token: accesstoken,
      },
    });
});
