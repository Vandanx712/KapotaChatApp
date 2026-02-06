import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import { getMessages, sendMessage } from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.route("/:id").get(verifyjwt, getMessages);
messageRoute.route('/:id').post(verifyjwt,sendMessage)

export default messageRoute;
