import { Phone, PhoneOff, Video, X } from "lucide-react";
import { useEffect } from "react";

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

function IncomingCallModal({
  callerName,
  callerProfilePic,
  isOnline = false,
  onAccept,
  onDecline,
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onDecline();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-[95] overflow-hidden bg-neutral text-neutral-content">
      {callerProfilePic?.url && (
        <img
          src={callerProfilePic.url}
          alt={callerName}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.25),rgba(0,0,0,0.9))]" />

      <div className="relative flex h-full flex-col px-5 pb-8 pt-6 sm:px-8">
        <div className="flex justify-between">
          <div className="badge border-0 bg-black/30 px-3 py-3 text-white/80">
            <Video className="mr-1 size-3.5" />
            Incoming video call
          </div>

          <button
            type="button"
            onClick={onDecline}
            className="btn btn-circle border-0 bg-black/25 text-white hover:bg-black/40"
            aria-label="Close incoming call"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-success/20 blur-xl animate-pulse" />
            <div className="avatar placeholder relative">
              <div className="w-32 rounded-full bg-base-300 text-3xl font-semibold text-white ring ring-white/15 sm:w-40">
                {callerProfilePic?.url ? (
                  <img
                    src={callerProfilePic.url}
                    alt={callerName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{getInitials(callerName)}</span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-8 text-sm uppercase tracking-[0.3em] text-white/55">
            Kapota call
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            {callerName}
          </h2>
          <p className="mt-3 text-sm text-white/70">
            {isOnline ? "Calling you now" : "Trying to connect"}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-8">
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onDecline}
              className="btn btn-circle h-16 w-16 border-0 bg-error text-error-content shadow-xl hover:bg-error/90"
            >
              <PhoneOff className="size-6" />
            </button>
            <span className="text-sm text-white/75">Decline</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={onAccept}
              className="btn btn-circle h-16 w-16 border-0 bg-success text-success-content shadow-xl hover:bg-success/90"
            >
              <Phone className="size-6" />
            </button>
            <span className="text-sm text-white/75">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallModal;
