import { ArrowLeft, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
            <button onClick={() => setSelectedConversation(null)}>
                <ArrowLeft />
            </button>
          <div className="avatar">
            <div className="size-10 rounded-full ">
              <img src={selectedConversation.profilePic.url || "/avatar.png"}/>
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedConversation.name}</h3>
            <p className="text-sm text-base-content/70">
              {onlineUsers.includes(selectedConversation.oruserId) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Close button */}
      </div>
    </div>
  );
};
export default ChatHeader;