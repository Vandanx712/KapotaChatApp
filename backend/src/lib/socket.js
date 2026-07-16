import { Server } from "socket.io";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { updateMsgStatus } from "../controllers/message.controller.js";
import { Conversation } from "../models/conversation.model.js";
import { Session } from "../models/session.model.js";
import dotenv from "dotenv";

const app = express();
const server = http.createServer(app);
dotenv.config();

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    credentials: true,
  },
});

// used for online users. one user can have multiple socket connections (multiple tabs/devices).
const userSocketMap = new Map();

const normalizeId = (value) => {
  if (!value) return "";
  return value.toString();
};

const addUserSocket = (userId, socketId) => {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socketId);
};

const removeUserSocket = (userId, socketId) => {
  const sockets = userSocketMap.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    userSocketMap.delete(userId);
  }
};

const getUserSocketIds = (userId) => {
  const normalized = normalizeId(userId);
  if (!normalized || !userSocketMap.has(normalized)) return [];
  return [...userSocketMap.get(normalized)];
};

const emitToUser = (userId, event, payload) => {
  const socketIds = getUserSocketIds(userId);
  socketIds.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const getCookieValue = (cookieHeader = "", name) => {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")
    ?.slice(1)
    ?.join("=");
};

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      getCookieValue(socket.handshake.headers.cookie, "token");

    if (!token) return next(new Error("Unauthorized socket"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await Session.findOne({
      _id: decoded.sessionId,
      user: decoded.userId,
      expireAt: { $gt: new Date() },
    });

    if (!session) return next(new Error("Session expired"));

    socket.userId = decoded.userId.toString();
    socket.sessionId = decoded.sessionId.toString();
    next();
  } catch (error) {
    next(new Error("Unauthorized socket"));
  }
});

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = normalizeId(socket.userId);
  const sessionId = normalizeId(socket.sessionId);
  if (userId) addUserSocket(userId, socket.id);

  socket.join(sessionId);

  socket.on("joinPost", (postId) => {
    socket.join(postId);
  });

  socket.on("leavePost", (postId) => {
    socket.leave(postId);
  });

  io.emit("getonlineusers", [...userSocketMap.keys()]);
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
    if (updated) {
      emitToUser(senderId, "msgseen", {
        msgId,
        userId,
        seenBy: updated.seenBy,
        isSeen: updated.isSeen,
      });
    }
  });

  //call part

  socket.on(
    "call-user",
    ({ to, from, offer, conversationId, isGroup, conversation }) => {
      const fromId = normalizeId(from?._id);
      if (!fromId || !offer) return;

      const payload = {
        from,
        offer,
        conversationId: normalizeId(conversationId),
        isGroup: Boolean(isGroup),
        conversation,
      };

      if (Array.isArray(to)) {
        to.map((id) => normalizeId(id))
          .filter((id) => id && id !== fromId)
          .forEach((id) => {
            emitToUser(id, "incoming-call", payload);
          });
        return;
      }

      const targetId = normalizeId(to);
      if (!targetId || targetId === fromId) return;
      emitToUser(targetId, "incoming-call", payload);
    },
  );

  socket.on("ice-candidate", ({ to, from, candidate, conversationId }) => {
    if (!candidate) return;
    const targetId = normalizeId(to);
    if (!targetId) return;
    emitToUser(targetId, "ice-candidate", {
      from: normalizeId(from),
      candidate,
      conversationId: normalizeId(conversationId),
    });
  });

  socket.on("call-accepted", ({ to, from, answer, conversationId }) => {
    if (!answer) return;
    const targetId = normalizeId(to);
    if (!targetId) return;
    emitToUser(targetId, "call-accepted", {
      from: normalizeId(from),
      answer,
      conversationId: normalizeId(conversationId),
    });
  });

  socket.on("call-declined", ({ to, from, conversationId }) => {
    const targetId = normalizeId(to);
    if (!targetId) return;
    emitToUser(targetId, "call-declined", {
      from: normalizeId(from),
      conversationId: normalizeId(conversationId),
    });
  });

  socket.on("call-ended", ({ to, from, conversationId, isGroup }) => {
    const payload = {
      from: normalizeId(from),
      conversationId: normalizeId(conversationId),
      isGroup: Boolean(isGroup),
    };
    if (Array.isArray(to)) {
      to.map((id) => normalizeId(id))
        .filter(Boolean)
        .forEach((id) => emitToUser(id, "call-ended", payload));
      return;
    }
    const targetId = normalizeId(to);
    if (targetId) {
      emitToUser(targetId, "call-ended", payload);
      return;
    }
    if (conversationId) {
      socket.to(conversationId).emit("call-ended", payload);
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
    if (userId) removeUserSocket(userId, socket.id);
    io.emit("getonlineusers", [...userSocketMap.keys()]);
  });
});

export function getReceiverSocketId(userId) {
  const socketIds = getUserSocketIds(userId);
  return socketIds[0] || null;
}

export { io, app, server };
