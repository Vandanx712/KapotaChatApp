import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { clearChat, deleteMessage, getMessages, sendMessage, updateMessage } from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.route("/:id").get(verifyjwt, getMessages);
messageRoute.route('/:id').post(verifyjwt,sendMessage)
messageRoute.route('/update/:id').put(verifyjwt,updateMessage)
messageRoute.route('/delete/:id').put(verifyjwt,deleteMessage)
messageRoute.route('/clear/:id').put(verifyjwt,clearChat)

export default messageRoute;
