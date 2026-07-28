import { useState } from "react";
import {
  ArrowLeft,
  EllipsisVerticalIcon,
  ImageIcon,
  InfoIcon,
  MinusCircle,
  Search,
  Trash2Icon,
  VideoIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ConfirmDialog from "./common/ConfirmDialog";
import LoadableImage from "./common/LoadableImage";

const ChatHeader = ({ onToggleSearch, onStartCall, showSearch }) => {
  const [confirmAction, setConfirmAction] = useState("");
  const selectedConversation = useChatStore(
    (state) => state.selectedConversation,
  );
  const setUnselectedConversation = useChatStore(
    (state) => state.setUnselectedConversation,
  );
  const setConBgimage = useChatStore((state) => state.setConBgimage);
  const clearAllMsg = useChatStore((state) => state.clearAllMsg);
  const setShowInfo = useChatStore((state) => state.setShowInfo);
  const setDeleteChat = useChatStore((state) => state.setDeleteChat);
  const getConversation = useChatStore((state) => state.getConversation);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const authUser = useAuthStore((state) => state.authUser);

  const handleimagechange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
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
    reader.onload = () => {
      const base64Image = reader.result;
      setConBgimage({
        id: selectedConversation.conversationId,
        oldkey: selectedConversation.bgImage?.key || "",
        image: base64Image,
      });
    };
  };

  const onlineUsersSet = new Set(onlineUsers);

  const groupMembers =
    selectedConversation.groupdetail?.membersDetail || {};
  const onlinemember = [];
  let myrole = selectedConversation.isgroup
    ? groupMembers[authUser._id]?.role || "member"
    : "";

  if (selectedConversation.isgroup) {
    const membersId = Object.keys(groupMembers);
    membersId.forEach((id) => {
      if (id !== authUser._id && onlineUsersSet.has(id)) {
        onlinemember.push(groupMembers[id]?.fullname || "Someone");
      }
    });
  }
  let statusText = "";

  if (!selectedConversation.isgroup) {
    statusText = onlineUsersSet.has(selectedConversation.oruserId)
      ? "Online"
      : "Click here for contact info";
  } else {
    if (onlinemember.length > 1) {
      statusText = `${onlinemember[0]} & ${onlinemember.length - 1} other${onlinemember.length - 1 > 1 ? "s" : ""
        } are online`;
    } else if (onlinemember.length === 1) {
      statusText = `${onlinemember[0]} is online`;
    } else {
      statusText = "No one is online";
    }
  }

  const handleClearChat = async () => {
    const cleared = await clearAllMsg(selectedConversation.conversationId);
    if (cleared) setConfirmAction("");
  };

  const handleDeleteChat = async () => {
    const deleted = await setDeleteChat(
      selectedConversation.conversationId,
    );
    if (deleted) {
      setConfirmAction("");
      getConversation();
    }
  };

  return (
    <>
      <div className="border-b border-base-300 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
          {/* Avatar */}
          <button
            type="button"
            aria-label="Back to conversations"
            onClick={() => {
              setShowInfo(false);
              setUnselectedConversation(null);
            }}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="avatar">
            <div className="size-10 rounded-full ">
              <LoadableImage
                src={
                  selectedConversation.isgroup
                    ? selectedConversation.groupdetail?.groupIcon?.url
                    : selectedConversation?.profilePic?.url
                }
                alt={
                  selectedConversation.isgroup
                    ? selectedConversation.groupdetail.groupname
                    : selectedConversation.name
                }
                className="rounded-full object-cover"
                wrapperClassName="size-10 rounded-full"
                imgProps={{ loading: "eager", decoding: "async" }}
              />
            </div>
          </div>

          {/* User info */}
          <button
            type="button"
            onClick={() => setShowInfo(true)}
            className="flex min-w-0 flex-col text-left"
          >
            <h3 className="font-medium text-lg truncate">
              {selectedConversation.isgroup
                ? selectedConversation.groupdetail.groupname
                : selectedConversation.name}
            </h3>

            <p
              className="text-xs sm:text-sm 
                text-base-content/70 
                truncate"
            >
              {statusText}
            </p>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onStartCall}
            aria-label="Start video call"
            className="btn btn-ghost btn-circle btn-sm"
          >
            <VideoIcon className="size-5" />
          </button>
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              aria-label="Search messages"
              className={`btn btn-ghost btn-circle btn-sm ${showSearch ? "text-primary" : ""}`}
            >
              <Search className="size-5" />
            </button>
          )}
          <div className="dropdown dropdown-bottom dropdown-end">
            <button
              type="button"
              aria-label="Conversation actions"
              className="btn btn-ghost btn-circle btn-sm"
            >
              <EllipsisVerticalIcon className="size-5" />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu mt-5 bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button
                  onClick={() => setShowInfo(true)}
                  className="flex items-center"
                >
                  <InfoIcon className="size-4" />{" "}
                  {`${selectedConversation?.isgroup ? "Group" : "Contact"} Info`}
                </button>
              </li>
              {myrole != "member" && (
                <li>
                  <label
                    className="flex cursor-pointer items-center gap-2"
                    htmlFor="avatar-upload"
                  >
                    <ImageIcon className="size-4" /> Chat Theme
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleimagechange}
                    />
                  </label>
                </li>
              )}
              <div className="divider m-0 divider-primary" />
              <li>
                <button
                  className="flex items-center"
                  onClick={() => setConfirmAction("clear")}
                >
                  <MinusCircle className="size-4" /> Clear Chat
                </button>
              </li>
              {myrole != "member" && (
                <li>
                  <button
                    onClick={() => setConfirmAction("delete")}
                    className="flex items-center"
                  >
                    <Trash2Icon className="size-4" /> Delete Chat
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      </div>
      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction === "delete" ? "Delete conversation?" : "Clear chat?"}
        description={
          confirmAction === "delete"
            ? "This removes the conversation from your chat list."
            : "This removes all messages in this conversation for you."
        }
        confirmLabel={confirmAction === "delete" ? "Delete" : "Clear"}
        onCancel={() => setConfirmAction("")}
        onConfirm={
          confirmAction === "delete" ? handleDeleteChat : handleClearChat
        }
      />
    </>
  );
};
export default ChatHeader;
