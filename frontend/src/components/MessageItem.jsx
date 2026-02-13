import React, { memo } from "react";
import { formatMessageTime } from "../lib/utils";
import { Check, CheckCheck } from "lucide-react";

const MessageItem = memo(
  ({ m, authUser, selectedConversation, onImageClick }) => {
    const isSentByMe = m.sender === authUser._id;

    return (
      <div className={`chat ${isSentByMe ? "chat-end" : "chat-start"}`}>
        <div className="chat-image hidden md:avatar">
          <div className="size-10 rounded-full border">
            <img
              src={
                isSentByMe
                  ? authUser.profilePic.url || ""
                  : selectedConversation.profilePic.url || ""
              }
              alt="profile"
            />
          </div>
        </div>

        <div
          className={`chat-bubble ${isSentByMe ? "chat-bubble-primary" : "chat-bubble-accent"} flex flex-col`}
        >
          {m.image && (
            <img
              onClick={() => onImageClick(m.image.url)}
              src={m.image.url}
              className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
              alt="attachment"
            />
          )}
          {m.text && <p>{m.text}</p>}

          <time className="flex gap-2 items-center text-sm opacity-50">
            {formatMessageTime(m.createdAt)}
            {isSentByMe &&
              (m.isSeen ? (
                <CheckCheck className="size-4" />
              ) : (
                <Check className="size-4" />
              ))}
          </time>
        </div>
      </div>
    );
  },
);

export default MessageItem;