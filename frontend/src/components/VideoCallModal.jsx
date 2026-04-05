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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import LoadableImage from "./common/LoadableImage";

const STUN_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

const getConversationId = (conversation) =>
  conversation?.conversationId?.toString?.() ||
  conversation?._id?.toString?.() ||
  "";

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

const normalizeProfilePic = (profilePic) => {
  if (!profilePic) return null;
  if (typeof profilePic === "string") return { url: profilePic };
  return profilePic;
};

const getGridClassName = (count) => {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-2 xl:grid-cols-3";
};

const normalizeId = (value) => {
  if (!value) return "";
  return value.toString();
};

function ControlButton({
  icon,
  label,
  active = false,
  danger = false,
  onClick,
}) {
  const IconComponent = icon;
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
      <IconComponent className="size-5" />
    </button>
  );
}

function AvatarCircle({
  participant,
  sizeClass = "w-24 sm:w-28",
  roundedClass = "rounded-2xl",
}) {
  return (
    <div className="avatar placeholder">
      <div
        className={`${sizeClass} ${roundedClass} bg-base-300 text-2xl font-semibold text-white ring ring-white/10`}
      >
        {participant?.profilePic?.url ? (
          <LoadableImage
            src={participant.profilePic.url}
            alt={participant?.displayName || "User"}
            className="h-full w-full object-cover"
            imgProps={{ loading: "eager", decoding: "async" }}
          />
        ) : (
          <span>{getInitials(participant?.displayName || "U")}</span>
        )}
      </div>
    </div>
  );
}

