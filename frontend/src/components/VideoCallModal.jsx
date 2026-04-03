import {
  Clock3,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCallStore } from "../store/useCallStore";
import { useAuthStore } from "../store/useAuthStore";
import IncomingCallModal from "./IncomingCallModal";

const formatDuration = (seconds) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return [hrs, mins, secs]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
  }

  return [mins, secs].map((value) => String(value).padStart(2, "0")).join(":");
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getGridClassName = (count) => {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 sm:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-2 xl:grid-cols-3";
};

function ControlButton({
  icon: Icon,
  label,
  active = false,
  danger = false,
  onClick,
}) {
  const className = danger
    ? "bg-error text-error-content hover:bg-error/90"
    : active
      ? "bg-primary text-primary-content hover:bg-primary/90"
      : "bg-base-100/70 text-white hover:bg-base-100/90";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`btn btn-circle h-14 w-14 border-0 shadow-lg ${className}`}
    >
      <Icon className="size-5" />
    </button>
  );
}

function AvatarCircle({
  participant,
  sizeClass = "w-28 sm:w-36",
  roundedClass = "rounded-full",
}) {
  return (
    <div className="avatar placeholder">
      <div
        className={`${sizeClass} ${roundedClass} bg-base-300 text-2xl font-semibold text-white ring ring-white/10`}
      >
        {participant?.profilePic?.url ? (
          <img
            src={participant.profilePic.url}
            alt={participant?.fullname || "User"}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>
            {getInitials(participant?.displayName || participant?.fullname)}
          </span>
        )}
      </div>
    </div>
  );
}

