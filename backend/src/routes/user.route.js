import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import {
  deleteAccount,
  getallUsers,
  getPreAvatars,
  getUserById,
  updateMediaSettings,
  updateProfile,
  updateProfilePic,
} from "../controllers/user.controller.js";
import { User } from "../models/user.model.js";

const userRoute = Router();

userRoute.route("/pic").put(verifyjwt, updateProfilePic);
userRoute.route('/getavatar').post(verifyjwt, getPreAvatars)//for predefind avatars
userRoute.route('/updateprofile').put(verifyjwt, updateProfile)//for update fullname and bio
userRoute.route("/delete-account").delete(verifyjwt, deleteAccount);
userRoute.route('/getusers').get(verifyjwt, getallUsers)
userRoute.route('/:id').get(verifyjwt, getUserById)
userRoute.route("/media-settings").put(verifyjwt, updateMediaSettings)

export default userRoute;
