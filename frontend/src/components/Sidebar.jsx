import { useEffect, useCallback, useMemo, useState } from "react";
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
import SectionLoader from "./common/SectionLoader";
import { mergeUniqueById, cn } from "../lib/utils";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  SegmentedControl,
} from "./ui";

function Sidebar() {
  const {
    getConversation,
    conversations,
    setSelectedConversation,
    selectedConversation,
    isConversationLoading,
    setNmsgInCon,
    setMessageReaction,
    setMessageUpdated,
    setReplyTargetDeleted,
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

  const loadusers = useCallback(async ({ reset = false, cursor = null } = {}) => {

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
  }, []);

  useEffect(() => {
    if (!newChat) return;

    setUsers([]);
    setUsersCursor(null);
    setHasMoreUsers(false);
    setDebouncedSearch("");
    setSearch("");
    loadusers({ reset: true });
  }, [newChat, loadusers]);

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
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      setNmsgInCon(newMessage);
    };

    const handleTyping = (payload) => {
      setTyping(payload);
    };

    const handleStopTyping = (payload) => {
      setTyping((prev) =>
        prev?.receiverId === payload?.receiverId &&
          prev?.userId === payload?.userId
          ? ""
          : prev,
      );
    };

    const handleReaction = (message) => setMessageReaction(message);
    const handleMessageUpdated = (message) => setMessageUpdated(message);
    const handleReplyTargetDeleted = (payload) => setReplyTargetDeleted(payload);

    const handleDelete = (msg) => {
      setDeletedMessageForSlider(msg);
    };

    const handleGroupDetail = (conversation) => {
      setGroupUpdation(conversation);
    };

    const handleRefresh = (type, conversation) => {
      refreshGroupMember(type, conversation);
    };

    socket.on("newmessage", handleNewMessage);
    socket.on("istyping", handleTyping);
    socket.on("StopTyping", handleStopTyping);
    socket.on("messageReaction", handleReaction);
    socket.on("messageUpdated", handleMessageUpdated);
    socket.on("replyTargetDeleted", handleReplyTargetDeleted);
    socket.on("delete", handleDelete);
    socket.on("udGroupDetail", handleGroupDetail);
    socket.on("refresh", handleRefresh);

    return () => {
      socket.off("newmessage", handleNewMessage);
      socket.off("istyping", handleTyping);
      socket.off("StopTyping", handleStopTyping);
      socket.off("messageReaction", handleReaction);
      socket.off("messageUpdated", handleMessageUpdated);
      socket.off("replyTargetDeleted", handleReplyTargetDeleted);
      socket.off("delete", handleDelete);
      socket.off("udGroupDetail", handleGroupDetail);
      socket.off("refresh", handleRefresh);
    };
  }, [
    socket,
    setNmsgInCon,
    setMessageReaction,
    setMessageUpdated,
    setReplyTargetDeleted,
    setDeletedMessageForSlider,
    setGroupUpdation,
    refreshGroupMember,
  ]);

  const handleChatClick = (id) => {
    creteConversation(id);
    setNewChat(false);
  };

  const onlineUsersSet = new Set(onlineUsers);

  const getOnlineGroupUsers = (conversation, onlineUsersSet) => {
    if (!conversation.isgroup) return [];
    return Object.entries(
      conversation.groupdetail?.membersDetail || {},
    ).filter(
      ([id]) => id !== authUser._id && onlineUsersSet.has(id),
    );
  };

  const filteredChats = conversations.filter((chat) => {
    const name = chat.isgroup ? chat.groupdetail?.groupname : chat.name;

    return (name || "").toLowerCase().includes(debouncedSearch.toLowerCase());
  });

  const filteredUsers = users.filter((user) => {
    return (user.fullname || "")
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
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
      className={cn(
        "flex h-full w-full shrink-0 flex-col border-r border-line bg-surface lg:w-[360px]",
        selectedConversation ? "hidden lg:flex" : "",
      )}
    >
      {!open ? (
        <>
          <header className="shrink-0 border-b border-line px-4 pb-4 pt-5">
            <div className="flex h-9 items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-ink">
                  {newChat ? "New conversation" : "Chats"}
                </h1>
                <p className="mt-0.5 text-xs text-muted">
                  {newChat ? "Find someone to message" : `${conversations.length} conversations`}
                </p>
              </div>
              <Button
                iconOnly
                variant="ghost"
                aria-label="Start a new chat"
                onClick={() => setNewChat(true)}
              >
                <MessageCirclePlusIcon className="size-5" />
              </Button>
            </div>

            <SegmentedControl
              className="mt-5 grid w-full grid-cols-2"
              value={newChat ? "new" : "chats"}
              onChange={(value) => setNewChat(value === "new")}
              options={[
                { value: "chats", label: "Recent", icon: <Users className="size-4" /> },
                { value: "new", label: "New chat", icon: <MessageSquarePlusIcon className="size-4" /> },
              ]}
            />

            <div className="mt-3">
              <Input
                icon={Search}
                type="search"
                value={search}
                placeholder={newChat ? "Search people" : "Search conversations"}
                onChange={(event) => setSearch(event.target.value)}
                aria-label={newChat ? "Search people" : "Search conversations"}
              />
            </div>
          </header>

          <div className="ui-scrollbar min-h-0 flex-1 overflow-y-auto py-2">
            {!newChat &&
              filteredChats.map((conversation) => {
                const onlineMembers = getOnlineGroupUsers(
                  conversation,
                  onlineUsersSet,
                );
                const unseenCount = Math.max(0, conversation.unseenMsg || 0);
                const reactionPreview = conversation.reactionPreview?.text;
                return (
                  <button
                    key={conversation.conversationId}
                    onClick={() => setSelectedConversation(conversation)}
                    className={cn(
                      "group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left transition",
                      selectedConversation?.conversationId === conversation?.conversationId
                        ? "border-brand bg-brand-soft"
                        : "border-transparent hover:bg-surface-hover",
                    )}
                  >
                    <div className="relative shrink-0">
                      <PhotoProvider>
                        {(() => {
                          const imageSrc = conversation.isgroup
                            ? conversation.groupdetail?.groupIcon?.url
                            : conversation?.profilePic?.url;

                          return (
                            <PhotoView src={imageSrc}>
                              <Avatar
                                src={imageSrc}
                                alt={conversation.isgroup ? conversation.groupdetail?.groupname : conversation.name || "Conversation"}
                                size="lg"
                              />
                            </PhotoView>
                          );
                        })()}
                      </PhotoProvider>
                      {!conversation.isgroup
                        ? onlineUsersSet.has(conversation.oruserId) && (
                          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success" />
                        )
                        : onlineMembers?.length > 0 && (
                          <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-success" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1 py-1.5 group-last:border-transparent">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                          {conversation.isgroup
                            ? conversation.groupdetail?.groupname || "Group"
                            : conversation.name || "Conversation"}
                        </div>
                        {unseenCount > 0 && conversation.lastmessage?.sender != authUser._id && (
                          <Badge variant="brand" className="h-5 min-w-5 justify-center border-0 px-1.5">
                            {unseenCount}
                          </Badge>
                        )}
                      </div>
                      <div className={cn(
                        "mt-1 truncate text-xs",
                        Typing.receiverId == conversation.conversationId && Typing.userId !== authUser._id
                          ? "font-medium text-brand-strong"
                          : reactionPreview
                            ? "font-medium text-muted"
                          : "text-muted",
                      )}>
                        {Typing.receiverId == conversation.conversationId &&
                          Typing.userId !== authUser._id
                          ? conversation.isgroup
                            ? `${conversation.groupdetail?.membersDetail?.[Typing.userId]?.fullname || "Someone"} is typing...`
                            : "typing..."
                          : reactionPreview || (conversation?.lastmessage?.deletedForEveryone
                            ? authUser._id == conversation?.lastmessage?.sender
                              ? "You deleted this message"
                              : "This message was deleted"
                            : conversation.lastmessage?.image
                              ? "Image"
                              : conversation?.lastmessage?.deletedFor?.includes(
                                authUser._id,
                              )
                                ? ""
                                : conversation?.lastmessage.text || "")}
                      </div>
                    </div>
                  </button>
                );
              })}
            {!newChat && conversations.length === 0 && (
              <EmptyState
                icon={MessageSquarePlusIcon}
                title="No conversations yet"
                description="Start a new chat and your recent messages will appear here."
                action={<Button variant="primary" size="sm" onClick={() => setNewChat(true)}>Start a chat</Button>}
              />
            )}
            {newChat && (
              <div className="flex-1">
                {menuItems.map((item, index) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      setOpen(
                        item.label == "New group"
                          ? "New group"
                          : "Create Channel",
                      )
                    }
                    className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-control px-3 py-3 text-left transition hover:bg-surface-hover"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand text-on-brand">
                      {item.icon}
                    </div>
                    <div className="truncate text-sm font-semibold">
                      {item.label}
                    </div>
                  </button>
                ))}
                <div className="flex-1 p-2">
                  <div className="flex items-center gap-2 px-3 py-3 text-xs font-semibold uppercase text-subtle">
                    <Users className="size-4" />
                    People on Kapota
                  </div>
                  <SectionLoader
                    loading={isUsersLoading}
                    label="Loading users..."
                    minHeight={180}
                  >
                    <>
                      {filteredUsers.map((user) => (
                        <button
                          type="button"
                          key={user._id}
                          onClick={() => existConversationSet.has(user._id)
                            ? setSelectedChat(user._id)
                            : handleChatClick(user._id)
                          }
                          className="flex w-full items-center gap-3 rounded-control p-3 text-left transition hover:bg-surface-hover"
                        >
                          <Avatar
                            src={user.profilePic?.url}
                            alt={user.fullname}
                            size="lg"
                            status={onlineUsers.includes(user._id) ? "online" : undefined}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-ink">
                              {user.fullname}
                            </div>
                            <div className="mt-0.5 truncate text-xs text-muted">
                              {user.bio}
                            </div>
                          </div>

                          {!existConversationSet.has(user._id) && (
                            <span className="text-xs font-semibold text-brand-strong">
                              Chat
                            </span>
                          )}
                        </button>
                      ))}
                      {hasMoreUsers && (
                        <div className="flex justify-center px-3 py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              loadusers({ cursor: usersCursor, reset: false })
                            }
                            loading={isMoreUsersLoading}
                          >
                            Load more people
                          </Button>
                        </div>
                      )}
                    </>
                  </SectionLoader>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="h-full bg-surface animate-slide-in-right">
          <CreateGroup onClose={() => setOpen("")} />
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
