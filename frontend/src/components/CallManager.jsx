import { useEffect } from "react";
import toast from "react-hot-toast";
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
  if (typeof profilePic === "string") {
    return { url: profilePic };
  }
  return profilePic;
};

const normalizeCaller = (from) => ({
  ...from,
  profilePic: normalizeProfilePic(from?.profilePic),
});

const findConversationById = (conversationId, selectedConversation, conversations) => {
  if (!conversationId) return null;
  if (
    selectedConversation &&
    getConversationId(selectedConversation) === conversationId
  ) {
    return selectedConversation;
  }
  return (
    conversations.find(
      (conversation) => getConversationId(conversation) === conversationId,
    ) || null
  );
};

const buildFallbackConversation = (payload) => {
  if (payload?.isGroup) return null;
  const caller = normalizeCaller(payload?.from);
  if (!caller?._id) return null;
  return {
    conversationId: payload?.conversationId || "",
    oruserId: caller._id,
    name: caller?.name || caller?.fullname || "Unknown",
    profilePic: caller?.profilePic || null,
    isgroup: false,
    groupdetail: {},
    bgImage: {},
  };
};

function CallManager() {
  const { socket, authUser, onlineUsers } = useAuthStore();
  const { selectedConversation, conversations } = useChatStore();
  const {
    incomingCall,
    activeCall,
    setIncomingCall,
    clearIncomingCall,
    acceptIncomingCall,
    endCall,
  } = useCallStore();

  useEffect(() => {
    if (!socket || !authUser?._id) return undefined;

    const handleIncomingCall = (payload) => {
      const caller = normalizeCaller(payload?.from);
      if (!caller?._id || caller._id === authUser._id) return;

      const conversationId =
        payload?.conversationId ||
        getConversationId(payload?.conversation) ||
        "";
      if (activeCall?.conversation) {
        const activeConversationId = getConversationId(activeCall.conversation);
        if (conversationId && activeConversationId === conversationId) {
          return;
        }
        return;
      }
      const matchedConversation = findConversationById(
        conversationId,
        selectedConversation,
        conversations,
      );
      const conversation =
        matchedConversation ||
        (payload?.isGroup ? payload?.conversation : null) ||
        buildFallbackConversation({
          ...payload,
          conversationId,
          from: caller,
        });

      if (!conversation) return;

      setIncomingCall({
        from: caller,
        offer: payload?.offer || null,
        conversationId: conversationId || getConversationId(conversation),
        conversation,
        isGroup: Boolean(payload?.isGroup || conversation?.isgroup),
      });
    };

    const handleCallEnded = ({ conversationId, from }) => {
      if (!activeCall?.conversation) return;
      const activeConversationId = getConversationId(activeCall.conversation);
      if (!conversationId || activeConversationId !== conversationId) return;
      if (from && from === authUser._id) return;
      endCall();
      toast("Call ended");
    };

    const handleCallDeclined = ({ conversationId, from }) => {
      if (!activeCall?.conversation) return;
      const activeConversationId = getConversationId(activeCall.conversation);
      if (!conversationId || activeConversationId !== conversationId) return;
      if (from && from === authUser._id) return;
      endCall();
      toast("Call declined");
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-ended", handleCallEnded);
    socket.on("call-declined", handleCallDeclined);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-ended", handleCallEnded);
      socket.off("call-declined", handleCallDeclined);
    };
  }, [
    socket,
    authUser?._id,
    selectedConversation,
    conversations,
    setIncomingCall,
    activeCall?.conversation,
    endCall,
  ]);

  const handleDeclineIncomingCall = () => {
    if (socket && authUser?._id && incomingCall?.from?._id) {
      socket.emit("call-declined", {
        to: incomingCall.from._id,
        from: authUser._id,
        conversationId: incomingCall.conversationId,
      });
    }
    clearIncomingCall();
  };

  const handleAcceptIncomingCall = () => {
    const incomingConversation = incomingCall?.conversation;
    if (!incomingConversation) return;
    acceptIncomingCall(incomingConversation);
  };

  const handleCloseActiveCall = () => {
    const conversation = activeCall?.conversation;
    if (socket && authUser?._id && conversation) {
      const conversationId = getConversationId(conversation);
      const targets = conversation?.isgroup
        ? Object.keys(conversation?.groupdetail?.membersDetail || {}).filter(
            (id) => id !== authUser._id,
          )
        : [conversation?.oruserId].filter(Boolean);

      socket.emit("call-ended", {
        to: targets.length > 1 ? targets : targets[0],
        from: authUser._id,
        conversationId,
        isGroup: Boolean(conversation?.isgroup),
      });
    }
    endCall();
  };

  return (
    <>
      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={
            incomingCall?.from?.name || incomingCall?.from?.fullname || "Unknown"
          }
          callerProfilePic={incomingCall?.from?.profilePic}
          isOnline
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {activeCall?.conversation && (
        <VideoCallModal
          authUser={authUser}
          socket={socket}
          conversation={activeCall.conversation}
          onlineUsers={onlineUsers}
          mode={activeCall.mode}
          incomingSignal={activeCall.incomingSignal}
          onClose={handleCloseActiveCall}
        />
      )}
    </>
  );
}

export default CallManager;
