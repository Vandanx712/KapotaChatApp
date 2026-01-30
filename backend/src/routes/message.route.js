import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getMessages, sendMessage } from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.route("/").get(verifyjwt, getMessages);
messageRoute.route('/').post(verifyjwt,sendMessage)

export default messageRoute;
