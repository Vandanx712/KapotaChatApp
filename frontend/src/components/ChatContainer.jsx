import { useEffect, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import MessageItem from "./MessageItem";
import { Virtuoso } from "react-virtuoso";
import { ArrowDown, Search, X } from "lucide-react";
import { searchMessages } from "../lib/axios";
import {
  formatMessageDate,
  formatMessageTime,
  isSameMessageDay,
} from "../lib/utils";
import toast from "react-hot-toast";
import { useCallStore } from "../store/useCallStore";
import SectionLoader from "./common/SectionLoader";
import { Button, Input } from "./ui";

const MESSAGE_GROUP_WINDOW = 5 * 60 * 1000;

const canGroupMessages = (first, second) => {
  if (!first || !second || first.system || second.system) return false;
  if (first.sender?.toString?.() !== second.sender?.toString?.()) return false;
  if (!isSameMessageDay(first.createdAt, second.createdAt)) return false;

  const firstTime = new Date(first.createdAt).getTime();
  const secondTime = new Date(second.createdAt).getTime();
  const timeGap = secondTime - firstTime;
  return (
    Number.isFinite(firstTime) &&
    Number.isFinite(secondTime) &&
    timeGap >= 0 &&
    timeGap <= MESSAGE_GROUP_WINDOW
  );
};

function ChatContainer() {
  const {
    message,
    getMessage,
    loadOlderMessages,
    hasMoreMessages,
    isMessageLoading,
    isMoreMessagesLoading,
    selectedConversation,
    onlineToMessage,
    setMsgSeen,
    conBgimage,
    setDeletedMessage,
    setClearChat,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const virtuosoRef = useRef(null);
  const didInitialScrollRef = useRef(false);
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
  }, [selectedConversation?.conversationId, getMessage]);

  useEffect(() => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    setHighlightedId(null);
  }, [selectedConversation?.conversationId]);

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
  }, [lastmsg, authUser?._id, socket]);

  useEffect(() => {
    if (!message.length || didInitialScrollRef.current) return;

    didInitialScrollRef.current = true;

    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: message.length - 1,
        align: "end",
        behavior: "auto",
      });
    });
  }, [message.length]);

  useEffect(() => {
    didInitialScrollRef.current = false;
  }, [selectedConversation?.conversationId]);

  useEffect(() => {
    if (!socket) return

    const handleMsgSeen = (payload) => setMsgSeen(payload)
    const handleBgImage = ({ conversationId, bgImage }) => {
      conBgimage(conversationId, bgImage);
    };
    const handleTyping = (payload) => setTyping(payload);
    const handleStopTyping = (payload) => {
      setTyping((prev) =>
        payload?.userId === prev?.userId &&
        payload?.receiverId === prev?.receiverId
          ? ""
          : prev,
      );
    };
    const handleDelete = (msg) => setDeletedMessage(msg);
    const handleClearChat = (conversation) => setClearChat(conversation);
    const handleNewMessage = (newMessage) => onlineToMessage(newMessage);

    socket.on("msgseen", handleMsgSeen);
    socket.on("changeBgimage", handleBgImage);
    socket.on("istyping", handleTyping);
    socket.on("StopTyping", handleStopTyping);
    socket.on("delete", handleDelete);
    socket.on("clearchat", handleClearChat);
    socket.on("newmessage", handleNewMessage);

    return () => {
      socket.off("msgseen", handleMsgSeen);
      socket.off("changeBgimage", handleBgImage);
      socket.off("istyping", handleTyping);
      socket.off("StopTyping", handleStopTyping);
      socket.off("delete", handleDelete);
      socket.off("clearchat", handleClearChat);
      socket.off("newmessage", handleNewMessage);
    };
  }, [socket, onlineToMessage, setClearChat, setMsgSeen, conBgimage, setDeletedMessage]);

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

  const handleResultClick = async (msg) => {
    const conversationId = selectedConversation.conversationId;
    let state = useChatStore.getState();
    let index = state.message.findIndex((item) => item._id === msg._id);
    let pagesLoaded = 0;

    setIsSearching(true);
    while (
      index === -1 &&
      state.hasMoreMessages &&
      state.selectedConversation?.conversationId === conversationId &&
      pagesLoaded < 50
    ) {
      const previousCursor = state.messageCursor;
      const loaded = await loadOlderMessages();
      state = useChatStore.getState();
      index = state.message.findIndex((item) => item._id === msg._id);
      pagesLoaded += 1;

      if (!loaded || state.messageCursor === previousCursor) break;
    }
    setIsSearching(false);

    if (
      state.selectedConversation?.conversationId !== conversationId ||
      index === -1
    ) {
      if (state.selectedConversation?.conversationId === conversationId) {
        toast.error("Unable to load this message");
      }
      return;
    }

    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index,
        align: "center",
        behavior: "smooth",
      });
    });
    setHighlightedId(msg._id);
    setTimeout(() => {
      setHighlightedId((prev) => (prev === msg._id ? null : prev));
    }, 1500);
  };

  const typingActive =
    Typing?.receiverId == selectedConversation?.conversationId &&
    Typing?.userId !== authUser?._id;

  const virtuosoData = useMemo(() => {
    const datedMessages = message.map((item, index) => {
      const previousMessage = message[index - 1];
      const nextMessage = message[index + 1];

      return {
        message: item,
        dateLabel:
          index === 0 ||
          !isSameMessageDay(item.createdAt, previousMessage?.createdAt)
            ? formatMessageDate(item.createdAt)
            : null,
        isSequenceStart: !canGroupMessages(previousMessage, item),
        isSequenceEnd: !canGroupMessages(item, nextMessage),
      };
    });

    return typingActive
      ? [
        ...datedMessages,
        {
          message: { _id: "typing" },
          dateLabel: null,
          isSequenceStart: true,
          isSequenceEnd: true,
        },
      ]
      : datedMessages;
  }, [message, typingActive]);

  const scrollToLatest = () => {
    if (!message.length) return;
    virtuosoRef.current?.scrollToIndex({
      index: message.length - 1,
      align: "end",
      behavior: "smooth",
    });
  };

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
    <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
      <ChatHeader
        onStartCall={handleStartCall}
        onToggleSearch={handleToggleSearch}
        showSearch={showSearch}
      />
      {showSearch && (
        <div className="shrink-0 border-b border-line bg-surface px-4 py-3 animate-ui-in">
          <div className="flex items-center gap-2">
            <Input
              icon={Search}
              trailing={searchQuery ? (
                <Button iconOnly size="xs" variant="ghost" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  <X className="size-3.5" />
                </Button>
              ) : null}
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowSearch(false)}
            >
              Close
            </Button>
          </div>
          <div className="ui-scrollbar mt-2 max-h-52 overflow-y-auto">
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
                    <div className="px-1 py-2 text-xs text-muted">
                      No results found
                    </div>
                  )}
                {searchResults.map((msg) => (
                  <button
                    key={msg._id}
                    onClick={() => handleResultClick(msg)}
                    className="w-full rounded-control p-2 text-left transition-colors hover:bg-surface-hover"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-medium">
                        {resolveSenderName(msg.sender)}
                      </div>
                      <div className="text-xs text-muted">
                        {formatMessageTime(msg.createdAt)}
                      </div>
                    </div>
                    <div className="truncate text-xs text-muted">
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
        className={`relative min-h-0 flex-1 ${selectedConversation.bgImage ? "bg-cover bg-center bg-no-repeat" : "chat-canvas"}`}
      >
        <Virtuoso
          key={selectedConversation.conversationId}
          ref={virtuosoRef}
          style={{ height: "100%" }}
          data={virtuosoData}
          computeItemKey={(index, item) => item.message._id}
          atBottomThreshold={120}
          atBottomStateChange={setIsAtBottom}
          followOutput="smooth"
          firstItemIndex={100000 - message.length}
          initialTopMostItemIndex={message.length > 0 ? message.length - 1 : 0}
          components={{
            Header: () =>
              hasMoreMessages || isMoreMessagesLoading ? (
                <div className="flex justify-center px-4 py-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={loadOlderMessages}
                    loading={isMoreMessagesLoading}
                  >
                    {isMoreMessagesLoading ? "Loading older messages" : "Load older messages"}
                  </Button>
                </div>
              ) : null,
          }}
          itemContent={(index, item) => (
            <>
              {item.dateLabel && (
                <div className="flex justify-center px-6 py-2.5">
                  <span className="rounded-control border border-line bg-surface-raised/90 px-2.5 py-1 text-[11px] font-medium text-muted shadow-control backdrop-blur-sm">
                    {item.dateLabel}
                  </span>
                </div>
              )}
              <MessageItem
                m={item.message}
                authUser={authUser}
                selectedConversation={selectedConversation}
                highlightId={highlightedId}
                isSequenceStart={item.isSequenceStart}
                isSequenceEnd={item.isSequenceEnd}
              />
            </>
          )}
        />
        {!isAtBottom && message.length > 0 && (
          <Button
            iconOnly
            size="sm"
            variant="secondary"
            onClick={scrollToLatest}
            aria-label="Jump to latest message"
            className="absolute bottom-4 right-4 z-20 shadow-panel"
          >
            <ArrowDown className="size-4" />
          </Button>
        )}
      </div>
      <MessageInput />
    </section>
  );
}

export default ChatContainer;
