import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { updateProfilePic } from "../controllers/user.controller.js";

const userRoute = Router();

userRoute.route("/pic").put(verifyjwt, updateProfilePic);

export default userRoute;
