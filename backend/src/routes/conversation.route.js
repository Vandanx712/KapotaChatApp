import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createConversation, createGroup, deleteConversation, getConversation, getSurrUsers, setBgimage } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);
conversationRoute.route('/:oruserId').post(verifyjwt,createConversation)
conversationRoute.route('/group/create').post(verifyjwt,createGroup)
conversationRoute.route('/getusers').get(verifyjwt,getSurrUsers)
conversationRoute.route('/settheme').put(verifyjwt,setBgimage)
conversationRoute.route('/delete/:id').delete(verifyjwt,deleteConversation)

export default conversationRoute;
