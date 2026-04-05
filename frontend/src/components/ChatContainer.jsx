import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import MessageItem from "./MessageItem";
import { Virtuoso } from "react-virtuoso";
import { Search, X } from "lucide-react";
import { searchMessages } from "../lib/axios";
import { formatMessageTime } from "../lib/utils";
import toast from "react-hot-toast";
import { useCallStore } from "../store/useCallStore";
import SectionLoader from "./common/SectionLoader";

function ChatContainer() {
  const {
    message,
    getMessage,
    isMessageLoading,
    selectedConversation,
    onlineToMessage,
    offlineToMessage,
    setMsgSeen,
    conBgimage,
    setDeletedMessage,
    setClearChat,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const virtuosoRef = useRef(null);
  const searchInputRef = useRef(null);
  const [Typing, setTyping] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const { startOutgoingCall } = useCallStore();

  useEffect(() => {
    getMessage();
  }, [selectedConversation, getMessage]);

  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedId(null);
  }, [selectedConversation]);

  useEffect(() => {
    if (!showSearch) return;
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resdata = await searchMessages(
          selectedConversation.conversationId,
          { q: query, limit: 25 },
        );
        if (active) {
          setSearchResults(resdata.messages || []);
        }
      } catch (error) {
        if (active) {
          setSearchResults([]);
          toast.error(error?.response?.data?.message || "Search failed");
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, showSearch, selectedConversation?.conversationId]);

  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  // useEffect(() => {
  //   const handleIncomingCallPreview = (event) => {
  //     const previewConversation = event.detail?.conversation || selectedConversation;

  //     if (!previewConversation || previewConversation.isgroup) return;

  //     setIncomingCall({
  //       conversation: previewConversation,
  //       callerName: event.detail?.callerName || previewConversation.name,
  //       callerProfilePic:
  //         event.detail?.callerProfilePic || previewConversation.profilePic,
  //       isOnline:
  //         typeof event.detail?.isOnline === "boolean"
  //           ? event.detail.isOnline
  //           : onlineUsers.includes(previewConversation.oruserId),
  //     });
  //   };

  //   // This gives us a frontend-only hook now, and later the socket event can reuse the same state update.
  //   window.addEventListener("kapota:incoming-video-call-preview", handleIncomingCallPreview);

  //   return () => {
  //     window.removeEventListener("kapota:incoming-video-call-preview", handleIncomingCallPreview);
  //   };
  // }, [onlineUsers, selectedConversation]);

  const lastmsg = message[message.length - 1];
  useEffect(() => {
    if (!lastmsg || !socket) return;
    if (lastmsg.system) return;
    const hasSeen =
      Array.isArray(lastmsg?.seenBy) && lastmsg.seenBy.includes(authUser?._id);
    if (lastmsg?.sender !== authUser?._id && !hasSeen) {
      socket.emit("msgseen", {
        msgId: lastmsg._id,
        senderId: lastmsg.sender,
      });
    }
  }, [lastmsg?._id, lastmsg?.sender, authUser?._id, socket, lastmsg?.seenBy]);

  useEffect(() => {
    if (!virtuosoRef.current || !isAtBottom || message.length === 0) return;
    virtuosoRef.current.scrollToIndex({
      index: message.length - 1,
      align: "end",
      behavior: "smooth",
    });
  }, [message.length, isAtBottom]);

  useEffect(() => {
    socket.on("msgseen", (payload) => {
      setMsgSeen(payload);
    });
    socket.on("changeBgimage", ({ conversationId, bgImage }) => {
      conBgimage(conversationId, bgImage);
    });
    socket.on("istyping", (userId) => setTyping(userId));
    socket.on("StopTyping", (userId) =>
      setTyping(userId.userId == Typing.userId ? "" : Typing),
    );
    socket.on("delete", (msg) => setDeletedMessage(msg));
    socket.on("clearchat", (conversation) => setClearChat(conversation));
    socket.on("newmessage", (newMessage) => onlineToMessage(newMessage));
    return () => {
      offlineToMessage();
      socket.off("msgseen");
      socket.off("istyping");
      socket.off("StopTyping");
      socket.off("changeBgimage");
      socket.off("delete");
      socket.off("clearchat");
      socket.off("newmessage");
    };
  }, [socket]);

  const handleToggleSearch = () => {
    setShowSearch((prev) => !prev);
  };

  const resolveSenderName = (senderId) => {
    if (senderId === authUser._id) return "You";
    if (!selectedConversation.isgroup) return selectedConversation.name;
    return (
      selectedConversation.groupdetail?.membersDetail?.[senderId]?.fullname ||
      "Unknown"
    );
  };

  const handleStartCall = () => {
    if (!selectedConversation) return;
    startOutgoingCall(selectedConversation);
  };

  const handleResultClick = (msg) => {
    const index = message.findIndex((m) => m._id === msg._id);
    if (index === -1) return;
    virtuosoRef.current?.scrollToIndex({
      index,
      align: "center",
      behavior: "smooth",
    });
    setHighlightedId(msg._id);
    setTimeout(() => {
      setHighlightedId((prev) => (prev === msg._id ? null : prev));
    }, 1500);
  };

  const typingActive =
    Typing?.receiverId == selectedConversation?.conversationId &&
    Typing?.userId !== authUser?._id;

  const virtuosoData = useMemo(
    () => (typingActive ? [...message, { _id: "typing" }] : message),
    [message, typingActive],
  );

  if (isMessageLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader
          onStartCall={handleStartCall}
          onToggleSearch={handleToggleSearch}
          showSearch={showSearch}
        />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  return (
    <div className="flex-1 bg-base-100 flex flex-col overflow-hidden">
      <ChatHeader
        onStartCall={handleStartCall}
        onToggleSearch={handleToggleSearch}
        showSearch={showSearch}
      />
      {showSearch && (
        <div className="border-b border-base-300 bg-base-100 p-3">
          <div className="flex items-center gap-2">
            <label className="input input-bordered flex items-center gap-2 w-full">
              <Search className="size-4" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
                className="w-full bg-transparent outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="btn btn-ghost btn-xs"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
            <button
              type="button"
              onClick={() => setShowSearch(false)}
              className="btn btn-ghost btn-sm"
            >
              Close
            </button>
          </div>
          <div className="mt-2 max-h-52 overflow-y-auto">
            <SectionLoader
              loading={isSearching}
              label="Searching messages..."
              minHeight={84}
              className="border-none bg-transparent"
            >
              <>
                {!isSearching &&
                  searchQuery.trim().length > 0 &&
                  searchResults.length === 0 && (
                    <div className="px-1 py-2 text-xs text-base-content/60">
                      No results found
                    </div>
                  )}
                {searchResults.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => handleResultClick(msg)}
                    className="w-full rounded-lg p-2 text-left transition-colors hover:bg-base-200"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">
                        {resolveSenderName(msg.sender)}
                      </div>
                      <div className="text-xs text-base-content/60">
                        {formatMessageTime(msg.createdAt)}
                      </div>
                    </div>
                    <div className="truncate text-xs text-base-content/70">
                      {msg.text || "Image"}
                    </div>
                  </button>
                ))}
              </>
            </SectionLoader>
          </div>
        </div>
      )}
      <div
        style={{
          backgroundImage: `url('${selectedConversation.bgImage?.url}')`,
        }}
        className={`flex-1 min-h-0 ${selectedConversation.bgImage ? `bg-cover bg-center bg-no-repeat` : ""}`}
      >
        <Virtuoso
          ref={virtuosoRef}
          style={{ height: "100%" }}
          data={virtuosoData}
          initialTopMostItemIndex={Math.max(message.length - 1, 0)}
          alignToBottom
          atBottomThreshold={120}
          atBottomStateChange={setIsAtBottom}
          followOutput={isAtBottom ? "smooth" : false}
          itemContent={(index, m) => (
            <MessageItem
              key={m?._id}
              m={m}
              authUser={authUser}
              selectedConversation={selectedConversation}
              highlightId={highlightedId}
            />
          )}
        />
      </div>
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
