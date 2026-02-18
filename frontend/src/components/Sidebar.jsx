import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";

function Sidebar() {
  const {
    getConversation,
    conversations,
    setSelectedConversation,
    selectedConversation,
    isConversationLoading,
    setNmsgInCon,
    setUpdatedMessage,
    setDeletedMessageForSlider
  } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const [Typing, setTyping] = useState('');

  useEffect(() => {
    getConversation();
  }, [getConversation]);

  useEffect(() => {
    socket.on("newmessage", (newMessage) => setNmsgInCon(newMessage));
    socket.on("istyping", (userId) => setTyping(userId));
    socket.on("StopTyping", (userId) => setTyping(userId == Typing ? '' : Typing));
    socket.on('reacted',(msg)=>setUpdatedMessage(msg));
    socket.on('delete',(msg)=>setDeletedMessageForSlider(msg));
    return () => {
      socket.off("istyping");
      socket.off("StopTyping");
      socket.off("newmessage");
      socket.off('reacted');
      socket.off('delete');
    };
  }, [socket]);

  if (isConversationLoading) return <SidebarSkeleton />;
  return (
    <aside
      className={`h-full w-full lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 ${selectedConversation ? "hidden lg:flex" : ""}`}
    >
      <div className=" border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium block">Contacts</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search Conversation"
            className="input input-bordered w-full mt-3"
          />
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {conversations.map((conversation) => (
          <button
            key={conversation.conversationId}
            onClick={() => setSelectedConversation(conversation)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedConversation?.conversationId === conversation.conversationId ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative max-w-12 lg:mx-0">
              <PhotoProvider>
                <PhotoView src={conversation.profilePic.url}>
                  <img
                    src={conversation.profilePic.url || "/avatar.png"}
                    className="size-12 object-cover rounded-full"
                  />
                </PhotoView>
              </PhotoProvider>
              {onlineUsers.includes(conversation.oruserId) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className="block text-left max-w-[200px] min-w-0">
              <div className=" flex gap-28 items-center">
                <div className="font-medium text-sm truncate">
                  {conversation.name}
                </div>
                <div
                  className={`rounded-full ${conversation.unseenMsg == 0 || conversation.lastmessage.sender == authUser._id ? "hidden" : "flex"} justify-center items-center bg-base-300 text-xs size-3`}
                >
                  {conversation.unseenMsg}
                </div>
              </div>
              <div className="text-xs text-zinc-400 truncate">
                {Typing==conversation.oruserId ? "typing..." : conversation?.lastmessage.text || ""}
              </div>
            </div>
          </button>
        ))}

        {onlineUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">No online users</div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
