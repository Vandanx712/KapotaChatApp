import React, { useEffect, useEffectEvent, useMemo, useState } from "react";
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
import LoadableImage from "./common/LoadableImage";
import SectionLoader from "./common/SectionLoader";
import { mergeUniqueById } from "../lib/utils";

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
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMoreUsersLoading, setIsMoreUsersLoading] = useState(false);
  const [usersCursor, setUsersCursor] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);

  const menuItems = [
    {
      id: 1,
      icon: <UsersRoundIcon />,
      label: "New group",
    }
  ];

  const existConversationSet = useMemo(() => {
    return new Set(
      conversations.filter((con) => !con.isgroup).map((con) => con.oruserId),
    );
  }, [conversations]);

  const loadusers = useEffectEvent(async ({ reset = false, cursor = null } = {}) => {
    try {
      if (reset) {
        setIsUsersLoading(true);
      } else {
        setIsMoreUsersLoading(true);
      }

      const resdata = await getAllUsers({
        cursor,
        limit: 30,
      });

      const nextUsers = resdata.users || [];
      setUsers((prev) => (reset ? nextUsers : mergeUniqueById(prev, nextUsers)));
      setUsersCursor(resdata.nextCursor ?? null);
      setHasMoreUsers(Boolean(resdata.hasMore));
    } catch (error) {
      console.log(error);
    } finally {
      setIsUsersLoading(false);
      setIsMoreUsersLoading(false);
    }
  });

  useEffect(() => {
    if (!newChat) return;

    setUsers([]);
    setUsersCursor(null);
    setHasMoreUsers(false);
    setDebouncedSearch("");
    setSearch("");
    loadusers({ reset: true });
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
    const existingConversation = conversations.find(
      (con) => con.oruserId == id && !con.isgroup,
    );
    if (!existingConversation) return;
    setSelectedConversation(existingConversation);
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
                        {(() => {
                          const imageSrc = conversation.isgroup
                            ? conversation.groupdetail?.groupIcon.url
                            : conversation?.profilePic?.url;

                          return (
                            <PhotoView src={imageSrc}>
                              <div className="size-12 rounded-full">
                                <LoadableImage
                                  src={imageSrc}
                                  alt={
                                    conversation.isgroup
                                      ? conversation.groupdetail.groupname
                                      : conversation.name
                                  }
                                  className="size-12 rounded-full object-cover"
                                  wrapperClassName="size-12 rounded-full"
                                  imgProps={{ loading: "lazy", decoding: "async" }}
                                />
                              </div>
                            </PhotoView>
                          );
                        })()}
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
                  <SectionLoader
                    loading={isUsersLoading}
                    label="Loading users..."
                    minHeight={180}
                  >
                    <>
                      {filteredUsers.map((user) => (
                        <div
                          key={user._id}
                          onClick={() => setSelectedChat(user._id)}
                          className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-base-200"
                        >
                          <div className="avatar relative">
                            <div className="w-12 rounded-full bg-base-300">
                              <LoadableImage
                                src={user.profilePic.url}
                                alt={user.fullname}
                                className="rounded-full object-cover"
                                wrapperClassName="size-12 rounded-full"
                                imgProps={{ loading: "lazy", decoding: "async" }}
                              />
                            </div>
                            {onlineUsers.includes(user._id) && (
                              <span
                                className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-base font-medium md:text-lg">
                              {user.fullname}
                            </div>
                            <div className="truncate text-sm text-base-content/70">
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
                      {hasMoreUsers && (
                        <div className="flex justify-center px-3 py-2">
                          <button
                            type="button"
                            onClick={() =>
                              loadusers({ cursor: usersCursor, reset: false })
                            }
                            disabled={isMoreUsersLoading}
                            className="btn btn-sm btn-outline"
                          >
                            {isMoreUsersLoading
                              ? "Loading..."
                              : "Load more users"}
                          </button>
                        </div>
                      )}
                    </>
                  </SectionLoader>
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
