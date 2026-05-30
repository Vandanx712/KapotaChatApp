import jwt from "jsonwebtoken";
import { ApiError } from "../util/apierror.js";
import { User } from "../models/user.model.js";
import { Session } from "../models/session.model.js";

export const verifyjwt = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) throw new ApiError(401, "Unauthorized request");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) throw new ApiError(401, "Unauthorized request");
    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) throw new ApiError(401, "User not found");
    const session = await Session.findOne({
      _id: decoded.sessionId,
      user: user._id,
      expireAt: { $gt: new Date() },
    }).lean();
    if (!session) throw new ApiError(401, "Session was deleted");

    req.user = user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};
