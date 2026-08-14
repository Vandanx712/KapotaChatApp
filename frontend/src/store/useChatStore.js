import { create } from "zustand";
import toast from "react-hot-toast";
import {
  clearChat,
  createConversation,
  deleteConversation,
  deleteMessage,
  exitGroup,
  getConversations,
  getMessageImgs,
  getMessages,
  getOtherUsers,
  getSurroundUsers,
  reactToMessage as reactToMessageRequest,
  sendMessage,
  updateConBgimage,
  updateGroupDetail,
  updateMembers,
  updateMessage,
} from "../lib/axios";
import { mergeUniqueById } from "../lib/utils";
import { useAuthStore } from "./useAuthStore";

const MESSAGE_PAGE_LIMIT = 30;
const USER_PAGE_LIMIT = 30;
let latestMessageRequestId = 0;

const getReactionTargetPreview = (message) => {
  if (message.deletedForEveryone) return "a deleted message";
  if (message.post?._id) return "a shared post";
  if (message.media?._id || message.media) {
    return message.text?.trim() || "an attachment";
  }
  if (message.image?.url) return message.text?.trim() || "an image";

  const text = message.text?.trim().replace(/\s+/g, " ") || "a message";
  return text.length > 48 ? `${text.slice(0, 45)}...` : text;
};

