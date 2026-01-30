import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getConversation } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);

export default conversationRoute;
