import {
  Clock3,
  LockKeyhole,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  PhoneOff,
  Users,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import LoadableImage from "./common/LoadableImage";

const splitUrls = (value) =>
  value
    ?.split(",")
    .map((url) => url.trim())
    .filter(Boolean) || [];

const buildIceServers = () => {
  const servers = [
    {
      urls: splitUrls(import.meta.env.VITE_STUN_URL).length
        ? splitUrls(import.meta.env.VITE_STUN_URL)
        : ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ];
  const turnUrls = splitUrls(import.meta.env.VITE_TURN_URL);
  if (turnUrls.length) {
    servers.push({
      urls: turnUrls,
      username: import.meta.env.VITE_TURN_USERNAME || "",
      credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
    });
  }
  return servers;
};

const ICE_SERVERS = buildIceServers();
const NO_ANSWER_TIMEOUT_MS = 45_000;

const normalizeId = (value) => value?.toString?.() || "";

const getConversationId = (conversation) =>
  normalizeId(conversation?.conversationId || conversation?._id);

const normalizeProfilePic = (profilePic) => {
  if (!profilePic) return null;
  return typeof profilePic === "string" ? { url: profilePic } : profilePic;
};

const normalizeParticipant = (participant) => {
  const id = normalizeId(participant?._id || participant?.id);
  return {
    ...participant,
    id,
    _id: id,
    displayName:
      participant?.displayName || participant?.name || participant?.fullname || "Unknown",
    profilePic: normalizeProfilePic(participant?.profilePic),
    micOn: participant?.micOn !== false,
    cameraOn: participant?.cameraOn !== false,
  };
};

const serializeDescription = (description) => ({
  type: description.type,
  sdp: description.sdp,
});

const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const values = hours > 0
    ? [hours, minutes, remainingSeconds]
    : [minutes, remainingSeconds];
  return values.map((value) => String(value).padStart(2, "0")).join(":");
};

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const emitWithAck = (socket, event, payload, timeout = 10_000) =>
  new Promise((resolve, reject) => {
    socket.timeout(timeout).emit(event, payload, (timeoutError, response) => {
      if (timeoutError) {
        reject(new Error("The call server did not respond"));
        return;
      }
      if (!response?.ok) {
        const error = new Error(response?.message || "Unable to continue the call");
        error.code = response?.code;
        reject(error);
        return;
      }
      resolve(response);
    });
  });

function StreamVideo({ stream, muted = false, mirror = false, className = "" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream || null;
    if (stream) video.play().catch(() => {});
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={`${className} ${mirror ? "[transform:scaleX(-1)]" : ""}`}
    />
  );
}

function ParticipantAvatar({ participant, sizeClass = "size-32" }) {
  return (
    <div
      className={`flex ${sizeClass} items-center justify-center overflow-hidden rounded-full bg-[#2a3942] text-3xl font-semibold text-white ring-1 ring-white/15`}
    >
      {participant?.profilePic?.url ? (
        <LoadableImage
          src={participant.profilePic.url}
          alt={participant.displayName}
          wrapperClassName="h-full w-full"
          className="h-full w-full object-cover"
          imgProps={{ loading: "eager", decoding: "async" }}
        />
      ) : (
        <span>{getInitials(participant?.displayName || "User")}</span>
      )}
    </div>
  );
}

function CallControl({ icon, label, active = false, danger = false, onClick }) {
  const IconComponent = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-12 shrink-0 items-center justify-center rounded-full border transition focus-visible:ring-offset-[#111b21] ${
        danger
          ? "border-[#ea5b61] bg-[#ea5b61] text-white hover:bg-[#d94d54]"
          : active
            ? "border-white bg-white text-[#111b21] hover:bg-[#e9edef]"
            : "border-white/15 bg-[#2a3942] text-white hover:bg-[#344651]"
      }`}
    >
      <IconComponent className="size-5" />
    </button>
  );
}

function ParticipantTile({ participant, stream, isSelf, speakerOn }) {
  const showVideo = Boolean(stream && participant?.cameraOn !== false);
  return (
    <div className="relative min-h-36 overflow-hidden rounded-control bg-[#202c33]">
      {showVideo ? (
        <StreamVideo
          stream={stream}
          muted={isSelf || !speakerOn}
          mirror={isSelf}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full min-h-36 items-center justify-center">
          <ParticipantAvatar participant={participant} sizeClass="size-24" />
        </div>
      )}
      <div className="absolute bottom-2 left-2 flex max-w-[calc(100%-16px)] items-center gap-2 rounded-control bg-black/55 px-2 py-1 text-xs text-white">
        <span className="truncate">{isSelf ? "You" : participant?.displayName}</span>
        {participant?.micOn === false && <MicOff className="size-3.5 shrink-0" />}
      </div>
    </div>
  );
}

function VideoCallModal({ call, authUser, socket, updateCall, onClose }) {
  const rootRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const makingOfferRef = useRef(new Map());
  const callIdRef = useRef(call.callId || "");
  const joinedRef = useRef(false);
  const closingRef = useRef(false);
  const noAnswerTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);

  const selfId = normalizeId(authUser?._id);
  const conversation = call.conversation;
  const conversationId = getConversationId(conversation);
  const isGroup = Boolean(conversation?.isgroup);
  const selfParticipant = useMemo(
    () => normalizeParticipant({
      _id: selfId,
      displayName: authUser?.fullname || "You",
      profilePic: authUser?.profilePic,
      micOn: true,
      cameraOn: true,
    }),
    [authUser?.fullname, authUser?.profilePic, selfId],
  );

  const [localStream, setLocalStream] = useState(null);
  const [participants, setParticipants] = useState(() => ({
    [selfId]: selfParticipant,
  }));
  const [remoteStreams, setRemoteStreams] = useState({});
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [phase, setPhase] = useState(call.phase || "preparing");
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  const setCallPhase = useCallback((nextPhase) => {
    setPhase(nextPhase);
    updateCall({ phase: nextPhase, callId: callIdRef.current });
  }, [updateCall]);

  const upsertParticipant = useCallback((participant) => {
    const normalized = normalizeParticipant(participant);
    if (!normalized.id) return;
    setParticipants((current) => ({
      ...current,
      [normalized.id]: {
        ...current[normalized.id],
        ...normalized,
      },
    }));
  }, []);

  const clearNoAnswerTimer = useCallback(() => {
    clearTimeout(noAnswerTimerRef.current);
    noAnswerTimerRef.current = null;
  }, []);

  const closePeerConnection = useCallback((participantId) => {
    const id = normalizeId(participantId);
    const peer = peersRef.current.get(id);
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
      peersRef.current.delete(id);
    }
    pendingCandidatesRef.current.delete(id);
    makingOfferRef.current.delete(id);
    setRemoteStreams((current) => {
      if (!current[id]) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const closeAllConnections = useCallback(() => {
    [...peersRef.current.keys()].forEach(closePeerConnection);
  }, [closePeerConnection]);

  const stopLocalStream = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
  }, []);

  const finishCall = useCallback((notifyServer = true, reason = "left") => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearNoAnswerTimer();
    clearTimeout(reconnectTimerRef.current);

    if (notifyServer && callIdRef.current && socket?.connected) {
      socket.emit("call:leave", { callId: callIdRef.current, reason });
    }
    joinedRef.current = false;
    closeAllConnections();
    stopLocalStream();
    onClose();
  }, [clearNoAnswerTimer, closeAllConnections, onClose, socket, stopLocalStream]);

  const flushPendingCandidates = useCallback(async (participantId, peer) => {
    const id = normalizeId(participantId);
    const candidates = pendingCandidatesRef.current.get(id) || [];
    for (const candidate of candidates) {
      try {
        await peer.addIceCandidate(candidate);
      } catch {
        // A stale candidate can arrive after a peer reconnects.
      }
    }
    pendingCandidatesRef.current.delete(id);
  }, []);

  const createPeerConnection = useCallback((participantId) => {
    const id = normalizeId(participantId);
    if (!id || id === selfId) return null;
    if (peersRef.current.has(id)) return peersRef.current.get(id);

    const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    localStreamRef.current?.getTracks().forEach((track) => {
      peer.addTrack(track, localStreamRef.current);
    });

    peer.onicecandidate = ({ candidate }) => {
      if (!candidate || !socket?.connected || !callIdRef.current) return;
      socket.emit("call:ice-candidate", {
        callId: callIdRef.current,
        toUserId: id,
        candidate: candidate.toJSON?.() || candidate,
      });
    };

    peer.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      setRemoteStreams((current) => ({ ...current, [id]: stream }));
      clearNoAnswerTimer();
      setCallPhase("active");
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        clearNoAnswerTimer();
        setCallPhase("active");
      }
      if (["failed", "closed"].includes(peer.connectionState)) {
        closePeerConnection(id);
      }
    };

    peersRef.current.set(id, peer);
    return peer;
  }, [clearNoAnswerTimer, closePeerConnection, selfId, setCallPhase, socket]);

  const sendOffer = useCallback(async (participantId) => {
    const id = normalizeId(participantId);
    const peer = createPeerConnection(id);
    if (!peer || !socket?.connected || peer.signalingState !== "stable") return;

    try {
      makingOfferRef.current.set(id, true);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await emitWithAck(socket, "call:offer", {
        callId: callIdRef.current,
        toUserId: id,
        description: serializeDescription(peer.localDescription),
      });
    } catch (error) {
      if (!closingRef.current && error.message !== "Invalid call offer") {
        console.error("Unable to create call offer", error);
      }
    } finally {
      makingOfferRef.current.set(id, false);
    }
  }, [createPeerConnection, socket]);

  const handleOffer = useCallback(async ({ fromUserId, from, description }) => {
    const id = normalizeId(fromUserId);
    if (!id || !description) return;
    upsertParticipant(from || { _id: id });
    const peer = createPeerConnection(id);
    if (!peer) return;

    const offerCollision = makingOfferRef.current.get(id) || peer.signalingState !== "stable";
    const polite = selfId.localeCompare(id) > 0;
    if (offerCollision && !polite) return;

    try {
      if (offerCollision && peer.signalingState !== "stable") {
        await peer.setLocalDescription({ type: "rollback" });
      }
      await peer.setRemoteDescription(description);
      await flushPendingCandidates(id, peer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      await emitWithAck(socket, "call:answer", {
        callId: callIdRef.current,
        toUserId: id,
        description: serializeDescription(peer.localDescription),
      });
      clearNoAnswerTimer();
      setCallPhase("connecting");
    } catch (error) {
      if (!closingRef.current) console.error("Unable to answer call offer", error);
    }
  }, [clearNoAnswerTimer, createPeerConnection, flushPendingCandidates, selfId, setCallPhase, socket, upsertParticipant]);

  const handleAnswer = useCallback(async ({ fromUserId, from, description }) => {
    const id = normalizeId(fromUserId);
    const peer = peersRef.current.get(id);
    if (!peer || !description) return;
    upsertParticipant(from || { _id: id });
    try {
      await peer.setRemoteDescription(description);
      await flushPendingCandidates(id, peer);
      clearNoAnswerTimer();
      setCallPhase("connecting");
    } catch (error) {
      if (!closingRef.current) console.error("Unable to apply call answer", error);
    }
  }, [clearNoAnswerTimer, flushPendingCandidates, setCallPhase, upsertParticipant]);

  const handleCandidate = useCallback(async ({ fromUserId, candidate }) => {
    const id = normalizeId(fromUserId);
    if (!id || !candidate) return;
    const peer = peersRef.current.get(id);
    if (!peer?.remoteDescription) {
      const queued = pendingCandidatesRef.current.get(id) || [];
      queued.push(candidate);
      pendingCandidatesRef.current.set(id, queued);
      return;
    }
    try {
      await peer.addIceCandidate(candidate);
    } catch {
      // Ignore candidates from a peer generation that has already closed.
    }
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    const isCurrentCall = (payload) => payload?.callId === callIdRef.current;

    const onParticipantJoined = (payload) => {
      if (!isCurrentCall(payload)) return;
      upsertParticipant(payload.participant);
      clearNoAnswerTimer();
      setCallPhase("connecting");
    };
    const onParticipantLeft = (payload) => {
      if (!isCurrentCall(payload)) return;
      const id = normalizeId(payload.participantId);
      closePeerConnection(id);
      setParticipants((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    };
    const onOffer = (payload) => {
      if (isCurrentCall(payload)) handleOffer(payload);
    };
    const onAnswer = (payload) => {
      if (isCurrentCall(payload)) handleAnswer(payload);
    };
    const onCandidate = (payload) => {
      if (isCurrentCall(payload)) handleCandidate(payload);
    };
    const onMediaState = (payload) => {
      if (!isCurrentCall(payload)) return;
      const id = normalizeId(payload.participantId);
      setParticipants((current) => ({
        ...current,
        [id]: {
          ...current[id],
          id,
          micOn: payload.micOn,
          cameraOn: payload.cameraOn,
        },
      }));
    };
    const onDeclined = (payload) => {
      if (!isCurrentCall(payload)) return;
      const name = payload.participant?.name || "Participant";
      if (isGroup) {
        toast(`${name} declined the call`);
      } else {
        toast(payload.reason === "busy" ? `${name} is busy` : "Call declined");
        finishCall(false, payload.reason);
      }
    };
    const onEnded = (payload) => {
      if (!isCurrentCall(payload)) return;
      if (payload.reason === "expired") toast("Call expired");
      finishCall(false, payload.reason);
    };
    const onDisconnect = () => {
      if (closingRef.current) return;
      setCallPhase("reconnecting");
      reconnectTimerRef.current = setTimeout(() => {
        toast.error("Call ended because the connection was lost");
        finishCall(false, "disconnected");
      }, 10_000);
    };
    const onConnect = () => {
      clearTimeout(reconnectTimerRef.current);
      if (joinedRef.current) setCallPhase("connecting");
    };

    socket.on("call:participant-joined", onParticipantJoined);
    socket.on("call:participant-left", onParticipantLeft);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:ice-candidate", onCandidate);
    socket.on("call:media-state", onMediaState);
    socket.on("call:declined", onDeclined);
    socket.on("call:ended", onEnded);
    socket.on("disconnect", onDisconnect);
    socket.on("connect", onConnect);

    return () => {
      socket.off("call:participant-joined", onParticipantJoined);
      socket.off("call:participant-left", onParticipantLeft);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:ice-candidate", onCandidate);
      socket.off("call:media-state", onMediaState);
      socket.off("call:declined", onDeclined);
      socket.off("call:ended", onEnded);
      socket.off("disconnect", onDisconnect);
      socket.off("connect", onConnect);
    };
  }, [clearNoAnswerTimer, closePeerConnection, finishCall, handleAnswer, handleCandidate, handleOffer, isGroup, setCallPhase, socket, upsertParticipant]);

  useEffect(() => {
    let disposed = false;

    const startCall = async () => {
      if (!socket?.connected) {
        toast.error("Connect to Kapota before starting a call");
        finishCall(false, "offline");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
        toast.error("Video calls are not supported in this browser");
        finishCall(false, "unsupported");
        return;
      }

      try {
        setCallPhase("preparing");
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30, max: 30 },
          },
        });
        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        let callId = callIdRef.current;
        let isExistingCall = false;
        if (call.mode === "outgoing") {
          const started = await emitWithAck(socket, "call:start", {
            conversationId,
            callType: "video",
          });
          callId = started.callId;
          isExistingCall = Boolean(started.existing);
          callIdRef.current = callId;
          updateCall({ callId, phase: "connecting" });
        }
        if (!callId) throw new Error("This call is no longer available");

        const joined = await emitWithAck(socket, "call:join", { callId });
        if (disposed) return;
        joinedRef.current = true;
        const existingParticipants = joined.participants || [];
        existingParticipants.forEach(upsertParticipant);

        socket.emit("call:media-state", {
          callId,
          micOn: true,
          cameraOn: true,
        });

        setCallPhase(existingParticipants.length ? "connecting" : "ringing");
        await Promise.all(existingParticipants.map((participant) => sendOffer(participant.id)));

        if (call.mode === "outgoing" && !isExistingCall && !existingParticipants.length) {
          noAnswerTimerRef.current = setTimeout(() => {
            toast("No answer");
            finishCall(true, "no-answer");
          }, NO_ANSWER_TIMEOUT_MS);
        }
      } catch (error) {
        if (disposed || closingRef.current) return;
        if (call.mode === "incoming" && callIdRef.current) {
          socket.emit("call:decline", {
            callId: callIdRef.current,
            reason: error.code === "ALREADY_JOINED" ? "answered-elsewhere" : "media-unavailable",
          });
        }
        const permissionDenied = ["NotAllowedError", "PermissionDeniedError"].includes(error.name);
        toast.error(
          permissionDenied
            ? "Allow camera and microphone access to join the call"
            : error.message || "Unable to start the video call",
        );
        finishCall(true, "failed");
      }
    };

    startCall();
    return () => {
      disposed = true;
    };
    // This session is intentionally initialized once for this mounted call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "active") return undefined;
    const timer = setInterval(() => setDuration((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => () => {
    clearNoAnswerTimer();
    clearTimeout(reconnectTimerRef.current);
    if (!closingRef.current && callIdRef.current && socket?.connected) {
      socket.emit("call:leave", { callId: callIdRef.current, reason: "closed" });
    }
    closeAllConnections();
    stopLocalStream();
  }, [clearNoAnswerTimer, closeAllConnections, socket, stopLocalStream]);

  const updateLocalMediaState = (nextMicOn, nextCameraOn) => {
    upsertParticipant({
      ...selfParticipant,
      micOn: nextMicOn,
      cameraOn: nextCameraOn,
    });
    if (joinedRef.current) {
      socket.emit("call:media-state", {
        callId: callIdRef.current,
        micOn: nextMicOn,
        cameraOn: nextCameraOn,
      });
    }
  };

  const toggleMic = () => {
    const next = !micOn;
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = next;
    });
    setMicOn(next);
    updateLocalMediaState(next, cameraOn);
  };

  const toggleCamera = () => {
    const next = !cameraOn;
    localStreamRef.current?.getVideoTracks().forEach((track) => {
      track.enabled = next;
    });
    setCameraOn(next);
    updateLocalMediaState(micOn, next);
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await rootRef.current?.requestFullscreen();
      }
    } catch {
      toast.error("Fullscreen is not available");
    }
  };

  const participantList = Object.values(participants).filter((participant) => participant?.id);
  const remoteParticipants = participantList.filter((participant) => participant.id !== selfId);
  const directFallback = normalizeParticipant({
    _id: conversation?.oruserId,
    displayName: conversation?.name || "Contact",
    profilePic: conversation?.profilePic,
  });
  const directParticipant = remoteParticipants[0] || directFallback;
  const directStream = remoteStreams[directParticipant.id] || null;
  const title = isGroup
    ? conversation?.groupdetail?.groupname || "Group video call"
    : directParticipant.displayName;
  const statusText = {
    preparing: "Preparing camera",
    ringing: call.mode === "outgoing" ? "Calling" : "Joining call",
    connecting: "Connecting",
    active: "Connected",
    reconnecting: "Reconnecting",
  }[phase] || "Connecting";
  const groupColumns = participantList.length <= 1
    ? "grid-cols-1"
    : participantList.length <= 4
      ? "grid-cols-2"
      : participantList.length <= 9
        ? "grid-cols-3"
        : "grid-cols-4";

  return (
    <div ref={rootRef} className="fixed inset-0 z-[100] flex min-h-[560px] flex-col overflow-hidden bg-[#111b21] text-white">
      <header className="z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#202c33] px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-[#071b16]">
            <Video className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
              <LockKeyhole className="size-3" />
              {statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-white/70">
          {isGroup && (
            <span className="flex h-8 items-center gap-1.5 px-2">
              <Users className="size-4" />
              {participantList.length}
            </span>
          )}
          <span className="flex h-8 items-center gap-1.5 px-2 font-medium tabular-nums">
            <Clock3 className="size-4" />
            {formatDuration(duration)}
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex size-9 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="size-4.5" /> : <Maximize2 className="size-4.5" />}
          </button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        {!isGroup ? (
          <>
            {directStream && directParticipant.cameraOn !== false ? (
              <StreamVideo
                stream={directStream}
                muted={!speakerOn}
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#182229]">
                <ParticipantAvatar participant={directParticipant} sizeClass="size-40" />
                <div className="text-center">
                  <p className="text-xl font-medium">{directParticipant.displayName}</p>
                  <p className="mt-2 text-sm text-white/55">{statusText}</p>
                </div>
              </div>
            )}

            <div className="absolute right-5 top-5 aspect-video w-64 overflow-hidden rounded-control border border-white/15 bg-[#202c33] shadow-2xl">
              {localStream && cameraOn ? (
                <StreamVideo
                  stream={localStream}
                  muted
                  mirror
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <ParticipantAvatar participant={selfParticipant} sizeClass="size-20" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded-control bg-black/55 px-2 py-1 text-xs">You</span>
            </div>
          </>
        ) : (
          <div className={`ui-scrollbar grid h-full auto-rows-[minmax(180px,1fr)] gap-1.5 overflow-y-auto p-1.5 ${groupColumns}`}>
            {participantList.map((participant) => {
              const isSelf = participant.id === selfId;
              return (
                <ParticipantTile
                  key={participant.id}
                  participant={participant}
                  stream={isSelf ? localStream : remoteStreams[participant.id]}
                  isSelf={isSelf}
                  speakerOn={speakerOn}
                />
              );
            })}
          </div>
        )}
      </main>

      <footer className="z-10 flex h-20 shrink-0 items-center justify-center gap-3 border-t border-white/10 bg-[#202c33] px-5">
        <CallControl
          icon={micOn ? Mic : MicOff}
          label={micOn ? "Mute microphone" : "Turn on microphone"}
          active={micOn}
          onClick={toggleMic}
        />
        <CallControl
          icon={cameraOn ? Video : VideoOff}
          label={cameraOn ? "Turn off camera" : "Turn on camera"}
          active={cameraOn}
          onClick={toggleCamera}
        />
        <CallControl
          icon={speakerOn ? Volume2 : VolumeX}
          label={speakerOn ? "Mute call audio" : "Unmute call audio"}
          active={speakerOn}
          onClick={() => setSpeakerOn((current) => !current)}
        />
        <span className="mx-1 h-8 w-px bg-white/15" />
        <CallControl
          icon={PhoneOff}
          label="End call"
          danger
          onClick={() => finishCall(true, "ended")}
        />
      </footer>
    </div>
  );
}

export default VideoCallModal;
