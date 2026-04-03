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
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";

const ChatHeader = ({ onToggleSearch, onStartCall, showSearch }) => {
  const {
    selectedConversation,
    setUnselectedConversation,
    setConBgimage,
    clearAllMsg,
    setShowInfo,
    setDeleteChat,
    getConversation,
    setGroupUpdation,
  } = useChatStore();
  const { onlineUsers, authUser, socket } = useAuthStore();

  useEffect(() => {
    socket.on("udGroupDetail", (conversation) =>
      setGroupUpdation(conversation),
    );
    return () => {
      socket.off('udGroupDetail');
    };
  }, [socket]);

  const handleimagechange = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
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

  let onlinemember = [];
  let myrole = selectedConversation.isgroup
    ? selectedConversation.groupdetail.membersDetail[authUser._id].role
    : "";

  if (selectedConversation.isgroup) {
    const membersId = Object.keys(
      selectedConversation.groupdetail.membersDetail,
    );
    membersId.forEach((id) => {
      if (id !== authUser._id && onlineUsersSet.has(id)) {
        onlinemember.push(
          selectedConversation.groupdetail.membersDetail[id].fullname,
        );
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
      statusText = `${onlinemember[0]} & ${onlinemember.length - 1} other${
        onlinemember.length - 1 > 1 ? "s" : ""
      } are online`;
    } else if (onlinemember.length === 1) {
      statusText = `${onlinemember[0]} is online`;
    } else {
      statusText = "No one is online";
    }
  }

  const handleClearChat = () => {
    clearAllMsg(selectedConversation.conversationId);
  };

  const handleDeleteChat = () => {
    setDeleteChat(selectedConversation.conversationId);
    setTimeout(() => {
      getConversation();
    }, 3000);
  };

  return (
    <div className="p-2.5 pt-5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button onClick={() => setUnselectedConversation(null)}>
            <ArrowLeft />
          </button>
          <div className="avatar">
            <div className="size-10 rounded-full ">
              <img
                src={
                  selectedConversation.isgroup
                    ? selectedConversation.groupdetail?.groupIcon.url
                    : selectedConversation?.profilePic?.url
                }
              />
            </div>
          </div>

          {/* User info */}
          <div onClick={() => setShowInfo()} className="flex flex-col min-w-0 cursor-pointer">
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
          </div>
        </div>
        <div className="flex items-center justify-evenly space-x-5">
          <button onClick={onStartCall} className="">
            <VideoIcon />
          </button>
          {onToggleSearch && (
            <button
              onClick={onToggleSearch}
              className={`${showSearch ? "text-primary" : ""}`}
            >
              <Search className="size-5" />
            </button>
          )}
          <div className="dropdown dropdown-bottom dropdown-end">
            <button>
              <EllipsisVerticalIcon />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu mt-5 bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button
                  onClick={() => setShowInfo()}
                  className="flex items-center"
                >
                  <InfoIcon className="size-4" />{" "}
                  {`${selectedConversation?.isgroup ? "Group" : "Contact"} Info`}
                </button>
              </li>
              {myrole != "member" && (
                <li>
                  <button
                    onClick={() => alert("Must be dimension 800x600 or above")}
                  >
                    <label
                      className="flex gap-2 items-center"
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
                  </button>
                </li>
              )}
              <div className="divider m-0 divider-primary" />
              <li>
                <button
                  className="flex items-center"
                  onClick={() => handleClearChat()}
                >
                  <MinusCircle className="size-4" /> Clear Chat
                </button>
              </li>
              {myrole != "member" && (
                <li>
                  <button
                    onClick={() => handleDeleteChat()}
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
  );
};
export default ChatHeader;
