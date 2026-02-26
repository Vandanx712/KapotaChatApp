import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createConversation, createGroup, getConversation, getSurrUsers, setBgimage } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);
conversationRoute.route('/:oruserId').post(verifyjwt,createConversation)
conversationRoute.route('/group/create').post(verifyjwt,createGroup)
conversationRoute.route('/getusers').get(verifyjwt,getSurrUsers)
conversationRoute.route('/settheme').put(verifyjwt,setBgimage)

export default conversationRoute;
