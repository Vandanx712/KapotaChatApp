import { Router } from "express";
import { login, refresh } from "../controllers/auth.controller.js";

const authRouter = Router();

authRouter.route("/login").post(login);
authRouter.route('/refresh').post(refresh)

export default authRouter;
