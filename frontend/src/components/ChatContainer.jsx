import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import MessageItem from "./MessageItem";
import { Virtuoso } from "react-virtuoso";

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
    setClearChat
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [Typing, setTyping] = useState(false);

  useEffect(() => {
    getMessage();
  }, [selectedConversation, getMessage]);

  const lastmsg = message[message.length - 1];
  useEffect(() => {
    if (messageEndRef.current && message) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      if (lastmsg?.sender !== authUser._id && lastmsg?.isSeen == false) {
        socket.emit("msgseen", {
          msgId: lastmsg._id,
          senderId: lastmsg.sender,
        });
      }
    }
  }, [message, Typing]);

  useEffect(() => {
    socket.on("msgseen", ({ msgId }) => {
      setMsgSeen(msgId);
    });
    socket.on("changeBgimage", ({ conversationId, bgImage }) => {
      conBgimage(conversationId, bgImage);
    });
    socket.on("istyping", (userId) => setTyping(userId));
    socket.on("StopTyping", (userId) => setTyping(userId.userId == Typing.userId ? '' : Typing));
    socket.on('delete',(msg)=>setDeletedMessage(msg))
    socket.on('clearchat',(conversation)=>setClearChat(conversation))
    onlineToMessage();
    return () => {
      offlineToMessage();
      socket.off("msgseen");
      socket.off("istyping");
      socket.off("StopTyping");
      socket.off("changeBgimage");
      socket.off('delete');
      socket.off('clearchat')
    };
  }, [socket]);

  if (isMessageLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  const handleImgview = (detail) => {
    setImageView(true);
    setImage(detail);
  };

  return (
    <div className="flex-1 bg-base-100 flex flex-col overflow-auto">
      <ChatHeader />
      <div
        style={{
          backgroundImage: `url('${selectedConversation.bgImage?.url}')`,
        }}
        className={`flex-1 ${selectedConversation.bgImage ? `bg-cover bg-center bg-no-repeat` : ""}`}
      >
        <Virtuoso
          style={{ height: "100%" }}
          data={[...message, ...(Typing.receiverId == selectedConversation.conversationId && Typing.userId !== authUser._id ? [{ _id: 'typing'}] : [])]}
          initialTopMostItemIndex={message?.length - 1}
          followOutput="auto"
          itemContent={(index, m) => (
            <MessageItem
              key={m?._id}
              m={m}
              authUser={authUser}
              selectedConversation={selectedConversation}
              onImageClick={handleImgview}
            />
          )}
        />
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
}

export default ChatContainer;
