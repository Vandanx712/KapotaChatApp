import { User } from "../models/user.model.js";
import { ApiError } from "../util/apierror.js";
import { asynchandller } from "../util/asynchandler.js";
import bcrypt from "bcrypt";

export const register = asynchandller(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if ([name, email, password].some((field) => field == ""))
    throw new ApiError(400, "Missing fields");

  const existeduser = await User.findOne({
    $or: [{ email: email }, { phoneNo: phone }],
  });
  if (existeduser) {
    if (existeduser.email === email)
      throw new ApiError(400, "Email is already exist");
    if (existeduser.phoneNo === phone)
      throw new ApiError(400, "PhoneNo is already exist");
  }

  const hashed = await bcrypt.hash(password, 12);
  await User.create({
    name,
    email,
    phoneNo: phone,
    password: hashed,
  });

  return res.status(200).json({
    success: true,
    message: "Register Successfully",
  });
});
