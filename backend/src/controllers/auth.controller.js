import {asynchandller} from "../util/asynchandller.js";
import {ApiError} from "../util/apierror.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/tonken.js";
import { getAvatars } from "../lib/cloudinary.js";
import { StoragePath } from "../util/filepath.js";

export const signup = asynchandller(async (req, res) => {
  const { fullname, email, password, gender } = req.body;

  if ([fullname, email, password, gender].some((field) => field == ""))
    throw new ApiError(401, "Missing Fields");
  if (password.length < 6)
    throw new ApiError(400, "Password must be at least 6 character");

  const userexisted = await User.findOne({ email: email });
  if (userexisted) throw new ApiError(400, "Email already exists");

  const hashedpassword = await bcrypt.hash(password, 12);

  const path = StoragePath(gender, {
    includeMainFolder: true,
    includeAvatarFolder: true,
    includeUserProfilePic: false,
  });

  const genderImages = await getAvatars(path);
  const index = Math.floor(Math.random() * genderImages.length)

  const newuser = await User.create({
    fullname,
    email,
    password: hashedpassword,
    profilePic:genderImages[index],
    bio:'Hello ladies & gentleman! I am using Kapota'
  });

  generateToken(newuser._id, res);
  return res.status(201).json({
    success: true,
    message: "Signup successfully",
    user: {
      _id: newuser._id,
      fullname: newuser.fullname,
      email: newuser.email,
      profilePic: newuser.profilePic,
      bio:newuser.bio
    },
  });
});

export const login = asynchandller(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((field) => field == ""))
    throw new ApiError(401, "Missing Fields");

  const user = await User.findOne({ email: email });
  if (!user) throw new ApiError(400, "Invalid credentials");

  const ispasswordvalid = await bcrypt.compare(password, user.password);
  if (!ispasswordvalid) throw new ApiError(400, "Invalid credentials");

  generateToken(user._id);
  return res.status(200).json({
    success: true,
    message: "Login successfully",
    user: {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      profilePic: user.profilePic,
      bio:user.bio
    },
  });
});

export const logout = asynchandller(async (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
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