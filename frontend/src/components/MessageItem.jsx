import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { formatMessageTime } from "../lib/utils";
import {
  Check,
  CheckCheck,
  CopyIcon,
  Edit2,
  EllipsisVerticalIcon,
  LucideInfo,
  SmileIcon,
  Trash2Icon,
  X,
} from "lucide-react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import EmojiPicker from "emoji-picker-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const MessageItem = memo(
  ({ m, authUser, selectedConversation, highlightId }) => {
    const isSentByMe = m?.sender === authUser._id;
    const { messageUpdate } = useChatStore();
    const [showPicker, setShowPicker] = useState(false);
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editedText, setEditedText] = useState(m?.text);
    const [info, setInfo] = useState(false);

    const { socket } = useAuthStore();
  const { setReactedMsg, messageDelete } = useChatStore();
  const [openUp, setOpenUp] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef(null);
  const isHighlighted = highlightId && m?._id === highlightId;

  if (m?.system) {
    if (m?.deletedFor?.includes(authUser._id)) return null;
    return (
      <div className="px-4 flex justify-center m-2">
        <div className="chat-bubble chat-bubble-neutral text-xs sm:text-sm">
          {m.text}
        </div>
      </div>
    );
  }

    const modalRef = useRef(null);

    const onClose = () => {
      setInfo(false);
      setDeleting(false);
      setEditing(false);
    };

    // click outside close
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
          onClose();
        }
      };

      const handleEsc = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      document.addEventListener("pointerdown", handleClickOutside);
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("pointerdown", handleClickOutside);
        window.removeEventListener("keydown", handleEsc);
      };
    }, []);

    const supportsHover =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches;

    const handleOpen = () => {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      if (spaceBelow < 150 && spaceAbove > 150) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    };

    const now = new Date().getTime();
    const createdAt = new Date(m?.createdAt).getTime();
    const TEN_MIN = 10 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const updatefor = now <= createdAt + TEN_MIN;
    const deletefor = now <= createdAt + ONE_DAY;

    let myrole;
    let profilePic;
    let unknown;
    if (selectedConversation.isgroup) {
      if (!selectedConversation.groupdetail.membersDetail[m.sender]) {
        unknown = true;
      }
      profilePic =
        selectedConversation.groupdetail.membersDetail[m.sender]?.profilePic;
      const membersId = Object.keys(
        selectedConversation.groupdetail.membersDetail,
      );
      const mydetail =
        selectedConversation.groupdetail.membersDetail[
          membersId.filter((mem) => mem == authUser._id)[0]
        ];
      myrole = mydetail?.role;
    }

    const seenBySet = new Set();
    if (m && m._id !== "typing") {
      [m.sender, ...(m.seenBy || [])]
        .filter(Boolean)
        .forEach((id) => seenBySet.add(id.toString()));
    }
    const seenByCount =
      selectedConversation.isgroup && isSentByMe
        ? [...seenBySet].filter((id) => id !== authUser._id).length
        : 0;
    const seenByNames =
      selectedConversation.isgroup && isSentByMe
        ? [...seenBySet]
            .filter((id) => id !== authUser._id)
            .map(
              (id) =>
                selectedConversation.groupdetail?.membersDetail?.[id]
                  ?.fullname || "Unknown",
            )
            .filter(Boolean)
        : [];

    const canEdit =
      (!selectedConversation.isgroup &&
        m.sender === authUser._id &&
        !m.isSeen &&
        updatefor) ||
      (selectedConversation.isgroup && myrole !== "member" && updatefor);

    useEffect(() => {
      socket.on("reacted", (msg) => {
        setReactedMsg(msg);
      });
    }, [socket]);

    const onEmojiClick = (id, emojiData) => {
      messageUpdate(id, {
        conversationId: selectedConversation.conversationId,
        text: "",
        emoji: emojiData.emoji,
      });
    };

    const handleSaveEdit = () => {
      messageUpdate(m._id, {
        conversationId: selectedConversation.conversationId,
        text: editedText.trim(),
        emoji: "",
      });
      m.text = editedText.trim();
      setEditing(false);
    };

    const handledeleteForMe = () => {
      messageDelete(m._id, {
        conversationId: selectedConversation.conversationId,
        deleteType: "deleteForMe",
      });
      setDeleting(false);
    };

    const handleDeleteEeveryone = () => {
      messageDelete(m._id, {
        conversationId: selectedConversation.conversationId,
        deleteType: "deleteForEveryone",
      });
      setDeleting(false);
    };
    return (
      <div
        className={`px-4 chat ${isSentByMe ? "chat-end" : "chat-start"} ${m?.deletedFor?.includes(authUser._id) ? "hidden" : ""}`}
      >
        <div className={`${unknown ? "hidden" : "chat-image"} avatar`}>
          <div className="md:size-10 size-5 rounded-full border">
            <img
              src={
                isSentByMe
                  ? authUser.profilePic.url || ""
                  : profilePic?.url || selectedConversation?.profilePic.url
              }
              alt="profile"
            />
          </div>
        </div>

        <div
          onClick={() => {
            if (!supportsHover) {
              setShowActions((prev) => !prev);
            }
          }}
          className={`group relative overflow-visible chat-bubble ${isSentByMe ? "chat-bubble-primary" : "chat-bubble-accent"} ${m._id === "typing" ? "hidden" : ""} ${isHighlighted ? "ring-2 ring-primary/60 ring-offset-2 ring-offset-base-100" : ""} flex flex-col`}
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
          {m.text && (
            <p>
              {m.deletedForEveryone
                ? authUser._id == m.sender
                  ? "You deleted this message"
                  : "This message was deleted"
                : m.text}
            </p>
          )}

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
            className={` ${
              m?.deletedForEveryone
                ? "hidden"
                : supportsHover
                  ? "opacity-0 group-hover:opacity-100"
                  : showActions
                    ? "opacity-100"
                    : "opacity-0"
            } ${isSentByMe ? "right-full mr-2" : "left-full ml-2"} absolute top-1 gap-2 items-center transition-opacity duration-200`}
          >
            <div
              ref={dropdownRef}
              className={`dropdown ${
                isSentByMe ? "dropdown-start mr-2" : "ml-2 dropdown-end"
              } ${openUp ? "dropdown-top" : "dropdown-bottom"}`}
            >
              <button onClick={handleOpen}>
                <EllipsisVerticalIcon className="size-5 cursor-pointer" />
              </button>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-50 min-w-44 p-2 shadow"
              >
                <li>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(m?.text);
                      toast.success("Copied");
                    }}
                    className="flex text-sm items-center gap-3"
                  >
                    <CopyIcon className="size-4" /> Copy Message
                  </button>
                </li>
                {selectedConversation.isgroup &&
                  isSentByMe &&
                  seenByCount > 0 && (
                    <li>
                      <button
                        onClick={() => {
                          setInfo(true);
                        }}
                        className="flex text-sm items-center gap-3"
                      >
                        <LucideInfo className="size-4" /> Info Message
                      </button>
                    </li>
                  )}
                {canEdit && (
                  <li>
                    <button
                      onClick={() => setEditing(true)}
                      className="flex text-sm items-center gap-3"
                    >
                      <Edit2 className="size-4" />
                      Edit Message
                    </button>
                  </li>
                )}
                <div className="divider m-0 divider-primary" />
                <li>
                  <button
                    onClick={() => setDeleting((pre) => !pre)}
                    className="flex text-sm items-center gap-3"
                  >
                    <Trash2Icon className="size-4" /> Delete Message
                  </button>
                </li>
              </ul>
            </div>
            <SmileIcon
              onClick={(e) => {
                e.stopPropagation();
                setShowPicker((prev) => !prev);
              }}
              className={`size-5 cursor-pointer ${m.sender == authUser._id ? "mr-2" : "ml-2"}`}
            />
          </div>
        </div>
        <div className={`${m?.reacted ? "chat-footer" : "hidden"}`}>
          {m.reacted}
        </div>
        <div
          className={`${m._id === "typing" ? "chat-bubble chat-bubble-accent" : "hidden"}`}
        >
          <span className="loading loading-dots loading-md"></span>
        </div>

        {info && (
          <div
            ref={modalRef}
            className="fixed min-w-[350px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] shadow-2xl bg-base-100/80 md:p-5 p-3 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col">
              <div className="flex gap-5 items-center">
                <X
                  className="size-6 cursor-pointer"
                  onClick={() => {
                    setInfo((prv) => !prv);
                  }}
                />
                <h2 className="text-lg font-medium">Seen by ({seenByCount})</h2>
              </div>
              <div className="flex p-5 flex-col space-y-3 overflow-auto max-h-[350px]">
                {seenByNames.map((name, index) => (
                  <div key={`${name}-${index}`} className="truncate">
                    {name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {editing && (
          <div
            ref={modalRef}
            className="fixed min-w-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] shadow-2xl bg-base-100/80 md:p-5 p-3 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col space-y-5">
              <div className="flex gap-2 items-center">
                <X
                  className="size-6 cursor-pointer"
                  onClick={() => {
                    setEditing((prv) => !prv);
                    setEditedText(m.text);
                  }}
                />
                <h2 className="text-lg font-medium">Edit Message</h2>
              </div>
              <div className="chat-bubble chat-bubble-primary">
                {editedText}
              </div>
              <div className="md:p-5 p-1 flex gap-5">
                <input
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="input input-bordered w-full "
                  rows={2}
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={editedText.trim() === m.text}
                  className="btn btn-circle"
                >
                  <Check className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {deleting && (
          <div
            ref={modalRef}
            className="fixed min-w-[300px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] shadow-2xl bg-base-100/80 md:p-5 p-3 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col space-y-5">
              <div className="flex gap-2 items-center">
                <X
                  className="size-6 cursor-pointer"
                  onClick={() => {
                    setDeleting((prv) => !prv);
                  }}
                />
                <h2 className="text-lg font-medium">Delete Message?</h2>
              </div>
              <div className="md:p-5 p-1 flex flex-col gap-3 items-end">
                <button
                  onClick={handleDeleteEeveryone}
                  className={`${deletefor && myrole == "admin" && m.sender == authUser._id ? "" : "hidden"} btn cursor-pointer rounded-2xl text-error`}
                >
                  Delete for everyone
                </button>
                <button
                  onClick={handledeleteForMe}
                  className="btn cursor-pointer rounded-2xl text-error"
                >
                  Delete for me
                </button>
              </div>
            </div>
          </div>
        )}
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
    );
  },
);

export default MessageItem;
