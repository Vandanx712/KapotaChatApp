import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createConversation, getConversation } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);
conversationRoute.route('/:oruserId').post(verifyjwt,createConversation)

export default conversationRoute;
