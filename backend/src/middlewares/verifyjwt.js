import jwt from "jsonwebtoken";
import { ApiError } from "../util/apierror.js";
import { User } from "../models/user.model.js";

export const verifyjwt = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) throw new ApiError(401, "Unauthorized request");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) throw new ApiError(401, "Unauthorized request");
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) throw new ApiError(404, "User not found");
    req.user = user;
    next();
  } catch (error) {
    console.log(error)
  }
};
