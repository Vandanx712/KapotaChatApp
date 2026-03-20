import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, SmileIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingRef = useRef(null);
  const { selectedConversation, sendMessage, setIsTyping, setStopTyping } =
    useChatStore();

  const handleimagechange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      toast.error("Please select an image file");
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
      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error(error.response.data.message);
      console.error("Failed to send message:", error);
    }
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
  };

  return (
    <div className="p-4 w-full relative">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeimage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      {showPicker && (
        <>
          {/* Dark Backdrop: Closes picker when clicking anywhere else */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowPicker(false)}
          />

          {/* Centered Picker Container */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]">
            <div className="shadow-2xl border border-base-300 rounded-xl overflow-hidden scale-95 md:scale-100 animate-in zoom-in duration-200">
              <EmojiPicker
                onEmojiClick={(emojiData, event) => {
                  onEmojiClick(emojiData, event);
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

      <form onSubmit={handlesendmessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <label className="input w-full input-bordered flex items-center gap-5 input-md">
            <input
              type="text"
              className="w-full rounded-lg "
              placeholder="Type a message..."
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (e.target.value.trim().length > 0)
                  setIsTyping(selectedConversation);
                clearTimeout(typingRef.current);
                typingRef.current = setTimeout(() => {
                  setStopTyping(selectedConversation);
                }, 800);
              }}
            />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleimagechange}
            />
            <button
              type="button"
              className={`flex sm:hidden
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
            <button
              type="button"
              className={`flex sm:hidden
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
              onClick={() => setShowPicker((prev) => !prev)}
            >
              <SmileIcon size={20} />
            </button>
          </label>
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
          <button
            type="button"
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
            onClick={() => setShowPicker((prev) => !prev)}
          >
            <SmileIcon size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
