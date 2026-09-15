import { sendMessage as sendMessageApi } from "./axios";
import { useChatStore } from "../store/useChatStore";

const STORAGE_KEY = "kapota_outbox_queue";

/**
 * Reads all queued items from localStorage
 * @returns {Array<{ tempId: string, conversationId: string, text: string, mediaId?: string, media?: any, replyToId?: string, replyingTo?: any, createdAt: string, status: 'pending' | 'sending' | 'failed' }>}
 */
export function getOutboxQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read outbox queue from localStorage:", e);
    return [];
  }
}

/**
 * Persists the outbox queue to localStorage
 */
export function saveOutboxQueue(queue) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save outbox queue to localStorage:", e);
  }
}

/**
 * Adds an item to the outbox queue
 */
export function addToOutbox(item) {
  const queue = getOutboxQueue();
  // Ensure no duplicate tempId
  const filtered = queue.filter((q) => q.tempId !== item.tempId);
  filtered.push({
    tempId: item.tempId,
    conversationId: item.conversationId,
    text: item.text || "",
    mediaId: item.mediaId || null,
    media: item.media || null,
    replyToId: item.replyToId || null,
    replyingTo: item.replyingTo || null,
    createdAt: item.createdAt || new Date().toISOString(),
    status: item.status || "pending",
  });
  saveOutboxQueue(filtered);
}

/**
 * Updates status and properties of a specific outbox item
 */
export function updateOutboxItem(tempId, updates) {
  const queue = getOutboxQueue();
  const updated = queue.map((item) =>
    item.tempId === tempId ? { ...item, ...updates } : item,
  );
  saveOutboxQueue(updated);
}

/**
 * Removes an item from the outbox queue
 */
export function removeFromOutbox(tempId) {
  const queue = getOutboxQueue();
  const filtered = queue.filter((item) => item.tempId !== tempId);
  saveOutboxQueue(filtered);
}

let isDraining = false;

/**
 * Drains the outbox queue in FIFO order.
 * Dispatches messages one by one to prevent out-of-order delivery.
 */
export async function drainOutboxQueue() {
  if (isDraining) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const queue = getOutboxQueue();
  if (queue.length === 0) return;

  isDraining = true;

  try {
    // Process FIFO
    for (const item of queue) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Disconnected mid-drain, stop draining
        break;
      }

      // Mark sending in queue and in store
      updateOutboxItem(item.tempId, { status: "sending" });
      useChatStore.getState().updateOptimisticMessageStatus?.(item.tempId, "sending");

      try {
        const payload = {
          text: item.text,
          mediaId: item.mediaId || undefined,
          replyToId: item.replyToId || undefined,
        };

        const resdata = await sendMessageApi(item.conversationId, payload);
        const confirmedMessage = resdata.newMessage || resdata;

        // Success: remove from outbox
        removeFromOutbox(item.tempId);

        // Replace optimistic temp message with confirmed backend message in Zustand
        useChatStore
          .getState()
          .replaceOptimisticMessage?.(item.tempId, {
            ...confirmedMessage,
            status: "sent",
          });
      } catch (error) {
        console.warn(`Failed to drain message ${item.tempId}:`, error);

        const isNetworkErr =
          !error.response ||
          error.code === "ERR_NETWORK" ||
          error.message === "Network Error" ||
          error.code === "ECONNABORTED" ||
          (typeof navigator !== "undefined" && !navigator.onLine);

        if (isNetworkErr) {
          // Network drop: keep as pending in outbox queue
          updateOutboxItem(item.tempId, { status: "pending" });
          useChatStore
            .getState()
            .updateOptimisticMessageStatus?.(item.tempId, "pending");
          // Stop draining remaining items until network returns
          break;
        } else {
          // Client or Server 4xx/5xx rejection: mark as failed
          updateOutboxItem(item.tempId, { status: "failed" });
          useChatStore
            .getState()
            .updateOptimisticMessageStatus?.(item.tempId, "failed");
        }
      }
    }
  } finally {
    isDraining = false;
  }
}

/**
 * Retry sending a specific failed outbox message
 */
export function retryOutboxMessage(tempId) {
  updateOutboxItem(tempId, { status: "pending" });
  useChatStore.getState().updateOptimisticMessageStatus?.(tempId, "pending");
  drainOutboxQueue();
}
