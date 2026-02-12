import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "../components/skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";
import PreviewImg from "./PreviewImg";

function ChatContainer() {
  const {
    message,
    getMessage,
    isMessageLoading,
    selectedConversation,
    onlineToMessage,
    offlineToMessage,
    setMsgSeen,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [Typing, setTyping] = useState(false);
  const [imageView,setImageView] = useState(false)
  const [image,setImage] = useState('')

  useEffect(() => {
    getMessage();
  }, [selectedConversation, getMessage]);

  const lastmsg = message[message.length - 1];
  useEffect(() => {
    if (messageEndRef.current && message) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
      if (lastmsg.sender !== authUser._id && lastmsg.isSeen == false) {
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
    socket.on("istyping", () => setTyping(true));
    socket.on("StopTyping", () => setTyping(false));
    onlineToMessage();
    return () => {
      offlineToMessage();
      socket.off("msgseen");
      socket.off("istyping");
      socket.off("StopTyping");
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

  const handleImgview=(detail)=>{
    setImageView(true)
    setImage(detail)
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {message.map((m) => (
          <div
            key={m._id}
            className={`chat ${m.sender == authUser._id ? "chat-end" : "chat-start"}`}
            ref={messageEndRef}
          >
            <div className="chat-image hidden md:avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    m.sender === authUser._id
                      ? authUser.profilePic.url || ""
                      : selectedConversation.profilePic.url || ""
                  }
                />
              </div>
            </div>
            {/* <div className="chat-footer mb-1">
              <time className="text-sm opacity-50 ml-1">
                {formatMessageTime(m.createdAt)}
              </time>
            </div> */}
            <div
              className={`chat-bubble ${m.sender == authUser._id ? " chat-bubble-primary" : " chat-bubble-accent"} flex flex-col`}
            >
              {m.image && (
                <img
                  onClick={()=>handleImgview(m.image.url)}
                  src={m.image.url}
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {m.text && <p>{m.text}</p>}
              <time className="flex gap-2 items-center text-sm opacity-50">
                {formatMessageTime(m.createdAt)}
                {m.isSeen ? (
                  <CheckCheck
                    className={` ${m.sender == authUser._id ? "size-4" : "hidden"} `}
                  />
                ) : (
                  <Check
                    className={` ${m.sender == authUser._id ? "size-4" : "hidden"} `}
                  />
                )}
              </time>
            </div>
          </div>
        ))}
      </div>
      {Typing && (
        <span className="loading loading-dots loading-md mt-5 ml-6"></span>
      )}
      <MessageInput />
      {imageView && <PreviewImg detail={image} onclose={()=>{setImageView(false);setImage('')}}/>}
    </div>
  );
}

export default ChatContainer;
