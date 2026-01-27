import { io } from "socket.io-client";

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
};

export const getsocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
