import { Server } from "socket.io";
import express from "express";
import http from "http";
import { updateMsgStatus } from "../controllers/message.controller.js";
import { Conversation } from "../models/conversation.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
  },
});

//used for onlineusers
const userSocketMap = {};

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;
  // io.emit() is used to send events to all connected clients

  socket.on("joinPost", (postId) => {
    socket.join(postId);
  });

  socket.on("leavePost", (postId) => {
    socket.leave(postId);
  });

  io.emit("getonlineusers", Object.keys(userSocketMap));
  if (userId) {
    const conversations = await Conversation.find({
      "participants.userId": userId,
    })
      .select("_id")
      .lean();
    conversations.forEach((conv) => {
      socket.join(conv._id.toString());
    });
  }

  //message part
  socket.on("istyping", ({ receiverId }) => {
    io.to(receiverId).emit("istyping", { userId, receiverId });
  });

  socket.on("StopTyping", ({ receiverId }) => {
    io.to(receiverId).emit("StopTyping", { userId, receiverId });
  });

  socket.on("msgseen", async ({ msgId, senderId }) => {
    const updated = await updateMsgStatus(msgId, userId);
    const receiverSocketId = userSocketMap[senderId];
    if (receiverSocketId && updated) {
      io.to(receiverSocketId).emit("msgseen", {
        msgId,
        userId,
        seenBy: updated.seenBy,
        isSeen: updated.isSeen,
      });
    }
  });

  socket.on("changeBgimage", ({ conversation, bgImage }) => {
    io.to(conversation.conversationId).emit("changeBgimage", {
      conversationId: conversation.conversationId,
      bgImage,
    });
  });

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
