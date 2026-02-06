import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getPreAvatars, updateProfilePic } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.route("/pic").put(verifyjwt, updateProfilePic);
userRoute.route('/getavatar').post(verifyjwt,getPreAvatars)//for predefind avatars

export default userRoute;
