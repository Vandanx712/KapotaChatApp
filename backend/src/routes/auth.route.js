import { Router } from "express";
import {
  checkAuth,
  getActivesessions,
  login,
  logout,
  logoutOne,
  logoutOthers,
  requestForgotPasswordOtp,
  requestSignupOtp,
  verifyForgotPasswordOtp,
  verifySignupOtp,
} from "../controllers/auth.controller.js";
import { verifyjwt } from "../middlewares/verifyjwt.js";

const authRouter = Router();

authRouter.route("/signup/request-otp").post(requestSignupOtp);
authRouter.route("/signup/verify").post(verifySignupOtp);
authRouter.route("/login").post(login);
authRouter.route("/logout").post(verifyjwt, logout);
authRouter.route("/check").get(verifyjwt, checkAuth);

//forgot-password part
authRouter.route("/forgot-password/request-otp").post(requestForgotPasswordOtp);
authRouter.route("/forgot-password/verify").post(verifyForgotPasswordOtp);

//session part
authRouter.route("/sessions").get(verifyjwt, getActivesessions);
authRouter.route("/sessions/others").delete(verifyjwt, logoutOthers);
authRouter.route("/sessions/:id").delete(verifyjwt, logoutOne);

export default authRouter;
