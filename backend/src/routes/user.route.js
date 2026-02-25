import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getallUsers, getPreAvatars, updateProfile, updateProfilePic } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.route("/pic").put(verifyjwt, updateProfilePic);
userRoute.route('/getavatar').post(verifyjwt,getPreAvatars)//for predefind avatars
userRoute.route('/updateprofile').put(verifyjwt,updateProfile)//for update fullname and bio
userRoute.route('/getusers').get(verifyjwt,getallUsers)

export default userRoute;
