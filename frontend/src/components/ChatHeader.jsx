import {
  ArrowLeft,
  EllipsisVerticalIcon,
  ImageIcon,
  InfoIcon,
  MinusCircle,
  Trash2Icon,
  VideoIcon,
  X,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedConversation, setUnselectedConversation, setConBgimage,clearAllMsg } =
    useChatStore();
  const { onlineUsers } = useAuthStore();

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

  const handleClearChat = ()=>{
    clearAllMsg(selectedConversation.conversationId)
  }

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <button onClick={() => setUnselectedConversation(null)}>
            <ArrowLeft />
          </button>
          <div className="avatar">
            <div className="size-10 rounded-full ">
              <img src={selectedConversation.profilePic.url || "/avatar.png"} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedConversation.name}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedConversation.oruserId)
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-evenly space-x-5">
          <button className="">
            <VideoIcon />
          </button>
          <div className="dropdown dropdown-bottom dropdown-end">
            <button>
              <EllipsisVerticalIcon />
            </button>
            <ul
              tabIndex={0}
              className="dropdown-content menu mt-5 bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
            >
              <li>
                <button className="flex items-center">
                  <InfoIcon className="size-4" /> Contact Info
                </button>
              </li>
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
              <div className="divider m-0 divider-primary" />
              <li>
                <button className="flex items-center" onClick={()=>handleClearChat()}>
                  <MinusCircle className="size-4" /> Clear Chat
                </button>
              </li>
              <li>
                <button className="flex items-center">
                  <Trash2Icon className="size-4" /> Delete Chat
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
