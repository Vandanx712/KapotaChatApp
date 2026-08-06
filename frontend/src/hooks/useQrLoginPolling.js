import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

const POLLING_DELAY = 2000;
const RETRY_DELAY = 4000;

export const useQrLoginPolling = ({
  requestId,
  browserSecret,
  enabled = true,
  onCompleted,
  onExpired,
}) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const qrComplete = useAuthStore((state) => state.qrComplete);

  useEffect(() => {
    if (!enabled || !requestId || !browserSecret) {
      return undefined;
    }

    let isCancelled = false;
    let timeoutId = null;

    const scheduleNextPoll = (callback, delay = POLLING_DELAY) => {
      if (isCancelled) return;
      timeoutId = window.setTimeout(callback, delay);
    };

    const pollLoginStatus = async () => {
      if (isCancelled) return;

      try {
        setError("");
        const response = await qrComplete({ requestId, browserSecret });
        if (isCancelled) return;

        if (response.status === "completed") {
          setStatus("completed");
          onCompleted?.(response.user);
          return;
        }

        setStatus("waiting");
        scheduleNextPoll(pollLoginStatus);
      } catch (pollError) {
        if (isCancelled) return;

        const statusCode = pollError?.response?.status;
        const message =
          pollError?.response?.data?.message || "Unable to check QR login";

        if (statusCode === 410) {
          setStatus("expired");
          setError("Refreshing expired QR code");
          onExpired?.();
          return;
        }

        if (statusCode === 401) {
          setStatus("invalid");
          setError("Refreshing invalid QR code");
          onExpired?.();
          return;
        }

        if (statusCode === 409) {
          setStatus("waiting");
          scheduleNextPoll(pollLoginStatus);
          return;
        }

        setStatus("network-error");
        setError(message);
        scheduleNextPoll(pollLoginStatus, RETRY_DELAY);
      }
    };

    scheduleNextPoll(() => {
      setStatus("waiting");
      pollLoginStatus();
    }, 0);

    return () => {
      isCancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [
    browserSecret,
    enabled,
    onCompleted,
    onExpired,
    qrComplete,
    requestId,
  ]);

  return {
    status,
    error,
    isWaiting: status === "waiting" || status === "network-error",
    isCompleted: status === "completed",
    isExpired: status === "expired",
  };
};
