import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { useChatStore } from "../store/useChatStore";
import IncomingCallModal from "./IncomingCallModal";
import VideoCallModal from "./VideoCallModal";

const getConversationId = (conversation) =>
  conversation?.conversationId?.toString?.() ||
  conversation?._id?.toString?.() ||
  "";

const normalizeProfilePic = (profilePic) => {
  if (!profilePic) return null;
  return typeof profilePic === "string" ? { url: profilePic } : profilePic;
};

const normalizeCaller = (caller) => ({
  ...caller,
  _id: caller?._id?.toString?.() || caller?.id?.toString?.() || "",
  profilePic: normalizeProfilePic(caller?.profilePic),
});

const findConversationById = (conversationId, selectedConversation, conversations) => {
  if (!conversationId) return null;
  if (getConversationId(selectedConversation) === conversationId) {
    return selectedConversation;
  }
  return conversations.find(
    (conversation) => getConversationId(conversation) === conversationId,
  ) || null;
};

function CallManager() {
  const { socket, authUser } = useAuthStore();
  const { selectedConversation, conversations } = useChatStore();
  const {
    incomingCall,
    activeCall,
    setIncomingCall,
    clearIncomingCall,
    acceptIncomingCall,
    updateActiveCall,
    endCall,
  } = useCallStore();

  useEffect(() => {
    if (!socket || !authUser?._id) return undefined;

    const handleIncomingCall = (payload) => {
      const caller = normalizeCaller(payload?.from);
      if (!payload?.callId || !caller._id || caller._id === authUser._id) return;

      if (activeCall || (incomingCall && incomingCall.callId !== payload.callId)) {
        socket.emit("call:decline", {
          callId: payload.callId,
          reason: "busy",
        });
        return;
      }

      const conversationId = payload.conversationId?.toString?.() || "";
      const matchedConversation = findConversationById(
        conversationId,
        selectedConversation,
        conversations,
      );
      const conversation = matchedConversation || payload.conversation;
      if (!conversation) return;

      setIncomingCall({
        callId: payload.callId,
        callType: payload.callType || "video",
        conversationId,
        conversation,
        from: caller,
        isGroup: Boolean(payload.isGroup || conversation.isgroup),
        startedAt: payload.startedAt || Date.now(),
      });
    };

    const handleCallEnded = ({ callId }) => {
      if (incomingCall?.callId === callId) clearIncomingCall();
    };

    const handleAnsweredElsewhere = ({ callId }) => {
      if (incomingCall?.callId === callId) clearIncomingCall();
    };

    socket.on("call:incoming", handleIncomingCall);
    socket.on("call:ended", handleCallEnded);
    socket.on("call:answered-elsewhere", handleAnsweredElsewhere);

    return () => {
      socket.off("call:incoming", handleIncomingCall);
      socket.off("call:ended", handleCallEnded);
      socket.off("call:answered-elsewhere", handleAnsweredElsewhere);
    };
  }, [
    socket,
    authUser?._id,
    activeCall,
    incomingCall,
    selectedConversation,
    conversations,
    setIncomingCall,
    clearIncomingCall,
  ]);

  const handleDeclineIncomingCall = () => {
    if (socket && incomingCall?.callId) {
      socket.emit("call:decline", {
        callId: incomingCall.callId,
        reason: "declined",
      });
    }
    clearIncomingCall();
  };

  const incomingConversationName = incomingCall?.isGroup
    ? incomingCall?.conversation?.groupdetail?.groupname || "Group call"
    : incomingCall?.from?.name || incomingCall?.from?.fullname || "Unknown";

  return (
    <>
      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={incomingCall?.from?.name || incomingCall?.from?.fullname || "Unknown"}
          callerProfilePic={incomingCall?.from?.profilePic}
          conversationName={incomingConversationName}
          isGroup={incomingCall.isGroup}
          onAccept={acceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {activeCall?.conversation && (
        <VideoCallModal
          call={activeCall}
          authUser={authUser}
          socket={socket}
          updateCall={updateActiveCall}
          onClose={endCall}
        />
      )}
    </>
  );
}

export default CallManager;
