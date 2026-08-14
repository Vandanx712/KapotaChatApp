import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { FileText, Paperclip, Send, SmileIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { Button, Tooltip } from "./ui";
import { useThemeStore } from "../store/useThemeStore";
import { uploadMedia } from "../hooks/uploadMedia";

const MAX_ATTACHMENT_BYTES = 100 * 1024 * 1024;
const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function MessageInput() {
  const [text, setText] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [preparedMedia, setPreparedMedia] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const uploadAbortRef = useRef(null);
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
    if (!selectedFile) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      uploadAbortRef.current?.abort();
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.has(file.type)) {
      toast.error("This file type is not supported");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error("Attachment must be smaller than 100 MB");
      event.target.value = "";
      return;
    }

    uploadAbortRef.current?.abort();
    setSelectedFile(file);
    setPreparedMedia(null);
    setUploadProgress(null);
  };

  const removeFile = () => {
    uploadAbortRef.current?.abort();
    uploadAbortRef.current = null;

    setSelectedFile(null);
    setPreparedMedia(null);
    setUploadProgress(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlesendmessage = async (event) => {
    event.preventDefault();

    if ((!text.trim() && !selectedFile) || isSending) return;

    setIsSending(true);

    try {
      let media = preparedMedia;

      if (selectedFile && !media) {
        const controller = new AbortController();
        uploadAbortRef.current = controller;

        media = await uploadMedia({
          file: selectedFile,
          purpose: "chat_attachment",
          conversationId: selectedConversation.conversationId,
          signal: controller.signal,
          onProgress: setUploadProgress,
        });

        if (controller.signal.aborted) return;
        setPreparedMedia(media);
      }

      setUploadProgress({
        phase: "sending",
        percent: 100,
      });

      const sent = await sendMessage({
        text: text.trim(),
        mediaId: media?._id ?? null,
        replyToId: replyingTo?._id,
      });

      if (!sent) {
        setUploadProgress({ phase: "ready to retry", percent: 100 });
        return;
      }

      setText("");
      removeFile();
      clearReplyingTo();
      stopTypingNow();
    } catch (error) {
      if (error.code !== "ERR_CANCELED") {
        toast.error(
          error.response?.data?.message ||
          error.response?.data?.error?.message ||
          "Attachment could not be sent",
        );
      }
    } finally {
      uploadAbortRef.current = null;
      setIsSending(false);
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
              {replyingTo.deleted
                ? "This message was deleted"
                : replyingTo.text ||
                  (replyingTo.media ? "Attachment" : replyingTo.image ? "Photo" : "Message")}
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

      {selectedFile && (
        <div className="mb-3 flex items-center gap-3 rounded-app border border-line bg-surface p-2">
          {selectedFile.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt=""
              className="size-20 rounded-control object-cover"
            />
          ) : selectedFile.type.startsWith("video/") ? (
            <video
              src={previewUrl}
              muted
              preload="metadata"
              className="size-20 rounded-control bg-black object-cover"
            />
          ) : (
            <div className="flex size-20 items-center justify-center rounded-control bg-surface-muted">
              <FileText className="size-7 text-muted" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">
              {selectedFile.name}
            </p>

            <p className="text-xs text-muted">
              {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
            </p>

            {uploadProgress && (
              <div className="mt-2">
                <div className="h-1 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-brand transition-[width]"
                    style={{ width: `${uploadProgress.percent}%` }}
                  />
                </div>
                <p className="mt-1 text-xs capitalize text-muted">
                  {uploadProgress.phase}
                </p>
              </div>
            )}
          </div>

          <Button
            iconOnly
            size="sm"
            variant="ghost"
            onClick={removeFile}
            aria-label={isSending ? "Cancel upload" : "Remove attachment"}
          >
            <X className="size-4" />
          </Button>
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
          <Tooltip label="Attach file" side="top">
            <Button
              type="button"
              iconOnly
              size="sm"
              variant="ghost"
              className={selectedFile ? "text-brand-strong" : ""}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
            >
              <Paperclip className="size-5" />
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
            accept="image/*,video/mp4,video/webm,video/quicktime,audio/*,.pdf,.txt,.doc,.docx"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
        </div>
        <Button
          type="submit"
          iconOnly
          size="lg"
          variant="primary"
          loading={isSending}
          disabled={!text.trim() && !selectedFile}
          aria-label="Send message"
        >
          {!isSending && <Send size={20} />}
        </Button>
      </form>
    </div>
  );
}

export default MessageInput;
