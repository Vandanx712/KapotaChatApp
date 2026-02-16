import React, { memo, useState } from "react";
import { formatMessageTime } from "../lib/utils";
import {
  Check,
  CheckCheck,
  EllipsisVerticalIcon,
  SmileIcon,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../store/useChatStore";

const MessageItem = memo(
  ({ m, authUser, selectedConversation }) => {
    const isSentByMe = m.sender === authUser._id;
    const { messageUpdate } = useChatStore();
    const [showPicker, setShowPicker] = useState(false);

    const onEmojiClick = (id, emojiData) => {
      messageUpdate(id, {
        conversationId: selectedConversation.conversationId,
        emoji: emojiData.emoji,
      });
    };
    return (
      <div className={`ml-1 chat ${isSentByMe ? "chat-end" : "chat-start"}`}>
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
          className={`group relative chat-bubble ${isSentByMe ? "chat-bubble-primary" : "chat-bubble-accent"} flex flex-col`}
        >
          {m.image && (
            <PhotoProvider>
              <PhotoView src={m.image.url}>
                <img
                  src={m.image.url}
                  className="sm:max-w-[200px] rounded-md mb-2 cursor-pointer"
                  alt="attachment"
                />
              </PhotoView>
            </PhotoProvider>
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
          <div
            className={`group-hover:flex flex-col hidden absolute ${isSentByMe ? "-left-6 pr-10" : "-right-6 pl-10"} top-1 gap-2 items-center`}
          >
            <EllipsisVerticalIcon className="size-5 cursor-pointer" />
            <SmileIcon
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker((prev) => !prev);
              }}
              className=" size-5 cursor-pointer"
            />
            {showPicker && (
              <>
                <div
                  className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
                  onClick={() => setShowPicker(false)}
                />
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]">
                  <div className="shadow-2xl border border-base-300 rounded-xl overflow-hidden scale-95 md:scale-100 animate-in zoom-in duration-200">
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        onEmojiClick(m._id, emojiData);
                        setShowPicker(false);
                      }}
                      theme="dark"
                      autoFocusSearch={true}
                      width={window.innerWidth < 450 ? 280 : 350}
                      height={400}
                      lazyLoadEmojis={true}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className={`${m?.reacted ? "chat-footer" : "hidden"}`}>
          {m.reacted}
        </div>
      </div>
    );
  },
);

export default MessageItem;
