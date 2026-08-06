import { Server } from "socket.io";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { updateMsgStatus } from "../controllers/message.controller.js";
import { Conversation } from "../models/conversation.model.js";
import { Session } from "../models/session.model.js";
import dotenv from "dotenv";

const app = express();
const server = http.createServer(app);
dotenv.config();

const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL,process.env.RN_URL],
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

const CALL_MAX_LIFETIME_MS = 12 * 60 * 60 * 1000;
const activeCalls = new Map();
const activeCallByConversation = new Map();
const joinedCallByUser = new Map();

const getCallRoom = (callId) => `call:${callId}`;

const normalizeProfilePic = (profilePic) => {
  if (!profilePic) return null;
  if (typeof profilePic === "string") return { url: profilePic };
  return profilePic;
};

const serializeCallParticipant = (call, participantId) => {
  const id = normalizeId(participantId);
  const profile = call?.participantProfiles?.get(id);
  if (!profile) return null;
  const mediaState = call?.mediaStates?.get(id);
  return {
    _id: id,
    id,
    name: profile.fullname || "Unknown",
    fullname: profile.fullname || "Unknown",
    profilePic: normalizeProfilePic(profile.profilePic),
    micOn: mediaState?.micOn !== false,
    cameraOn: mediaState?.cameraOn !== false,
  };
};

const getCallConversation = async (conversationId, userId) => {
  if (!conversationId || !userId) return null;
  try {
    return await Conversation.findOne({
      _id: conversationId,
      "participants.userId": userId,
    })
      .select("_id participants groupname groupIcon")
      .populate("participants.userId", "_id fullname profilePic")
      .lean();
  } catch {
    return null;
  }
};

const buildCallContext = (conversation, initiatorId) => {
  const participantProfiles = new Map();

  conversation.participants.forEach((participant) => {
    const participantUser = participant?.userId;
    const id = normalizeId(participantUser?._id || participantUser);
    if (!id || !participantUser) return;
    participantProfiles.set(id, {
      fullname: participantUser.fullname || "Unknown",
      profilePic: participantUser.profilePic || null,
      role: participant.role || "member",
    });
  });

  const isGroup = Boolean(conversation.groupname);
  const initiator = participantProfiles.get(initiatorId);
  const conversationId = conversation._id.toString();
  const conversationPayload = isGroup
    ? {
        conversationId,
        oruserId: "",
        name: "",
        profilePic: null,
        isgroup: true,
        groupdetail: {
          groupname: conversation.groupname,
          groupIcon: conversation.groupIcon || null,
          membersDetail: Object.fromEntries(
            [...participantProfiles].map(([id, profile]) => [
              id,
              {
                fullname: profile.fullname,
                profilePic: normalizeProfilePic(profile.profilePic),
                role: profile.role,
              },
            ]),
          ),
        },
      }
    : {
        conversationId,
        oruserId: initiatorId,
        name: initiator?.fullname || "Unknown",
        profilePic: normalizeProfilePic(initiator?.profilePic),
        isgroup: false,
        groupdetail: {},
      };

  return {
    participantProfiles,
    participantIds: new Set(participantProfiles.keys()),
    isGroup,
    conversationPayload,
  };
};

const emitToJoinedCallUser = (call, userId, event, payload) => {
  const socketIds = call?.joinedSockets?.get(normalizeId(userId));
  if (!socketIds) return;
  socketIds.forEach((socketId) => io.to(socketId).emit(event, payload));
};

const endCallSession = (call, reason = "ended", endedBy = "") => {
  if (!call || !activeCalls.has(call.id)) return;

  const payload = {
    callId: call.id,
    conversationId: call.conversationId,
    reason,
    endedBy: normalizeId(endedBy),
  };
  call.participantIds.forEach((participantId) => {
    emitToUser(participantId, "call:ended", payload);
  });

  call.joinedSockets.forEach((socketIds, participantId) => {
    if (joinedCallByUser.get(participantId) === call.id) {
      joinedCallByUser.delete(participantId);
    }
    socketIds.forEach((socketId) => {
      const joinedSocket = io.sockets.sockets.get(socketId);
      joinedSocket?.callIds?.delete(call.id);
      joinedSocket?.leave(getCallRoom(call.id));
    });
  });
  call.joinedSockets.clear();

  clearTimeout(call.expiryTimer);
  activeCalls.delete(call.id);
  if (activeCallByConversation.get(call.conversationId) === call.id) {
    activeCallByConversation.delete(call.conversationId);
  }
};

const addSocketToCall = (call, socket) => {
  const participantId = normalizeId(socket.userId);
  let participantSockets = call.joinedSockets.get(participantId);
  const isFirstSocket = !participantSockets?.size;

  if (!participantSockets) {
    participantSockets = new Set();
    call.joinedSockets.set(participantId, participantSockets);
  }
  participantSockets.add(socket.id);
  joinedCallByUser.set(participantId, call.id);
  socket.callIds ||= new Set();
  socket.callIds.add(call.id);
  socket.join(getCallRoom(call.id));

  if (call.joinedSockets.size >= 2) call.everConnected = true;
  return isFirstSocket;
};

