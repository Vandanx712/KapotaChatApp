import { Phone, PhoneOff, Users, Video } from "lucide-react";
import { useEffect } from "react";
import LoadableImage from "./common/LoadableImage";

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
  conversationName,
  isGroup = false,
  onAccept,
  onDecline,
}) {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onDecline();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onDecline]);

  return (
    <div className="fixed inset-0 z-[105] flex min-h-[560px] flex-col bg-[#111b21] text-white">
      <header className="flex h-16 shrink-0 items-center border-b border-white/10 bg-[#202c33] px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-[#00a884] text-[#071b16]">
            <Video className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Incoming video call</h2>
            <p className="mt-0.5 text-xs text-white/55">Kapota</p>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <div className="flex size-40 items-center justify-center overflow-hidden rounded-full bg-[#2a3942] text-4xl font-semibold ring-1 ring-white/15">
          {callerProfilePic?.url ? (
            <LoadableImage
              src={callerProfilePic.url}
              alt={callerName}
              wrapperClassName="h-full w-full"
              className="h-full w-full object-cover"
              imgProps={{ loading: "eager", decoding: "async" }}
            />
          ) : (
            <span>{getInitials(callerName)}</span>
          )}
        </div>

        <h1 className="mt-7 text-3xl font-semibold">{conversationName || callerName}</h1>
        <p className="mt-3 flex items-center gap-2 text-sm text-white/60">
          {isGroup && <Users className="size-4" />}
          {isGroup ? `${callerName} started a group call` : "Incoming video call"}
        </p>
      </main>

      <footer className="flex h-28 shrink-0 items-center justify-center gap-16 border-t border-white/10 bg-[#202c33]">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onDecline}
            className="flex size-14 items-center justify-center rounded-full bg-[#ea5b61] text-white transition hover:bg-[#d94d54] focus-visible:ring-offset-[#202c33]"
            aria-label="Decline call"
            title="Decline"
          >
            <PhoneOff className="size-5" />
          </button>
          <span className="text-xs text-white/65">Decline</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={onAccept}
            className="flex size-14 items-center justify-center rounded-full bg-[#00a884] text-[#071b16] transition hover:bg-[#06cf9c] focus-visible:ring-offset-[#202c33]"
            aria-label="Accept call"
            title="Accept"
          >
            <Phone className="size-5" />
          </button>
          <span className="text-xs text-white/65">Accept</span>
        </div>
      </footer>
    </div>
  );
}

export default IncomingCallModal;