function ParticipantTile({
  participant,
  stream,
  isSelf = false,
  muted = false,
  bindVideoRef,
  fallbackText,
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-white/10 bg-neutral/70 shadow-xl">
      {participant?.profilePic?.url && (
        <LoadableImage
          src={participant.profilePic.url}
          alt={participant.displayName}
          className="absolute inset-0 h-full w-full scale-110 object-cover opacity-15 blur-2xl"
          wrapperClassName="absolute inset-0"
          imgProps={{ loading: "eager", decoding: "async" }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/60" />

      <div className="relative min-h-[210px]">
        {stream ? (
          <video
            ref={bindVideoRef}
            autoPlay
            playsInline
            muted={muted}
            className={`h-full min-h-[210px] w-full object-cover ${isSelf ? "[transform:scaleX(-1)]" : ""}`}
          />
        ) : (
          <div className="flex h-full min-h-[210px] flex-col items-center justify-center gap-3 px-4 text-center text-white/75">
            <AvatarCircle participant={participant} />
            <p className="text-xs">{fallbackText}</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-full bg-black/45 px-3 py-1.5 text-xs text-white/85 backdrop-blur">
        <span className="truncate">{participant.displayName}</span>
        <span>{isSelf ? "You" : stream ? "Connected" : "Connecting"}</span>
      </div>
    </div>
  );
}

function VideoCallModal({
  conversation,
  authUser,
  onlineUsers,
  socket,
  mode = "outgoing",
  incomingSignal = null,
  onClose,
}) {
  const conversationId = getConversationId(conversation);
  const isGroup = Boolean(conversation?.isgroup);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const remoteVideoRefs = useRef({});
  const makingOfferRef = useRef(new Map());

  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [remoteStreams, setRemoteStreams] = useState({});

  const onlineUsersSet = useMemo(
    () => new Set((onlineUsers || []).map((id) => id.toString())),
    [onlineUsers],
  );

  const participants = useMemo(() => {
    if (!conversation || !authUser?._id) return [];

    if (isGroup) {
      const members = Object.entries(
        conversation?.groupdetail?.membersDetail || {},
      ).map(([id, detail]) => ({
        id: id.toString(),
        displayName: id === authUser._id ? "You" : detail?.fullname || "Unknown",
        profilePic: normalizeProfilePic(detail?.profilePic),
        isSelf: id === authUser._id,
        isOnline: id === authUser._id || onlineUsersSet.has(id),
      }));

      if (!members.find((member) => member.id === authUser._id)) {
        members.unshift({
          id: authUser._id.toString(),
          displayName: "You",
          profilePic: normalizeProfilePic(authUser?.profilePic),
          isSelf: true,
          isOnline: true,
        });
      }

      return members.sort(
        (left, right) => Number(right.isSelf) - Number(left.isSelf),
      );
    }

    const otherId = normalizeId(conversation?.oruserId);
    return [
      {
        id: authUser._id.toString(),
        displayName: "You",
        profilePic: normalizeProfilePic(authUser?.profilePic),
        isSelf: true,
        isOnline: true,
      },
      {
        id: otherId,
        displayName: conversation?.name || "Unknown",
        profilePic: normalizeProfilePic(conversation?.profilePic),
        isSelf: false,
        isOnline: onlineUsersSet.has(otherId),
      },
    ];
  }, [authUser, conversation, isGroup, onlineUsersSet]);

  const selfParticipant = useMemo(
    () => participants.find((participant) => participant.isSelf),
    [participants],
  );

  const remoteParticipants = useMemo(
    () => participants.filter((participant) => !participant.isSelf),
    [participants],
  );

  const title = isGroup
    ? conversation?.groupdetail?.groupname || "Group Call"
    : remoteParticipants[0]?.displayName || "Call";

  const subtitle = isGroup
    ? "Group video call"
    : remoteParticipants[0]?.isOnline
      ? "Online"
      : "Connecting";

  const localCallerPayload = useMemo(
    () => ({
      _id: authUser?._id?.toString?.() || "",
      name: authUser?.fullname || "Unknown",
      fullname: authUser?.fullname || "Unknown",
      profilePic: normalizeProfilePic(authUser?.profilePic),
    }),
    [authUser],
  );

  const syncLocalTracks = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const [audioTrack] = stream.getAudioTracks();
    const [videoTrack] = stream.getVideoTracks();
    if (audioTrack) audioTrack.enabled = micOn;
    if (videoTrack) videoTrack.enabled = cameraOn;
  }, [micOn, cameraOn]);

  const attachRemoteVideo = useCallback(
    (userId, stream) => {
      const node = remoteVideoRefs.current[userId];
      if (!node) return;
      if (node.srcObject !== stream) {
        node.srcObject = stream;
      }
      node.muted = !speakerOn;
    },
    [speakerOn],
  );

  const enqueueCandidate = useCallback((userId, candidate) => {
    if (!pendingCandidatesRef.current.has(userId)) {
      pendingCandidatesRef.current.set(userId, []);
    }
    pendingCandidatesRef.current.get(userId).push(candidate);
  }, []);

  const flushPendingCandidates = useCallback(async (userId, peer) => {
    const candidates = pendingCandidatesRef.current.get(userId) || [];
    if (!candidates.length) return;
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.log("Failed to add queued ICE candidate", error);
      }
    }
    pendingCandidatesRef.current.delete(userId);
  }, []);

  const createPeerConnection = useCallback(
    (userId) => {
      const normalizedUserId = normalizeId(userId);
      if (!normalizedUserId) return null;

      if (peerConnectionsRef.current.has(normalizedUserId)) {
        return peerConnectionsRef.current.get(normalizedUserId);
      }

      const peer = new RTCPeerConnection({ iceServers: STUN_SERVERS });

      const localStream = localStreamRef.current;
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peer.addTrack(track, localStream);
        });
      }

      peer.onicecandidate = (event) => {
        if (!event.candidate || !socket || !authUser?._id) return;
        socket.emit("ice-candidate", {
          to: normalizedUserId,
          from: authUser._id,
          candidate: event.candidate,
          conversationId,
        });
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;
        setRemoteStreams((prev) => ({
          ...prev,
          [normalizedUserId]: stream,
        }));
      };

      peer.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(peer.connectionState)) {
          setRemoteStreams((prev) => {
            const next = { ...prev };
            delete next[normalizedUserId];
            return next;
          });
        }
      };

      peerConnectionsRef.current.set(normalizedUserId, peer);
      return peer;
    },
    [socket, authUser?._id, conversationId],
  );

  const ensureLocalStream = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      throw new Error("media-not-supported");
    }

    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: "user" },
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    }
    return localStreamRef.current;
  }, []);

  const createAndSendOffer = useCallback(
    async (targetUserId) => {
      const normalizedTargetId = normalizeId(targetUserId);
      if (!normalizedTargetId || normalizedTargetId === authUser?._id) return;

      const peer = createPeerConnection(normalizedTargetId);
      if (!peer || !socket) return;

      try {
        makingOfferRef.current.set(normalizedTargetId, true);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("call-user", {
          to: normalizedTargetId,
          from: localCallerPayload,
          offer,
          conversationId,
          isGroup,
          conversation,
        });
      } catch (error) {
        console.log("Failed to create offer", error);
      } finally {
        makingOfferRef.current.set(normalizedTargetId, false);
      }
    },
    [
      authUser?._id,
      createPeerConnection,
      socket,
      localCallerPayload,
      conversationId,
      isGroup,
      conversation,
    ],
  );

  const handleIncomingOffer = useCallback(
    async ({ from, offer }) => {
      const fromId = normalizeId(from?._id || from);
      if (!fromId || !offer || fromId === authUser?._id) return;

      const peer = createPeerConnection(fromId);
      if (!peer || !socket) return;

      const polite = authUser?._id?.toString() > fromId;
      const makingOffer = makingOfferRef.current.get(fromId);
      const offerCollision = makingOffer || peer.signalingState !== "stable";

      if (offerCollision && !polite) {
        return;
      }

      try {
        if (offerCollision) {
          await peer.setLocalDescription({ type: "rollback" });
        }
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await flushPendingCandidates(fromId, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        socket.emit("call-accepted", {
          to: fromId,
          from: authUser._id,
          answer,
          conversationId,
        });
      } catch (error) {
        console.log("Failed to handle incoming offer", error);
      }
    },
    [
      authUser?._id,
      createPeerConnection,
      socket,
      flushPendingCandidates,
      conversationId,
    ],
  );

  const handleIncomingAnswer = useCallback(
    async ({ from, answer }) => {
      const fromId = normalizeId(from);
      if (!fromId || !answer) return;
      const peer = peerConnectionsRef.current.get(fromId);
      if (!peer) return;
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(fromId, peer);
      } catch (error) {
        console.log("Failed to apply answer", error);
      }
    },
    [flushPendingCandidates],
  );

  const handleIncomingCandidate = useCallback(
    async ({ from, candidate }) => {
      const fromId = normalizeId(from);
      if (!fromId || !candidate || fromId === authUser?._id) return;

      const peer = peerConnectionsRef.current.get(fromId);
      if (!peer || !peer.remoteDescription) {
        enqueueCandidate(fromId, candidate);
        return;
      }

      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.log("Failed to add ICE candidate", error);
      }
    },
    [authUser?._id, enqueueCandidate],
  );

  const closeAllConnections = useCallback(() => {
    peerConnectionsRef.current.forEach((peer) => {
      try {
        peer.onicecandidate = null;
        peer.ontrack = null;
        peer.close();
      } catch (error) {
        console.log("Failed to close peer", error);
      }
    });
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    makingOfferRef.current.clear();
    remoteVideoRefs.current = {};
    setRemoteStreams({});
  }, []);

  const stopLocalStream = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setDuration((value) => value + 1);
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    syncLocalTracks();
  }, [syncLocalTracks]);

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      attachRemoteVideo(userId, stream);
    });
  }, [remoteStreams, attachRemoteVideo]);

  useEffect(() => {
    if (!speakerOn) {
      Object.values(remoteVideoRefs.current).forEach((node) => {
        if (node) node.muted = true;
      });
    } else {
      Object.values(remoteVideoRefs.current).forEach((node) => {
        if (node) node.muted = false;
      });
    }
  }, [speakerOn]);

  useEffect(() => {
    if (!socket || !conversationId || !authUser?._id) return undefined;

    const onIncomingCall = (payload) => {
      const payloadConversationId = normalizeId(payload?.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId) return;
      handleIncomingOffer(payload);
    };

    const onCallAccepted = (payload) => {
      const payloadConversationId = normalizeId(payload?.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId) return;
      handleIncomingAnswer(payload);
    };

    const onIceCandidate = (payload) => {
      const payloadConversationId = normalizeId(payload?.conversationId);
      if (payloadConversationId && payloadConversationId !== conversationId) return;
      handleIncomingCandidate(payload);
    };

    socket.on("incoming-call", onIncomingCall);
    socket.on("call-accepted", onCallAccepted);
    socket.on("ice-candidate", onIceCandidate);

    return () => {
      socket.off("incoming-call", onIncomingCall);
      socket.off("call-accepted", onCallAccepted);
      socket.off("ice-candidate", onIceCandidate);
    };
  }, [
    socket,
    conversationId,
    authUser?._id,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingCandidate,
  ]);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        await ensureLocalStream();
      } catch {
        toast.error("Camera or microphone permission is required");
        onClose();
        return;
      }

      if (cancelled) return;

      if (mode === "incoming" && incomingSignal?.offer && incomingSignal?.from) {
        await handleIncomingOffer(incomingSignal);
      }

      if (isGroup) {
        const incomingFromId = normalizeId(incomingSignal?.from?._id);
        const memberIds = Object.keys(conversation?.groupdetail?.membersDetail || {});
        const targetIds = memberIds
          .filter((id) => normalizeId(id) !== normalizeId(authUser?._id))
          .filter((id) => onlineUsersSet.has(normalizeId(id)))
          .filter((id) => !(mode === "incoming" && id === incomingFromId));

        await Promise.all(targetIds.map((id) => createAndSendOffer(id)));
      } else if (mode === "outgoing") {
        const targetId = normalizeId(conversation?.oruserId);
        if (targetId) {
          await createAndSendOffer(targetId);
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      closeAllConnections();
      stopLocalStream();
    };
    // This effect intentionally runs once for the lifetime of this modal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleToggleMic = () => {
    const nextValue = !micOn;
    setMicOn(nextValue);
  };

  const handleToggleCamera = () => {
    const nextValue = !cameraOn;
    setCameraOn(nextValue);
  };

  const remoteEntries = useMemo(
    () =>
      remoteParticipants.map((participant) => ({
        participant,
        stream: remoteStreams[participant.id] || null,
      })),
    [remoteParticipants, remoteStreams],
  );

  const groupTiles = useMemo(() => {
    const selfTile = {
      participant: selfParticipant,
      stream: localStreamRef.current,
      isSelf: true,
    };
    return [selfTile, ...remoteEntries];
  }, [selfParticipant, remoteEntries]);

  return (
    <div className="fixed inset-0 z-[90] overflow-hidden bg-neutral text-neutral-content">
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

        {!isGroup ? (
          <div className="relative flex flex-1 items-center justify-center px-2 pb-24 pt-6 sm:px-6">
            <div className="w-full max-w-4xl">
              <ParticipantTile
                participant={remoteEntries[0]?.participant || remoteParticipants[0]}
                stream={remoteEntries[0]?.stream}
                bindVideoRef={(node) => {
                  const remoteId = remoteParticipants[0]?.id;
                  if (!remoteId) return;
                  if (!node) {
                    delete remoteVideoRefs.current[remoteId];
                    return;
                  }
                  remoteVideoRefs.current[remoteId] = node;
                  const stream = remoteStreams[remoteId];
                  if (stream && node.srcObject !== stream) {
                    node.srcObject = stream;
                  }
                  node.muted = !speakerOn;
                }}
                fallbackText={
                  remoteParticipants[0]?.isOnline
                    ? "Waiting for video stream"
                    : "User is offline"
                }
              />
            </div>

            <div className="absolute bottom-6 right-4 w-28 sm:bottom-8 sm:right-8 sm:w-36">
              <div className="overflow-hidden rounded-[1.25rem] border border-white/15 bg-black/50 shadow-2xl backdrop-blur">
                <div className="relative aspect-[3/4] bg-base-300/20">
                  {localStreamRef.current && cameraOn ? (
                    <video
                      ref={(node) => {
                        localVideoRef.current = node;
                        if (node && localStreamRef.current) {
                          node.srcObject = localStreamRef.current;
                        }
                      }}
                      autoPlay
                      muted
                      playsInline
                      className="h-full w-full object-cover [transform:scaleX(-1)]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center p-3 text-center text-white/75">
                      <AvatarCircle
                        participant={selfParticipant}
                        sizeClass="w-14"
                        roundedClass="rounded-xl"
                      />
                    </div>
                  )}
                </div>
                <div className="border-t border-white/10 px-3 py-2 text-xs text-white/70">
                  You
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`grid flex-1 gap-3 pb-24 pt-6 ${getGridClassName(groupTiles.length)}`}
          >
            {groupTiles.map(({ participant, stream, isSelf }) => (
              <ParticipantTile
                key={participant?.id}
                participant={participant}
                stream={isSelf ? (cameraOn ? localStreamRef.current : null) : stream}
                isSelf={Boolean(isSelf)}
                muted={Boolean(isSelf) || !speakerOn}
                bindVideoRef={(node) => {
                  if (isSelf) {
                    localVideoRef.current = node;
                    if (node && localStreamRef.current) {
                      node.srcObject = localStreamRef.current;
                    }
                    return;
                  }

                  const remoteId = participant?.id;
                  if (!remoteId) return;
                  if (!node) {
                    delete remoteVideoRefs.current[remoteId];
                    return;
                  }
                  remoteVideoRefs.current[remoteId] = node;
                  const remoteStream = remoteStreams[remoteId];
                  if (remoteStream && node.srcObject !== remoteStream) {
                    node.srcObject = remoteStream;
                  }
                  node.muted = !speakerOn;
                }}
                fallbackText={
                  participant?.isOnline
                    ? "Waiting for video stream"
                    : "User is offline"
                }
              />
            ))}
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
              onClick={handleToggleCamera}
            />
            <ControlButton
              icon={speakerOn ? Volume2 : VolumeX}
              label={speakerOn ? "Turn off speaker" : "Turn on speaker"}
              active={speakerOn}
              onClick={() => setSpeakerOn((value) => !value)}
            />
            <ControlButton icon={PhoneOff} label="End call" danger onClick={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoCallModal;