const removeSocketFromCall = (call, socket, reason = "left") => {
  if (!call) return;
  const participantId = normalizeId(socket.userId);
  const participantSockets = call.joinedSockets.get(participantId);
  if (!participantSockets?.has(socket.id)) return;

  participantSockets.delete(socket.id);
  socket.callIds?.delete(call.id);
  socket.leave(getCallRoom(call.id));

  if (participantSockets.size === 0) {
    call.joinedSockets.delete(participantId);
    if (joinedCallByUser.get(participantId) === call.id) {
      joinedCallByUser.delete(participantId);
    }
    io.to(getCallRoom(call.id)).emit("call:participant-left", {
      callId: call.id,
      conversationId: call.conversationId,
      participantId,
      reason,
    });
  }

  if (call.joinedSockets.size === 0) {
    endCallSession(call, reason, participantId);
    return;
  }

  if (!call.isGroup && call.everConnected && call.joinedSockets.size < 2) {
    endCallSession(call, reason, participantId);
  }
};

const acknowledge = (callback, payload) => {
  if (typeof callback === "function") callback(payload);
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

  socket.on("call:start", async ({ conversationId, callType = "video" } = {}, callback) => {
    const normalizedConversationId = normalizeId(conversationId);
    if (!normalizedConversationId) {
      acknowledge(callback, { ok: false, message: "Conversation is required" });
      return;
    }

    const existingCallId = activeCallByConversation.get(normalizedConversationId);
    const existingCall = existingCallId ? activeCalls.get(existingCallId) : null;
    if (existingCall?.participantIds.has(userId)) {
      acknowledge(callback, {
        ok: true,
        callId: existingCall.id,
        conversationId: existingCall.conversationId,
        isGroup: existingCall.isGroup,
        existing: true,
      });
      return;
    }

    const joinedCallId = joinedCallByUser.get(userId);
    if (joinedCallId && joinedCallId !== existingCallId) {
      acknowledge(callback, { ok: false, message: "Finish your current call first" });
      return;
    }

    const conversation = await getCallConversation(normalizedConversationId, userId);
    if (!conversation) {
      acknowledge(callback, { ok: false, message: "Conversation not found" });
      return;
    }

    const concurrentCallId = activeCallByConversation.get(normalizedConversationId);
    const concurrentCall = concurrentCallId ? activeCalls.get(concurrentCallId) : null;
    if (concurrentCall?.participantIds.has(userId)) {
      acknowledge(callback, {
        ok: true,
        callId: concurrentCall.id,
        conversationId: concurrentCall.conversationId,
        isGroup: concurrentCall.isGroup,
        existing: true,
      });
      return;
    }

    const context = buildCallContext(conversation, userId);
    if (context.participantIds.size < 2) {
      acknowledge(callback, { ok: false, message: "No one else can join this call" });
      return;
    }

    const callId = randomUUID();
    const call = {
      id: callId,
      conversationId: normalizedConversationId,
      initiatorId: userId,
      callType: callType === "audio" ? "audio" : "video",
      isGroup: context.isGroup,
      participantIds: context.participantIds,
      participantProfiles: context.participantProfiles,
      conversationPayload: context.conversationPayload,
      joinedSockets: new Map(),
      mediaStates: new Map(),
      declinedUserIds: new Set(),
      everConnected: false,
      createdAt: Date.now(),
      expiryTimer: null,
    };

    call.expiryTimer = setTimeout(() => {
      endCallSession(call, "expired");
    }, CALL_MAX_LIFETIME_MS);
    call.expiryTimer.unref?.();

    activeCalls.set(callId, call);
    activeCallByConversation.set(normalizedConversationId, callId);

    acknowledge(callback, {
      ok: true,
      callId,
      conversationId: normalizedConversationId,
      isGroup: call.isGroup,
      existing: false,
    });

    const incomingPayload = {
      callId,
      conversationId: normalizedConversationId,
      callType: call.callType,
      isGroup: call.isGroup,
      from: serializeCallParticipant(call, userId),
      conversation: call.conversationPayload,
      startedAt: call.createdAt,
    };
    call.participantIds.forEach((participantId) => {
      if (participantId !== userId) {
        emitToUser(participantId, "call:incoming", incomingPayload);
      }
    });
  });

  socket.on("call:join", ({ callId } = {}, callback) => {
    const call = activeCalls.get(normalizeId(callId));
    if (!call || !call.participantIds.has(userId)) {
      acknowledge(callback, { ok: false, message: "This call is no longer available" });
      return;
    }

    const joinedCallId = joinedCallByUser.get(userId);
    if (joinedCallId && joinedCallId !== call.id) {
      acknowledge(callback, { ok: false, message: "Finish your current call first" });
      return;
    }

    const joinedOnAnotherSocket = call.joinedSockets.get(userId);
    if (joinedOnAnotherSocket?.size && !joinedOnAnotherSocket.has(socket.id)) {
      acknowledge(callback, {
        ok: false,
        code: "ALREADY_JOINED",
        message: "This call was answered on another device",
      });
      return;
    }

    const existingParticipants = [...call.joinedSockets.keys()]
      .filter((participantId) => participantId !== userId)
      .map((participantId) => serializeCallParticipant(call, participantId))
      .filter(Boolean);
    const isFirstSocket = addSocketToCall(call, socket);

    acknowledge(callback, {
      ok: true,
      callId: call.id,
      conversationId: call.conversationId,
      isGroup: call.isGroup,
      participants: existingParticipants,
    });

    if (isFirstSocket) {
      socket.to(getCallRoom(call.id)).emit("call:participant-joined", {
        callId: call.id,
        conversationId: call.conversationId,
        participant: serializeCallParticipant(call, userId),
      });

      getUserSocketIds(userId)
        .filter((socketId) => socketId !== socket.id)
        .forEach((socketId) => {
          io.to(socketId).emit("call:answered-elsewhere", {
            callId: call.id,
            conversationId: call.conversationId,
          });
        });
    }
  });

  socket.on("call:offer", ({ callId, toUserId, description } = {}, callback) => {
    const call = activeCalls.get(normalizeId(callId));
    const targetId = normalizeId(toUserId);
    if (
      !call ||
      !description?.type ||
      !call.joinedSockets.has(userId) ||
      !call.joinedSockets.has(targetId) ||
      targetId === userId
    ) {
      acknowledge(callback, { ok: false, message: "Invalid call offer" });
      return;
    }

    emitToJoinedCallUser(call, targetId, "call:offer", {
      callId: call.id,
      conversationId: call.conversationId,
      fromUserId: userId,
      from: serializeCallParticipant(call, userId),
      description,
    });
    acknowledge(callback, { ok: true });
  });

  socket.on("call:answer", ({ callId, toUserId, description } = {}, callback) => {
    const call = activeCalls.get(normalizeId(callId));
    const targetId = normalizeId(toUserId);
    if (
      !call ||
      !description?.type ||
      !call.joinedSockets.has(userId) ||
      !call.joinedSockets.has(targetId) ||
      targetId === userId
    ) {
      acknowledge(callback, { ok: false, message: "Invalid call answer" });
      return;
    }

    emitToJoinedCallUser(call, targetId, "call:answer", {
      callId: call.id,
      conversationId: call.conversationId,
      fromUserId: userId,
      from: serializeCallParticipant(call, userId),
      description,
    });
    acknowledge(callback, { ok: true });
  });

  socket.on("call:ice-candidate", ({ callId, toUserId, candidate } = {}) => {
    const call = activeCalls.get(normalizeId(callId));
    const targetId = normalizeId(toUserId);
    if (
      !call ||
      !candidate ||
      !call.joinedSockets.has(userId) ||
      !call.joinedSockets.has(targetId) ||
      targetId === userId
    ) {
      return;
    }

    emitToJoinedCallUser(call, targetId, "call:ice-candidate", {
      callId: call.id,
      conversationId: call.conversationId,
      fromUserId: userId,
      candidate,
    });
  });

  socket.on("call:media-state", ({ callId, micOn, cameraOn } = {}) => {
    const call = activeCalls.get(normalizeId(callId));
    if (!call || !call.joinedSockets.has(userId)) return;

    call.mediaStates.set(userId, {
      micOn: Boolean(micOn),
      cameraOn: Boolean(cameraOn),
    });

    socket.to(getCallRoom(call.id)).emit("call:media-state", {
      callId: call.id,
      conversationId: call.conversationId,
      participantId: userId,
      micOn: Boolean(micOn),
      cameraOn: Boolean(cameraOn),
    });
  });

  socket.on("call:decline", ({ callId, reason = "declined" } = {}, callback) => {
    const call = activeCalls.get(normalizeId(callId));
    if (!call || !call.participantIds.has(userId)) {
      acknowledge(callback, { ok: false, message: "This call is no longer available" });
      return;
    }

    call.declinedUserIds.add(userId);
    const payload = {
      callId: call.id,
      conversationId: call.conversationId,
      participant: serializeCallParticipant(call, userId),
      reason,
    };
    io.to(getCallRoom(call.id)).emit("call:declined", payload);
    acknowledge(callback, { ok: true });

    if (!call.isGroup) {
      endCallSession(call, reason, userId);
    }
  });

  socket.on("call:leave", ({ callId, reason = "left" } = {}, callback) => {
    const call = activeCalls.get(normalizeId(callId));
    if (!call) {
      acknowledge(callback, { ok: true });
      return;
    }
    if (call.initiatorId === userId && !call.joinedSockets.has(userId)) {
      endCallSession(call, reason, userId);
      acknowledge(callback, { ok: true });
      return;
    }
    removeSocketFromCall(call, socket, reason);
    acknowledge(callback, { ok: true });
  });

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
    [...(socket.callIds || [])].forEach((callId) => {
      const call = activeCalls.get(callId);
      removeSocketFromCall(call, socket, "disconnected");
    });
    if (userId) removeUserSocket(userId, socket.id);
    io.emit("getonlineusers", [...userSocketMap.keys()]);
  });
});

export function getReceiverSocketId(userId) {
  const socketIds = getUserSocketIds(userId);
  return socketIds[0] || null;
}

export { io, app, server };
