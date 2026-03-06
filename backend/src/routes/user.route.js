import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getallUsers, getPreAvatars, getUserById, updateProfile, updateProfilePic } from "../controllers/user.controller.js";
import { User } from "../models/user.model.js";

const userRoute = Router();

userRoute.route("/pic").put(verifyjwt, updateProfilePic);
userRoute.route('/getavatar').post(verifyjwt,getPreAvatars)//for predefind avatars
userRoute.route('/updateprofile').put(verifyjwt,updateProfile)//for update fullname and bio
userRoute.route('/getusers').get(verifyjwt,getallUsers)
userRoute.route('/:id').get(verifyjwt,getUserById)

export default userRoute;