function GroupParticipantTile({ participant, isStarter = false }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-neutral/70 shadow-xl">
      {participant?.profilePic?.url && (
        <img
          src={participant.profilePic.url}
          alt={participant.fullname}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-20 blur-2xl"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60" />

      <div className="relative flex h-full min-h-[220px] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="badge border-0 bg-black/35 text-white/80">
            {participant.isSelf
              ? "You"
              : participant.isOnline
                ? "Joined"
                : "Offline"}
          </div>
          {isStarter && (
            <div className="badge border-0 bg-primary/85 text-primary-content">
              Started call
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <AvatarCircle participant={participant} sizeClass="w-24 sm:w-28" />
          <h3 className="mt-4 text-lg font-semibold text-white">
            {participant.displayName}
          </h3>
          <p className="mt-1 text-sm text-white/70">
            {participant.isSelf
              ? "Waiting with camera preview"
              : participant.isOnline
                ? "In call preview"
                : "Not available"}
          </p>
        </div>
      </div>
    </div>
  );
}

function VideoCallModal({ conversation, authUser, onlineUsers, onClose }) {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [deviceMessage, setDeviceMessage] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [calloffer, setCallOffer] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const peerRef = useRef(null);

  const { endCall } = useCallStore();
  const { socket } = useAuthStore();

  const isGroup = Boolean(conversation?.isgroup);
  const onlineUsersSet = useMemo(
    () => new Set(onlineUsers || []),
    [onlineUsers],
  );

  //webRTC logic
  const createPeer = () => {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          to: conversation.oruserId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      videoRef.current.srcObject = event.streams[0];
    };

    streamRef.current.getTracks().forEach((track) => {
      peer.addTrack(track, streamRef.current);
    });

    return peer;
  };

  const callUser = async () => {
    peerRef.current = createPeer();

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit("call-user", {
      to: conversation?.oruserId,
      from: {
        _id: authUser._id,
        name: authUser.fullname,
        profilePic: authUser.profilePic?.url,
      },
      offer,
    });
  };

  const participants = useMemo(() => {
    if (!conversation || !authUser?._id) return [];

    if (isGroup) {
      const members = Object.entries(
        conversation.groupdetail?.membersDetail || {},
      ).map(([id, detail]) => ({
        id,
        fullname:
          id === authUser._id ? `${detail.fullname} (You)` : detail.fullname,
        displayName: id === authUser._id ? "You" : detail.fullname,
        profilePic: detail.profilePic,
        isSelf: id === authUser._id,
        isOnline: id === authUser._id || onlineUsersSet.has(id),
      }));

      return members.sort(
        (left, right) => Number(right.isSelf) - Number(left.isSelf),
      );
    }

    return [
      {
        id: conversation.oruserId,
        fullname: conversation.name,
        displayName: conversation.name,
        profilePic: conversation.profilePic,
        isSelf: false,
        isOnline: onlineUsersSet.has(conversation.oruserId),
      },
      {
        id: authUser._id,
        fullname: `${authUser.fullname} (You)`,
        displayName: "You",
        profilePic: authUser.profilePic,
        isSelf: true,
        isOnline: true,
      },
    ];
  }, [authUser, conversation, isGroup, onlineUsersSet]);

  const selfParticipant = useMemo(
    () => participants.find((participant) => participant.isSelf),
    [participants],
  );

  const otherParticipant = useMemo(
    () => participants.find((participant) => !participant.isSelf),
    [participants],
  );

  const joinedParticipants = useMemo(() => {
    if (!isGroup) return participants;
    return participants
      .filter((participant) => participant.isSelf || participant.isOnline)
      .slice(0, 5);
  }, [isGroup, participants]);

  const totalJoinedCount = useMemo(() => {
    if (!isGroup) return participants.length;
    return participants.filter(
      (participant) => participant.isSelf || participant.isOnline,
    ).length;
  }, [isGroup, participants]);

  const hiddenJoinedCount = Math.max(
    totalJoinedCount - joinedParticipants.length,
    0,
  );
  const waitingCount = isGroup
    ? participants.filter(
        (participant) => !participant.isSelf && !participant.isOnline,
      ).length
    : 0;

  const coverImage = isGroup
    ? conversation?.groupdetail?.groupIcon?.url
    : otherParticipant?.profilePic?.url;

  const title = isGroup
    ? conversation?.groupdetail?.groupname
    : otherParticipant?.displayName;
  const subtitle = isGroup
    ? `Started by You${totalJoinedCount > 1 ? ` - ${Math.min(totalJoinedCount, 5)} of 5 joined` : " - Waiting for members"}`
    : otherParticipant?.isOnline
      ? "Online"
      : "Offline";

  useEffect(() => {
    setDuration(0);
    setMicOn(false);
    setCameraOn(true);
    setSpeakerOn(true);
    setDeviceMessage("");
    setCameraError("");
  }, [conversation?.conversationId]);

  useEffect(() => {
    let cancelled = false;

    const stopPreview = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    if (
      !cameraOn ||
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      stopPreview();
      return stopPreview;
    }

    const startPreview = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        setCameraError("");

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // ✅ start call AFTER stream ready
        callUser();
      } catch (error) {
        setCameraError("Camera preview unavailable");
        stopPreview();
      }
    };

    startPreview();

    return () => {
      cancelled = true;
      stopPreview();
    };
  }, [cameraOn]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDuration((value) => value + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    socket.on("incoming-call", ({ from, offer }) => {
      console.log(from, offer, "butwhy");
      setIncomingCall(from);
      setCallOffer(offer);
    });
    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await peerRef.current.addIceCandidate(candidate);
      } catch (err) {
        console.error(err);
      }
    });
    return () => {
      socket.off("incoming-call");
      socket.off("ice-candidate");
    };
  }, [socket]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  useEffect(() => {
    if (!deviceMessage) return undefined;

    const timer = window.setTimeout(() => {
      setDeviceMessage("");
    }, 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [deviceMessage]);

  const handleToggleMic = async () => {
    if (micOn) {
      setMicOn(false);
      setDeviceMessage("Microphone muted");
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setDeviceMessage("Microphone not supported");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      stream.getTracks().forEach((track) => track.stop());
      setMicOn(true);
      setDeviceMessage("Microphone ready");
    } catch (error) {
      setMicOn(false);
      setDeviceMessage("Microphone permission denied");
    }
  };

  const renderLocalPreview = () => (
    <div className="absolute bottom-6 right-4 w-24 sm:bottom-8 sm:right-8 sm:w-32">
      <div className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-black/50 shadow-2xl backdrop-blur">
        <div className="relative aspect-[3/4] bg-base-300/20">
          {cameraOn && !cameraError ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover [transform:scaleX(-1)]"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-white/75">
              <AvatarCircle
                participant={selfParticipant}
                sizeClass="w-14"
                roundedClass="rounded-2xl"
              />
              <p className="text-[11px]">{cameraError || "Camera is off"}</p>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 px-3 py-2 text-xs text-white/70">
          You
        </div>
      </div>
    </div>
  );

  const handleAcceptIncomingCall = () => {
    if (!incomingCall?.conversation) return;
    setActiveCallConversation(incomingCall.conversation);
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    setIncomingCall(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-[90] overflow-hidden bg-neutral text-neutral-content">
        {coverImage && (
          <img
            src={coverImage}
            alt={title}
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-3xl"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35),rgba(0,0,0,0.85))]" />

        <div className="relative flex h-full flex-col px-4 pb-6 pt-5 sm:px-6 sm:pb-8">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-circle border-0 bg-black/25 text-white hover:bg-black/40"
            >
              <X className="size-5" />
            </button>

            <div className="min-w-0 flex-1 px-2 text-center">
              <h2 className="truncate text-lg font-semibold text-white sm:text-xl">
                {title}
              </h2>
              <p className="mt-1 truncate text-sm text-white/70">{subtitle}</p>
            </div>

            <div className="badge border-0 bg-black/30 px-3 py-3 text-white">
              <Clock3 className="mr-1 size-3.5" />
              {formatDuration(duration)}
            </div>
          </div>

          {deviceMessage && (
            <div className="mx-auto mt-4 w-fit rounded-full bg-black/40 px-4 py-2 text-sm text-white/85">
              {deviceMessage}
            </div>
          )}

          {!isGroup ? (
            <div className="relative flex flex-1 items-center justify-center px-4 pb-24 pt-8 text-center sm:px-6">
              <div className="flex max-w-md flex-col items-center">
                <AvatarCircle participant={otherParticipant} />
                <h3 className="mt-6 text-2xl font-semibold text-white sm:text-3xl">
                  {otherParticipant?.displayName}
                </h3>
                <p className="mt-2 text-sm text-white/70">{subtitle}</p>
              </div>
              {renderLocalPreview()}
            </div>
          ) : (
            <div className="relative flex flex-1 flex-col pb-24 pt-5 sm:pt-6">
              <div
                className={`grid flex-1 gap-3 ${getGridClassName(joinedParticipants.length)}`}
              >
                {joinedParticipants.map((participant) => (
                  <GroupParticipantTile
                    key={participant.id}
                    participant={participant}
                    isStarter={participant.isSelf}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs text-white/65">
                <div className="badge border-0 bg-black/30 px-3 py-3 text-white/80">
                  {Math.min(totalJoinedCount, 5)} joined
                </div>
                {waitingCount > 0 && (
                  <div className="badge border-0 bg-black/25 px-3 py-3 text-white/70">
                    {waitingCount} waiting
                  </div>
                )}
                {hiddenJoinedCount > 0 && (
                  <div className="badge border-0 bg-black/25 px-3 py-3 text-white/70">
                    +{hiddenJoinedCount} more online
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center px-4">
            <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-full bg-black/35 px-4 py-3 shadow-2xl backdrop-blur-md">
              <ControlButton
                icon={micOn ? Mic : MicOff}
                label={micOn ? "Mute microphone" : "Turn on microphone"}
                active={micOn}
                onClick={handleToggleMic}
              />
              <ControlButton
                icon={cameraOn ? Video : VideoOff}
                label={cameraOn ? "Turn off camera" : "Turn on camera"}
                active={cameraOn}
                onClick={() =>
                  setCameraOn((value) => {
                    if (value) {
                      setCameraError("");
                    }
                    return !value;
                  })
                }
              />
              <ControlButton
                icon={speakerOn ? Volume2 : VolumeX}
                label={speakerOn ? "Turn off speaker" : "Turn on speaker"}
                active={speakerOn}
                onClick={() => setSpeakerOn((value) => !value)}
              />
              <ControlButton
                icon={PhoneOff}
                label="End call"
                danger
                onClick={onClose}
              />
            </div>
          </div>
        </div>
      </div>
      {incomingCall && (
        <IncomingCallModal
          callerName={incomingCall.name}
          callerProfilePic={incomingCall.profilePic}
          isOnline={incomingCall.isOnline}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}
    </>
  );
}

export default VideoCallModal;