export const useChatStore = create((set, get) => ({
  message: [],
  mediaImgs: [],
  mediaImgCursor: null,
  hasMoremediaImgs: null,
  messageCursor: null,
  isMediaImgLoading: null,
  hasMoreMessages: false,
  users: [],
  surroundingUsersCursor: null,
  hasMoreSurroundingUsers: false,
  otherUsers: [],
  otherUsersCursor: null,
  hasMoreOtherUsers: false,
  conversations: [],
  selectedUser: null,
  selectedConversation: null,
  replyingTo: null,
  isUsersLoading: false,
  isMoreSurroundingUsersLoading: false,
  isConversationLoading: false,
  isMessageLoading: false,
  isMoreMessagesLoading: false,
  isOtherUsersLoading: false,
  isMoreOtherUsersLoading: false,
  showInfo: false,

  getConversation: async () => {
    set({ isConversationLoading: true });
    try {
      const resdata = await getConversations();
      set({ conversations: resdata.filtered });
    } catch (error) {
      toast.error(error.response?.data.message);
    } finally {
      set({ isConversationLoading: false });
    }
  },

  getMessage: async () => {
    const { selectedConversation } = get();
    if (!selectedConversation?.conversationId) return;
    const conversationId = selectedConversation.conversationId;
    const requestId = ++latestMessageRequestId;

    set({
      isMessageLoading: true,
      isMoreMessagesLoading: false,
      message: [],
      messageCursor: null,
      hasMoreMessages: false,
    });

    const authUser = useAuthStore.getState().authUser;
    try {
      const resdata = await getMessages(conversationId, {
        limit: MESSAGE_PAGE_LIMIT,
      });
      if (
        requestId !== latestMessageRequestId ||
        get().selectedConversation?.conversationId !== conversationId
      ) {
        return;
      }

      const updatedMessages = resdata.messages.map((msg) => {
        if (msg.system) return msg;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          return {
            ...msg,
            seenBy: Array.from(new Set([...(msg.seenBy || []), authUser._id])),
          };
        }
        return msg;
      });

      set((state) => ({
        message: mergeUniqueById(updatedMessages, state.message),
        messageCursor: resdata.nextCursor ?? null,
        hasMoreMessages: Boolean(resdata.hasMore),
      }));

      const socket = useAuthStore.getState().socket;
      resdata.messages.forEach((msg) => {
        if (msg.system) return;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          socket?.emit("msgseen", {
            msgId: msg._id,
            senderId: msg.sender,
          });
        }
      });
    } catch (error) {
      if (
        requestId === latestMessageRequestId &&
        get().selectedConversation?.conversationId === conversationId
      ) {
        toast.error(error.response?.data.message);
      }
    } finally {
      if (
        requestId === latestMessageRequestId &&
        get().selectedConversation?.conversationId === conversationId
      ) {
        set({ isMessageLoading: false });
      }
    }
  },

  getImgMessages: async () => {
    const {
      selectedConversation,
      mediaImgCursor,
      hasMoremediaImgs,
      isMediaImgLoading,
    } = get();

    if (!selectedConversation?.conversationId || isMediaImgLoading) return;

    if (mediaImgCursor === null && hasMoremediaImgs === false) return;

    set({ isMediaImgLoading: true });

    try {
      const resdata = await getMessageImgs(
        selectedConversation.conversationId,
        {
          cursor: mediaImgCursor,
          limit: 5,
        },
      );

      const imageUrls = resdata.messages
        .map((msg) => msg.media || msg.image)
        .filter(Boolean);

      set((state) => ({
        mediaImgs: [...imageUrls, ...state.mediaImgs],
        mediaImgCursor: resdata.nextCursor ?? null,
        hasMoremediaImgs: Boolean(resdata.hasMore),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isMediaImgLoading: false });
    }
  },

  resetImgMessages: () =>
    set({
      mediaImgs: [],
      mediaImgCursor: null,
      hasMoremediaImgs: null,
      isMediaImgLoading: false,
    }),

  loadOlderMessages: async () => {
    const {
      selectedConversation,
      messageCursor,
      hasMoreMessages,
      isMoreMessagesLoading,
    } = get();
    if (
      !selectedConversation?.conversationId ||
      !messageCursor ||
      !hasMoreMessages ||
      isMoreMessagesLoading
    ) {
      return false;
    }

    const conversationId = selectedConversation.conversationId;
    const requestId = latestMessageRequestId;
    set({ isMoreMessagesLoading: true });
    const authUser = useAuthStore.getState().authUser;

    try {
      const resdata = await getMessages(conversationId, {
        cursor: messageCursor,
        limit: MESSAGE_PAGE_LIMIT,
      });
      if (
        requestId !== latestMessageRequestId ||
        get().selectedConversation?.conversationId !== conversationId
      ) {
        return false;
      }

      const updatedMessages = resdata.messages.map((msg) => {
        if (msg.system) return msg;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          return {
            ...msg,
            seenBy: Array.from(new Set([...(msg.seenBy || []), authUser._id])),
          };
        }
        return msg;
      });

      set((state) => ({
        message: mergeUniqueById(updatedMessages, state.message),
        messageCursor: resdata.nextCursor ?? null,
        hasMoreMessages: Boolean(resdata.hasMore),
      }));

      const socket = useAuthStore.getState().socket;
      resdata.messages.forEach((msg) => {
        if (msg.system) return;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          socket?.emit("msgseen", {
            msgId: msg._id,
            senderId: msg.sender,
          });
        }
      });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message);
      return false;
    } finally {
      if (get().selectedConversation?.conversationId === conversationId) {
        set({ isMoreMessagesLoading: false });
      }
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    if (!selectedConversation?.conversationId) return false;
    const conversationId = selectedConversation.conversationId;

    try {
      const resdata = await sendMessage(
        conversationId,
        messageData,
      );
      if (get().selectedConversation?.conversationId === conversationId) {
        set((state) => ({
          message: mergeUniqueById(state.message, [resdata.newMessage]),
        }));
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      return false;
    }
  },

  onlineToMessage: (newmsg) => {
    const { selectedConversation } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedConversation) return;
    if (newmsg.conversationId != selectedConversation.conversationId) return;
    if (newmsg.sender == authUser._id) return;

    set((state) => ({
      message: mergeUniqueById(state.message, [newmsg]),
    }));
  },

  offlineToMessage: (handler) => {
    const socket = useAuthStore.getState().socket;
    if (!socket || !handler) return;
    socket.off("newmessage", handler);
  },

  setIsTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    if (!socket?.connected || !selectedConversation?.conversationId) return;
    socket.emit("istyping", {
      receiverId: selectedConversation.conversationId,
    });
  },

  setStopTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    if (!socket?.connected || !selectedConversation?.conversationId) return;
    socket.emit("StopTyping", {
      receiverId: selectedConversation.conversationId,
    });
  },

  setMsgSeen: (payload) => {
    const msgId = typeof payload === "string" ? payload : payload?.msgId;
    if (!msgId) return;
    const userId = typeof payload === "object" ? payload?.userId : null;
    const seenBy = typeof payload === "object" ? payload?.seenBy : null;
    const isSeen = typeof payload === "object" ? payload?.isSeen : null;
    set((state) => ({
      message: state.message.map((msg) =>
        msg._id == msgId
          ? {
            ...msg,
            seenBy: seenBy
              ? seenBy
              : userId
                ? Array.from(new Set([...(msg.seenBy || []), userId]))
                : msg.seenBy,
            isSeen: typeof isSeen === "boolean" ? isSeen : msg.isSeen,
          }
          : msg,
      ),
    }));
  },

  setNmsgInCon: (newMessage) => {
    const authUser = useAuthStore.getState().authUser;
    set((state) => {
      const index = state.conversations.findIndex(
        (con) => con.conversationId === newMessage.conversationId,
      );
      if (index === -1) return state;
      const updatedConversations = [...state.conversations];
      const [targetCon] = updatedConversations.splice(index, 1);
      const isOwnMessage = newMessage.sender == authUser._id;
      const isSystem = newMessage.system == true;
      const selectedConId = state.selectedConversation?.conversationId;
      const isOpenConversation = selectedConId === newMessage.conversationId;
      let nextUnseen = targetCon?.unseenMsg || 0;
      if (isSystem) {
        nextUnseen = 0;
      } else {
        nextUnseen = isOwnMessage || isOpenConversation ? 0 : nextUnseen + 1;
      }
      const updatedTargetCon = {
        ...targetCon,
        lastmessage: newMessage,
        reactionPreview: null,
        unseenMsg: nextUnseen,
      };
      updatedConversations.unshift(updatedTargetCon);
      return { conversations: updatedConversations };
    });
  },

  setSelectedConversation: (selectedConversation) => {
    set((state) => ({
      selectedConversation,
      replyingTo: null,
      conversations: state.conversations.map((con) =>
        con.conversationId === selectedConversation.conversationId
          ? { ...con, unseenMsg: 0 }
          : con,
      ),
    }));
  },

  setUnselectedConversation: (selectedConversation) => {
    latestMessageRequestId += 1;
    set({
      selectedConversation,
      isMessageLoading: false,
      isMoreMessagesLoading: false,
      showInfo: false,
      replyingTo: null,
    });
  },

  setReplyingTo: (message) => {
    if (!message || message.system || message.deletedForEveryone) return;
    set({ replyingTo: message });
  },

  clearReplyingTo: () => set({ replyingTo: null }),

  getSurroundingUsers: async () => {
    try {
      set({
        isUsersLoading: true,
        isMoreSurroundingUsersLoading: false,
        users: [],
        surroundingUsersCursor: null,
        hasMoreSurroundingUsers: false,
      });

      const resdata = await getSurroundUsers({ limit: USER_PAGE_LIMIT });
      set({
        users: resdata.users || resdata.filtered || [],
        surroundingUsersCursor: resdata.nextCursor ?? null,
        hasMoreSurroundingUsers: Boolean(resdata.hasMore),
      });
    } catch (error) {
      console.log(error);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  loadMoreSurroundingUsers: async () => {
    const {
      surroundingUsersCursor,
      hasMoreSurroundingUsers,
      isUsersLoading,
      isMoreSurroundingUsersLoading,
    } = get();

    if (
      !surroundingUsersCursor ||
      !hasMoreSurroundingUsers ||
      isUsersLoading ||
      isMoreSurroundingUsersLoading
    ) {
      return;
    }

    set({ isMoreSurroundingUsersLoading: true });

    try {
      const resdata = await getSurroundUsers({
        cursor: surroundingUsersCursor,
        limit: USER_PAGE_LIMIT,
      });

      set((state) => ({
        users: mergeUniqueById(
          state.users,
          resdata.users || resdata.filtered || [],
        ),
        surroundingUsersCursor: resdata.nextCursor ?? null,
        hasMoreSurroundingUsers: Boolean(resdata.hasMore),
      }));
    } catch (error) {
      console.log(error);
    } finally {
      set({ isMoreSurroundingUsersLoading: false });
    }
  },

  creteConversation: async (id) => {
    try {
      const resdata = await createConversation(id);
      toast.success(resdata.message);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  },

  setConBgimage: async (data) => {
    const socket = useAuthStore.getState().socket;
    const { selectedConversation } = get();
    try {
      const resdata = await updateConBgimage(data);
      toast.success(resdata.message);
      socket.emit("changeBgimage", {
        conversation: selectedConversation,
        bgImage: resdata.bgimage,
      });
    } catch (error) {
      toast.error(error.response.data.message);
      console.log(error);
    }
  },

  conBgimage: (id, image) => {
    set((state) => {
      const selectedConversation =
        state.selectedConversation?.conversationId == id
          ? {
            ...state.selectedConversation,
            bgImage: image,
          }
          : state.selectedConversation;

      return {
        selectedConversation,
        conversations: state.conversations.map((conversation) =>
          conversation.conversationId == id
            ? {
              ...conversation,
              bgImage: image,
            }
            : conversation,
        ),
      };
    });
  },

  messageUpdate: async (id, data) => {
    try {
      const response = await updateMessage(id, data);
      if (response.updatedMessage) {
        get().setMessageUpdated(response.updatedMessage);
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update message");
      console.log(error);
      return false;
    }
  },

  reactToMessage: async (id, emoji) => {
    const conversationId = get().selectedConversation?.conversationId;
    if (!conversationId) return false;

    try {
      const response = await reactToMessageRequest(id, { conversationId, emoji });
      if (response.updatedMessage) {
        get().setMessageReaction(response.updatedMessage);
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update reaction");
      return false;
    }
  },

  setMessageUpdated: (message) => {
    if (!message?._id) return;
    set((state) => ({
      message: state.message.map((current) =>
        current._id === message._id ? { ...current, ...message } : current,
      ),
      conversations: state.conversations.map((conversation) => {
        if (
          conversation.conversationId?.toString?.() !==
          message.conversationId?.toString?.()
        ) {
          return conversation;
        }

        return {
          ...conversation,
          lastmessage:
            conversation.lastmessage?._id === message._id
              ? { ...conversation.lastmessage, ...message }
              : conversation.lastmessage,
          reactionPreview:
            conversation.reactionPreview?.messageId === message._id
              ? null
              : conversation.reactionPreview,
        };
      }),
    }));
  },

  setMessageReaction: (message) => {
    if (!message?._id) return;
    const authUser = useAuthStore.getState().authUser;

    set((state) => ({
      message: state.message.map((current) =>
        current._id === message._id
          ? {
            ...current,
            reactions: message.reactions || [],
            reacted: message.reacted || "",
          }
          : current,
      ),
      conversations: state.conversations.map((conversation) => {
        if (conversation.conversationId?.toString?.() !== message.conversationId?.toString?.()) {
          return conversation;
        }

        if (message.reaction?.action === "removed") {
          return conversation.reactionPreview?.messageId === message._id &&
            conversation.reactionPreview?.actorId ===
              message.reaction?.userId?.toString?.()
            ? { ...conversation, reactionPreview: null }
            : conversation;
        }

        const actorId = message.reaction?.userId?.toString?.();
        const actorName =
          actorId === authUser?._id?.toString?.()
            ? "You"
            : conversation.isgroup
              ? conversation.groupdetail?.membersDetail?.[actorId]?.fullname || "Someone"
              : conversation.name || "Someone";
        const emoji = message.reaction?.emoji;
        if (!emoji) return conversation;

        return {
          ...conversation,
          reactionPreview: {
            messageId: message._id,
            actorId,
            text: `${actorName} reacted ${emoji} to '${getReactionTargetPreview(message)}'`,
          },
        };
      }),
    }));
  },

  setReplyTargetDeleted: ({ conversationId, messageId }) => {
    if (!conversationId || !messageId) return;
    set((state) => ({
      replyingTo:
        state.replyingTo?._id?.toString?.() === messageId.toString()
          ? null
          : state.replyingTo,
      message:
        state.selectedConversation?.conversationId === conversationId
          ? state.message.map((message) =>
            message.replyTo?.messageId?.toString?.() === messageId.toString()
              ? {
                ...message,
                replyTo: {
                  ...message.replyTo,
                  preview: "This message was deleted",
                  deleted: true,
                },
              }
              : message,
          )
          : state.message,
    }));
  },

  messageDelete: async (id, data) => {
    try {
      await deleteMessage(id, data);
    } catch (error) {
      toast.error(error.response?.data.message);
      console.log(error);
    }
  },

  setDeletedMessage: (message) => {
    const authUser = useAuthStore.getState().authUser;
    set((state) => {
      if (message.deletedForEveryone) {
        return {
          message: state.message.map((msg) =>
            msg?._id === message?._id &&
              !message.deletedFor.includes(authUser._id)
              ? {
                ...msg,
                text:
                  authUser._id == message.sender
                    ? "You deleted this message"
                    : "This message was deleted",
                reacted: message.reacted,
                reactions: message.reactions || [],
                image: message.image,
                media: message.media,
              }
              : msg,
          ),
        };
      }
      if (message.deletedFor.includes(authUser._id)) {
        return {
          message: state.message.filter((msg) => msg?._id !== message?._id),
        };
      }
      return state;
    });
  },

  setDeletedMessageForSlider: (message) => {
    const authUser = useAuthStore.getState().authUser;
    set((state) => ({
      conversations: state.conversations.map((con) => {
        if (
          con.conversationId == message.conversationId &&
          message.deletedForEveryone
        ) {
          const wasUnseen =
            message.sender != authUser._id &&
            !(message.seenBy || []).some(
              (userId) => userId?.toString?.() === authUser._id?.toString?.(),
            );

          return {
            ...con,
            reactionPreview:
              con.reactionPreview?.messageId === message._id
                ? null
                : con.reactionPreview,
            lastmessage: {
              ...con.lastmessage,
              text:
                authUser._id == message.sender
                  ? "You deleted this message"
                  : "This message was deleted",
              reacted: message.reacted,
              reactions: message.reactions || [],
              image: message.image,
              media: message.media,
            },
            unseenMsg: wasUnseen
              ? Math.max(0, (con.unseenMsg || 0) - 1)
              : con.unseenMsg || 0,
          };
        } else return con;
      }),
    }));
  },

  clearAllMsg: async (id) => {
    try {
      const resdata = await clearChat(id);
      get().setClearChat({ _id: id });
      toast.success(resdata.message);
      return true;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to clear chat");
      return false;
    }
  },

  setClearChat: (conversation) => {
    const conversationId = conversation?._id || conversation?.conversationId;
    if (!conversationId) return;

    set((state) => {
      const isSelected =
        state.selectedConversation?.conversationId == conversationId;

      return {
        conversations: state.conversations.map((con) =>
          con.conversationId == conversationId
            ? {
              ...con,
              reactionPreview: null,
              lastmessage: con.lastmessage
                ? {
                  ...con.lastmessage,
                  text: "",
                  image: null,
                  post: null,
                }
                : con.lastmessage,
              unseenMsg: 0,
            }
            : con,
        ),
        ...(isSelected
          ? {
            message: [],
            messageCursor: null,
            hasMoreMessages: false,
            replyingTo: null,
          }
          : {}),
      };
    });
  },

  setShowInfo: (value) => {
    set((state) => ({ showInfo: typeof value === "boolean" ? value : !state.showInfo }));
  },

  setDeleteChat: async (id) => {
    try {
      const resdata = await deleteConversation(id);
      toast.success(resdata.message);
      latestMessageRequestId += 1;
      set({
        selectedConversation: null,
        isMessageLoading: false,
        isMoreMessagesLoading: false,
        showInfo: false,
      });
      return true;
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data.message);
      return false;
    }
  },

  setGroupUpdation: (conversation) => {
    set((state) => {
      const updatedGroup = {
        groupname: conversation.groupname,
        groupIcon: conversation.groupIcon,
      };

      return {
        conversations: state.conversations.map((con) =>
          con.conversationId === conversation._id
            ? {
              ...con,
              groupdetail: { ...con.groupdetail, ...updatedGroup },
            }
            : con,
        ),

        selectedConversation:
          state.selectedConversation?.conversationId === conversation._id
            ? {
              ...state.selectedConversation,
              groupdetail: {
                ...state.selectedConversation.groupdetail,
                ...updatedGroup,
              },
            }
            : state.selectedConversation,
      };
    });
  },

  udGroupDetail: async (data) => {
    try {
      const resdata = await updateGroupDetail(data);
      toast.success(resdata.message);
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data.message);
    }
  },

  setOtherUsers: async (id) => {
    set({
      isOtherUsersLoading: true,
      isMoreOtherUsersLoading: false,
      otherUsers: [],
      otherUsersCursor: null,
      hasMoreOtherUsers: false,
    });
    try {
      const resdata = await getOtherUsers(id, { limit: USER_PAGE_LIMIT });
      set({
        otherUsers: resdata.users || resdata.filtered || [],
        otherUsersCursor: resdata.nextCursor ?? null,
        hasMoreOtherUsers: Boolean(resdata.hasMore),
      });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    } finally {
      set({ isOtherUsersLoading: false });
    }
  },

  loadMoreOtherUsers: async (id) => {
    const {
      otherUsersCursor,
      hasMoreOtherUsers,
      isOtherUsersLoading,
      isMoreOtherUsersLoading,
    } = get();

    if (
      !id ||
      !otherUsersCursor ||
      !hasMoreOtherUsers ||
      isOtherUsersLoading ||
      isMoreOtherUsersLoading
    ) {
      return;
    }

    set({ isMoreOtherUsersLoading: true });

    try {
      const resdata = await getOtherUsers(id, {
        cursor: otherUsersCursor,
        limit: USER_PAGE_LIMIT,
      });

      set((state) => ({
        otherUsers: mergeUniqueById(
          state.otherUsers,
          resdata.users || resdata.filtered || [],
        ),
        otherUsersCursor: resdata.nextCursor ?? null,
        hasMoreOtherUsers: Boolean(resdata.hasMore),
      }));
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message);
    } finally {
      set({ isMoreOtherUsersLoading: false });
    }
  },

  upGroupMember: async (data) => {
    try {
      const resdata = await updateMembers(data);
      toast.success(resdata.message);
    } catch (error) {
      console.log(error);
    }
  },

  ExitGroup: async (id) => {
    try {
      const resdata = await exitGroup(id);
      toast.success(resdata.message);
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message);
    }
  },

  refreshGroupMember: (type, conversation) => {
    set((state) => {
      let conversations = [...state.conversations];
      let selectedConversation = state.selectedConversation;

      const getId = (con) =>
        con?.conversationId?.toString?.() ??
        con?.conversationId ??
        con?._id?.toString?.() ??
        con?._id;

      const incomingId = getId(conversation);

      switch (type) {
        case "NEW_CONVERSATION": {
          if (!incomingId) break;
          const existingIndex = conversations.findIndex(
            (con) => getId(con) === incomingId,
          );
          const normalizedConversation = conversation?.conversationId
            ? conversation
            : { ...conversation, conversationId: incomingId };
          if (existingIndex !== -1) {
            const existing = conversations[existingIndex];
            conversations.splice(existingIndex, 1);
            conversations.unshift({ ...existing, ...normalizedConversation });
          } else {
            conversations = [normalizedConversation, ...conversations];
          }
          break;
        }

        case "UPDATE_MEMBERS": {
          if (!incomingId) break;
          conversations = conversations.map((con) =>
            getId(con) === incomingId
              ? {
                ...con,
                groupdetail: conversation.groupdetail ?? con.groupdetail,
              }
              : con,
          );

          if (
            selectedConversation &&
            getId(selectedConversation) === incomingId
          ) {
            selectedConversation = {
              ...selectedConversation,
              groupdetail:
                conversation.groupdetail ?? selectedConversation.groupdetail,
            };
          }
          break;
        }

        case "DELETE_CONVERSATION":
        case "EXIT_GROUP": {
          if (!incomingId) break;
          conversations = conversations.filter(
            (con) => getId(con) !== incomingId,
          );

          if (
            selectedConversation &&
            getId(selectedConversation) === incomingId
          ) {
            selectedConversation = null;
          }
          break;
        }
      }
      return { conversations, selectedConversation };
    });
  },
}));
