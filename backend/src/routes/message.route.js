import { Router } from "express";
import { verifyjwt } from "../middlewares/verifyjwt.js";
import {
  clearChat,
  deleteMessage,
  getMessageImgs,
  getMessages,
  reactToMessage,
  searchMessages,
  sendMessage,
  updateMessage,
} from "../controllers/message.controller.js";

const messageRoute = Router();

messageRoute.route("/search/:id").get(verifyjwt, searchMessages);
messageRoute.route("/media/:id").get(verifyjwt, getMessageImgs);
messageRoute.route("/:id/reaction").put(verifyjwt, reactToMessage);
messageRoute.route("/:id").get(verifyjwt, getMessages);
messageRoute.route("/media/:id").get(verifyjwt, getMessageImgs);
messageRoute.route("/:id").post(verifyjwt, sendMessage);
messageRoute.route("/update/:id").put(verifyjwt, updateMessage);
messageRoute.route("/delete/:id").put(verifyjwt, deleteMessage);
messageRoute.route("/clear/:id").put(verifyjwt, clearChat);

export default messageRoute;
