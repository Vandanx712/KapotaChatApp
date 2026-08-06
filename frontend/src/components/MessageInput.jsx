import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { Image, Send, SmileIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { Button, Tooltip } from "./ui";
import { useThemeStore } from "../store/useThemeStore";

function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  const selectedConversation = useChatStore(
    (state) => state.selectedConversation,
  );
  const sendMessage = useChatStore((state) => state.sendMessage);
  const setIsTyping = useChatStore((state) => state.setIsTyping);
  const setStopTyping = useChatStore((state) => state.setStopTyping);
  const replyingTo = useChatStore((state) => state.replyingTo);
  const clearReplyingTo = useChatStore((state) => state.clearReplyingTo);
  const authUser = useAuthStore((state) => state.authUser);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        setStopTyping(selectedConversation);
        isTypingRef.current = false;
      }
    };
  }, [selectedConversation, setStopTyping]);

  const stopTypingNow = () => {
    clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    setStopTyping(selectedConversation);
    isTypingRef.current = false;
  };

  const replySenderName = (() => {
    if (!replyingTo) return "";
    const senderId = replyingTo.sender?.toString?.() || replyingTo.sender;
    if (senderId === authUser?._id) return "You";
    if (!selectedConversation?.isgroup) return selectedConversation?.name || "Contact";
    return (
      selectedConversation.groupdetail?.membersDetail?.[senderId]?.fullname ||
      "Participant"
    );
  })();

  const handleimagechange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      toast.error("Image must be smaller than 9 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
  };

  const removeimage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlesendmessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    try {
      const sent = await sendMessage({
        text: text.trim(),
        image: imagePreview,
        replyToId: replyingTo?._id,
      });
      if (!sent) return;

      setText("");
      setImagePreview(null);
      clearReplyingTo();
      stopTypingNow();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send message");
      console.error("Failed to send message:", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="relative w-full shrink-0 border-t border-line bg-surface-muted px-4 py-3">
      {replyingTo && (
        <div className="mb-3 flex items-center gap-3 rounded-app border border-line bg-surface px-3 py-2 shadow-control">
          <div className="min-w-0 flex-1 border-l-2 border-brand pl-3">
            <p className="text-xs font-semibold text-brand-strong">
              Replying to {replySenderName}
            </p>
            <p className="mt-0.5 truncate text-sm text-muted">
              {replyingTo.deleted ? "This message was deleted" : replyingTo.text || (replyingTo.image ? "Photo" : "Message")}
            </p>
          </div>
          <Button
            type="button"
            iconOnly
            size="sm"
            variant="ghost"
            onClick={clearReplyingTo}
            aria-label="Cancel reply"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2 rounded-app border border-line bg-surface p-2 shadow-control">
          <div className="relative shrink-0">
            <img
              src={imagePreview}
              alt="Preview"
              className="size-20 rounded-control border border-line object-cover"
            />
            <button
              onClick={removeimage}
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full border border-line bg-surface-raised text-muted shadow-control hover:text-ink"
              type="button"
              aria-label="Remove attachment"
            >
              <X className="size-3" />
            </button>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">Image ready to send</p>
            <p className="mt-0.5 text-xs text-muted">Add a message or send it as is.</p>
          </div>
        </div>
      )}

      {showPicker && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/10"
            onClick={() => setShowPicker(false)}
          />
          <div className="absolute bottom-[68px] left-4 z-[70] overflow-hidden rounded-app border border-line bg-surface-raised shadow-overlay animate-ui-in">
            <EmojiPicker
              onEmojiClick={(emojiData) => onEmojiClick(emojiData)}
              theme={theme}
              autoFocusSearch={true}
              width={350}
              height={400}
              lazyLoadEmojis={true}
            />
          </div>
        </>
      )}

      <form onSubmit={handlesendmessage} className="flex items-end gap-2">
        <div className="message-composer flex min-h-11 min-w-0 flex-1 items-center gap-1 rounded-app border border-line bg-surface px-1.5 shadow-control">
          <Tooltip label="Attach image" side="top">
            <Button
              type="button"
              iconOnly
              size="sm"
              variant="ghost"
              className={imagePreview ? "text-brand-strong" : ""}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach image"
            >
              <Image className="size-5" />
            </Button>
          </Tooltip>
          <Tooltip label="Emoji" side="top">
            <Button
              type="button"
              iconOnly
              size="sm"
              variant="ghost"
              className={showPicker ? "bg-brand-soft text-brand-strong" : ""}
              onClick={() => setShowPicker((prev) => !prev)}
              aria-label="Choose emoji"
            >
              <SmileIcon className="size-5" />
            </Button>
          </Tooltip>
          <input
            type="text"
            className="h-10 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-ink outline-none placeholder:text-subtle"
            placeholder="Type a message"
            value={text}
            onChange={(e) => {
              const nextText = e.target.value;
              setText(nextText);

              if (!nextText.trim()) {
                stopTypingNow();
                return;
              }

              if (!isTypingRef.current) {
                setIsTyping(selectedConversation);
                isTypingRef.current = true;
              }

              clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(stopTypingNow, 800);
            }}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleimagechange}
          />
        </div>
        <Button
          type="submit"
          iconOnly
          size="lg"
          variant="primary"
          disabled={!text.trim() && !imagePreview}
          aria-label="Send message"
        >
          <Send size={20} />
        </Button>
      </form>
    </div>
  );
}

export default MessageInput;
