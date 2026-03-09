import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { createConversation, createGroup, deleteConversation, getConversation, getOtherUsers, getSurrUsers, setBgimage, updateGroupDetail, updateMembers } from "../controllers/conversation.controller.js";

const conversationRoute = Router();

conversationRoute.route("/").get(verifyjwt, getConversation);
conversationRoute.route('/:oruserId').post(verifyjwt,createConversation)
conversationRoute.route('/group/create').post(verifyjwt,createGroup)
conversationRoute.route('/getusers').get(verifyjwt,getSurrUsers)
conversationRoute.route('/settheme').put(verifyjwt,setBgimage)
conversationRoute.route('/delete/:id').delete(verifyjwt,deleteConversation)
conversationRoute.route('/update/group').put(verifyjwt,updateGroupDetail)
conversationRoute.route('/otherusers/:id').get(verifyjwt,getOtherUsers)
conversationRoute.route('/update/member').put(verifyjwt,updateMembers)

export default conversationRoute;
