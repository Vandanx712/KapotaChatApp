import { Server } from "socket.io";
import express from "express";
import http from "http";
import { updateMsgStatus } from "../controllers/message.controller.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
  },
});

//used for onlineusers
const userSocketMap = {};

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  // io.emit() is used to send events to all connected clients

  io.emit("getonlineusers", Object.keys(userSocketMap));

  //message part
  socket.on("istyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("istyping",userId);
    }
  });

  socket.on("StopTyping", ({ receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("StopTyping",userId);
    }
  });

  socket.on('msgseen',async({msgId,senderId})=>{
    const receiverSocketId = userSocketMap[senderId]
    if(receiverSocketId){
      await updateMsgStatus(msgId,userId)
      io.to(receiverSocketId).emit('msgseen',{msgId})
    }
  })

  socket.on('changeBgimage',({conversation,bgImage})=>{
    const receiverSocketId = userSocketMap[conversation.oruserId]
    const mysocketId = userSocketMap[userId]
    if(receiverSocketId){
      io.to(receiverSocketId).emit('changeBgimage',{conversationId:conversation.conversationId,bgImage})
    }
    if(mysocketId){
      io.to(mysocketId).emit('changeBgimage',{conversationId:conversation.conversationId,bgImage})
    }
  })

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getonlineusers", Object.keys(userSocketMap));
  });
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

export { io, app, server };
