import { useEffect } from "react";
import { drainOutboxQueue } from "../lib/outboxQueue";
import { useAuthStore } from "../store/useAuthStore";

/**
 * Global hook to auto-drain the outbox queue on:
 * 1. 'online' browser event
 * 2. 'visibilitychange' (when user returns to tab)
 * 3. Socket.IO 'connect' event
 */
export function useOfflineSync() {
  const socket = useAuthStore((state) => state.socket);

  useEffect(() => {
    // 1. Drain on initial mount if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      drainOutboxQueue();
    }

    // 2. Online event listener
    const handleOnline = () => {
      console.log("[OfflineSync] Network is online. Draining outbox...");
      drainOutboxQueue();
    };

    // 3. Visibility change listener (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden && navigator.onLine) {
        drainOutboxQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleSocketConnect = () => {
      console.log("[OfflineSync] Socket connected. Draining outbox...");
      drainOutboxQueue();
    };

    socket.on("connect", handleSocketConnect);

    // If socket is already connected when hook attaches
    if (socket.connected) {
      drainOutboxQueue();
    }

    return () => {
      socket.off("connect", handleSocketConnect);
    };
  }, [socket]);
}
