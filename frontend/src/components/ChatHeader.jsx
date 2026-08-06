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
import {
  Avatar,
  Button,
  DropdownMenu,
  MenuItem,
  MenuSeparator,
  Tooltip,
} from "./ui";
import { cn } from "../lib/utils";

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
      <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Tooltip label="Back to conversations" side="bottom">
              <Button
                iconOnly
                size="sm"
                variant="ghost"
                aria-label="Back to conversations"
                onClick={() => {
                  setShowInfo(false);
                  setUnselectedConversation(null);
                }}
                className="lg:hidden"
              >
                <ArrowLeft className="size-5" />
              </Button>
            </Tooltip>
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="flex min-w-0 items-center gap-3 rounded-control p-1 text-left transition hover:bg-surface-hover"
            >
              <Avatar
                src={selectedConversation.isgroup ? selectedConversation.groupdetail?.groupIcon?.url : selectedConversation?.profilePic?.url}
                alt={selectedConversation.isgroup ? selectedConversation.groupdetail?.groupname : selectedConversation.name}
                size="md"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">
                  {selectedConversation.isgroup
                    ? selectedConversation.groupdetail?.groupname
                    : selectedConversation.name}
                </span>
                <span className={cn(
                  "mt-0.5 block truncate text-xs",
                  statusText === "Online" ? "text-brand-strong" : "text-muted",
                )}>
                  {statusText}
                </span>
              </span>
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1">
          <Tooltip label="Video call" side="bottom">
            <Button iconOnly size="sm" variant="ghost" onClick={onStartCall} aria-label="Start video call">
              <VideoIcon className="size-5" />
            </Button>
          </Tooltip>
          {onToggleSearch && (
            <Tooltip label="Search messages" side="bottom">
              <Button
                iconOnly
                size="sm"
                variant="ghost"
                onClick={onToggleSearch}
                aria-label="Search messages"
                className={showSearch ? "bg-brand-soft text-brand-strong" : ""}
              >
                <Search className="size-5" />
              </Button>
            </Tooltip>
          )}
          <DropdownMenu
            trigger={
              <Button iconOnly size="sm" variant="ghost" aria-label="Conversation actions">
                <EllipsisVerticalIcon className="size-5" />
              </Button>
            }
          >
              <MenuItem icon={InfoIcon} onClick={() => setShowInfo(true)}>
                {selectedConversation?.isgroup ? "Group info" : "Contact info"}
              </MenuItem>
              {myrole != "member" && (
                <MenuItem icon={ImageIcon} onClick={() => document.getElementById("chat-background-upload")?.click()}>
                  Change chat background
                </MenuItem>
              )}
              <MenuSeparator />
              <MenuItem icon={MinusCircle} onClick={() => setConfirmAction("clear")}>
                Clear chat
              </MenuItem>
              {myrole != "member" && (
                <MenuItem icon={Trash2Icon} destructive onClick={() => setConfirmAction("delete")}>
                  Delete chat
                </MenuItem>
              )}
          </DropdownMenu>
          <input
            type="file"
            id="chat-background-upload"
            className="hidden"
            accept="image/*"
            onChange={handleimagechange}
          />
          </div>
      </header>
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
