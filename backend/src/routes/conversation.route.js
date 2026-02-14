import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createConversation, getConversation, getSurrUsers, setBgimage } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);
conversationRoute.route('/:oruserId').post(verifyjwt,createConversation)
conversationRoute.route('/getusers').get(verifyjwt,getSurrUsers)
conversationRoute.route('/settheme').put(verifyjwt,setBgimage)

export default conversationRoute;
