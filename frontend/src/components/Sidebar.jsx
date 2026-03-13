import React, { useEffect, useMemo, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import {
  MessageCirclePlusIcon,
  MessageSquarePlusIcon,
  Search,
  Users,
  UsersRoundIcon,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import CreateGroup from "./CreateGroup";
import { getAllUsers } from "../lib/axios";

function Sidebar() {
  const {
    getConversation,
    conversations,
    setSelectedConversation,
    selectedConversation,
    isConversationLoading,
    setNmsgInCon,
    setUpdatedMessage,
    setDeletedMessageForSlider,
    setGroupUpdation,
    refreshGroupMember,
  } = useChatStore();
  const { onlineUsers, socket, authUser } = useAuthStore();
  const { creteConversation } = useChatStore();
  const [Typing, setTyping] = useState("");
  const [newChat, setNewChat] = useState(false);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const menuItems = [
    {
      id: 1,
      icon: <UsersRoundIcon />,
      label: "New group",
    },
    {
      id: 2,
      icon: <MessageCirclePlusIcon />,
      label: "Create Channel",
    },
  ];

  const existConversationSet = useMemo(() => {
    return new Set(
      conversations.filter((con) => !con.isgroup).map((con) => con.oruserId),
    );
  }, [conversations]);

  useEffect(() => {
    const loadusers = async () => {
      try {
        const resdata = await getAllUsers();
        setUsers(resdata.users);
      } catch (error) {
        console.log(error);
      }
    };
    loadusers();
    setDebouncedSearch("");
    setSearch("");
  }, [newChat]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    getConversation();
  }, [getConversation]);

  useEffect(() => {
    socket.on("newmessage", (newMessage) => setNmsgInCon(newMessage));
    socket.on("istyping", (userId) => setTyping(userId));
    socket.on("StopTyping", (userId) =>
      setTyping(userId.receiverId == Typing.receiverId ? "" : Typing),
    );
    socket.on("reacted", (msg) => setUpdatedMessage(msg));
    socket.on("delete", (msg) => setDeletedMessageForSlider(msg));
    socket.on("udGroupDetail", (conversation) =>
      setGroupUpdation(conversation),
    );
    socket.on("refresh", (type, conversation) => {
      refreshGroupMember(type, conversation);
    });
    return () => {
      socket.off("istyping");
      socket.off("StopTyping");
      socket.off("newmessage");
      socket.off("reacted");
      socket.off("delete");
      socket.off("udGroupDetail");
      socket.off("refresh");
    };
  }, [socket]);

  const handleChatClick = (id) => {
    creteConversation(id);
    setNewChat(false);
  };

  const onlineUsersSet = new Set(onlineUsers);

  const getOnlineGroupUsers = (conversation, onlineUsersSet) => {
    if (!conversation.isgroup) return [];
    return Object.entries(conversation.groupdetail.membersDetail).filter(
      ([id]) => id !== authUser._id && onlineUsersSet.has(id),
    );
  };

  const filteredChats = conversations.filter((chat) => {
    const name = chat.isgroup ? chat.groupdetail?.groupname : chat.name;

    return (name || "").toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const filteredUsers = users.filter((user) => {
    return user.fullname.toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const setSelectedChat = (id) => {
    setSelectedConversation(
      conversations.find((con) => con.oruserId == id && !con.isgroup),
    );
    setNewChat((prev) => !prev);
  };

  if (isConversationLoading) return <SidebarSkeleton />;
  return (
    <aside
      className={`h-full pt-4 bg-base-200 w-full lg:w-[350px] border-r border-base-300 flex flex-col transition-all duration-200 ${selectedConversation ? "hidden lg:flex" : ""}`}
    >
      {!open && (
        <>
          <div className="shrink-0 border-b border-base-300 p-5">
            <div className="flex items-center justify-between gap-2">
              <Users
                onClick={() => setNewChat(false)}
                className={`size-6 cursor-pointer ${!newChat && " opacity-60"}`}
              />
              <MessageSquarePlusIcon
                onClick={() => setNewChat(true)}
                className={`size-6 cursor-pointer ${newChat && " opacity-60"}`}
              />
            </div>
            <div className="mt-6">
              <label className="flex items-center gap-2 input input-bordered input-md w-full">
                <Search className="size-5" />
                <input
                  type="text"
                  value={search}
                  placeholder={`${newChat ? "Search Name" : "Search Conversation"}`}
                  onChange={(e) => setSearch(e.target.value)}
                  className=" w-full bg-transparent outline-none"
                />
              </label>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto py-3">
            {!newChat &&
              filteredChats.map((conversation) => {
                const onlineMembers = getOnlineGroupUsers(
                  conversation,
                  onlineUsersSet,
                );
                return (
                  <button
                    key={conversation.conversationId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors
                ${selectedConversation?.conversationId === conversation?.conversationId ? "bg-base-300 rounded-lg ring-1 ring-base-300" : ""}
              `}
                  >
                    <div className="relative min-w-12">
                      <PhotoProvider>
                        <PhotoView
                          src={
                            conversation.isgroup
                              ? conversation.groupdetail?.groupIcon.url
                              : conversation?.profilePic?.url
                          }
                        >
                          <img
                            src={
                              conversation.isgroup
                                ? conversation.groupdetail?.groupIcon.url
                                : conversation?.profilePic?.url
                            }
                            className="size-12 object-cover rounded-full"
                          />
                        </PhotoView>
                      </PhotoProvider>
                      {!conversation.isgroup
                        ? onlineUsersSet.has(conversation.oruserId) && (
                            <span
                              className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full"
                            />
                          )
                        : onlineMembers?.length > 0 && (
                            <span
                              className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full"
                            />
                          )}
                    </div>

                    <div className="text-left flex-1 min-w-0">
                      <div className=" flex justify-between items-center">
                        <div className="font-medium text-sm truncate flex-1 min-w-0">
                          {conversation.isgroup
                            ? conversation.groupdetail.groupname
                            : conversation.name}
                        </div>
                        <div
                          className={`rounded-full ${conversation.unseenMsg == 0 || conversation.lastmessage?.sender == authUser._id ? "hidden" : "flex"} justify-center items-center bg-base-300 p-2 text-xs size-3`}
                        >
                          {conversation.lastmessage?.deletedForEveryone
                            ? conversation.unseenMsg - 1
                            : conversation.unseenMsg}
                        </div>
                      </div>
                      <div className="text-xs text-zinc-400 truncate">
                        {Typing.receiverId == conversation.conversationId &&
                        Typing.userId !== authUser._id
                          ? conversation.isgroup
                            ? `${conversation.groupdetail.membersDetail[Typing.userId].fullname} is typing...`
                            : "typing..."
                          : conversation?.lastmessage?.deletedForEveryone
                            ? authUser._id == conversation?.lastmessage?.sender
                              ? "You deleted this message"
                              : "This message was deleted"
                            : conversation.lastmessage?.image
                              ? "Image"
                              : conversation?.lastmessage.deletedFor?.includes(
                                    authUser._id,
                                  )
                                ? ""
                                : conversation?.lastmessage.text || ""}
                      </div>
                    </div>
                  </button>
                );
              })}
            {!newChat && conversations.length === 0 && (
              <div className="text-center text-zinc-500 py-4">
                No any conversations
              </div>
            )}
            {newChat && (
              <div className="flex-1 overflow-y-auto">
                {menuItems.map((item, index) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      setOpen(
                        item.label == "New group"
                          ? "New group"
                          : "Create Channel",
                      )
                    }
                    className="flex items-center gap-4 px-4 py-2 cursor-pointer hover:bg-base-200 mx-3 hover:rounded-lg transition-colors animate-slideIn"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="size-12 bg-primary rounded-full md:h-12 flex items-center justify-center text-primary-content text-base md:text-xl flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="text-lg md:text-base truncate">
                      {item.label}
                    </div>
                  </div>
                ))}
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  <div className="flex gap-2 p-4">
                    <Users />
                    Start Chat with users
                  </div>
                  {filteredUsers.map((user) => (
                    <div
                      onClick={() => setSelectedChat(user._id)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-base-200`}
                    >
                      <div className="avatar relative">
                        <div className="w-12  rounded-full bg-base-300">
                          <img src={user.profilePic.url} />
                        </div>
                        {onlineUsers.includes(user._id) && (
                          <span
                            className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-base md:text-lg font-medium truncate">
                          {user.fullname}
                        </div>
                        <div className="text-sm text-base-content/70 truncate">
                          {user.bio}
                        </div>
                      </div>

                      {!existConversationSet.has(user._id) && (
                        <button
                          onClick={() => handleChatClick(user._id)}
                          className="btn btn-sm btn-primary btn-outline"
                        >
                          Chat
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      {open && (
        <div className={`drawer drawer-end ${open ? "drawer-open" : ""}`}>
          <input
            type="checkbox"
            className="drawer-toggle"
            checked={open}
            readOnly
          />
          <div className="drawer-side z-50">
            <label
              className="drawer-overlay"
              onClick={() => setOpen("")}
            ></label>

            <div className="w-full lg:w-[350px] bg-base-200 border-r border-base-300 flex flex-col">
              <CreateGroup onClose={() => setOpen("")} />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
