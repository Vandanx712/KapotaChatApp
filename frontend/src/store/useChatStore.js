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

export const useChatStore = create((set, get) => ({
  message: [],
<<<<<<< HEAD
  messageCursor: null,
=======
<<<<<<< HEAD
  mediaImgs: [],
  mediaImgCursor: null,
  hasMoremediaImgs: null,
  messageCursor: null,
  isMediaImgLoading: null,
=======
  messageCursor: null,
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
>>>>>>> aee32a26c10e2c6e2a2d7cc35e8c7e0620636a9c
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

    set({
      isMessageLoading: true,
      isMoreMessagesLoading: false,
      message: [],
      messageCursor: null,
      hasMoreMessages: false,
    });

    const authUser = useAuthStore.getState().authUser;
    try {
      const resdata = await getMessages(selectedConversation.conversationId, {
        limit: MESSAGE_PAGE_LIMIT,
      });
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
      set({
        message: updatedMessages,
        messageCursor: resdata.nextCursor ?? null,
        hasMoreMessages: Boolean(resdata.hasMore),
      });
      resdata.messages.forEach((msg) => {
        if (msg.system) return;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          const socket = useAuthStore.getState().socket;
          socket.emit("msgseen", {
            msgId: msg._id,
            senderId: msg.sender,
          });
        }
      });
    } catch (error) {
      toast.error(error.response?.data.message);
    } finally {
      set({ isMessageLoading: false });
    }
  },

<<<<<<< HEAD
  loadOlderMessages: async () => {
    const { selectedConversation, messageCursor, hasMoreMessages, isMoreMessagesLoading } =
      get();
=======
<<<<<<< HEAD
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
    const authUser = useAuthStore.getState().authUser;

    try {
      const resdata = await getMessageImgs(
        selectedConversation.conversationId,
        {
          cursor: mediaImgCursor,
          limit: 5,
        },
      );

      const imageUrls = resdata.messages.map((msg) => msg.image);

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
=======
  loadOlderMessages: async () => {
    const { selectedConversation, messageCursor, hasMoreMessages, isMoreMessagesLoading } =
      get();
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
>>>>>>> aee32a26c10e2c6e2a2d7cc35e8c7e0620636a9c
    if (
      !selectedConversation?.conversationId ||
      !messageCursor ||
      !hasMoreMessages ||
      isMoreMessagesLoading
    ) {
      return;
    }

    set({ isMoreMessagesLoading: true });
    const authUser = useAuthStore.getState().authUser;

    try {
      const resdata = await getMessages(selectedConversation.conversationId, {
        cursor: messageCursor,
        limit: MESSAGE_PAGE_LIMIT,
      });

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
<<<<<<< HEAD
        message: mergeUniqueById(updatedMessages, state.message),
=======
<<<<<<< HEAD
        message: [...updatedMessages, ...state.message],
=======
        message: mergeUniqueById(updatedMessages, state.message),
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
>>>>>>> aee32a26c10e2c6e2a2d7cc35e8c7e0620636a9c
        messageCursor: resdata.nextCursor ?? null,
        hasMoreMessages: Boolean(resdata.hasMore),
      }));

      resdata.messages.forEach((msg) => {
        if (msg.system) return;
        const hasSeen =
          Array.isArray(msg.seenBy) && msg.seenBy.includes(authUser._id);
        if (msg.sender !== authUser._id && !hasSeen) {
          const socket = useAuthStore.getState().socket;
          socket.emit("msgseen", {
            msgId: msg._id,
            senderId: msg.sender,
          });
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      set({ isMoreMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation } = get();
    try {
      const resdata = await sendMessage(
        selectedConversation.conversationId,
        messageData,
      );
      set((state) => ({
        message: [...state.message, resdata.newMessage],
      }));
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  onlineToMessage: (newmsg) => {
    const { selectedConversation } = get();
    const authUser = useAuthStore.getState().authUser;
    if (!selectedConversation) return;
    if (
      newmsg.conversationId == selectedConversation.conversationId &&
      newmsg.sender == authUser._id
    )
      return;
    set((state) => ({
      message: [...state.message, newmsg],
    }));
  },

  offlineToMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newmessage");
  },

  setIsTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("istyping", {
      receiverId: selectedConversation.conversationId,
    });
  },

  setStopTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
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
        unseenMsg: nextUnseen,
      };
      updatedConversations.unshift(updatedTargetCon);
      return { conversations: updatedConversations };
    });
  },

  setSelectedConversation: (selectedConversation) => {
    set((state) => ({
      selectedConversation,
      conversations: state.conversations.map((con) =>
        con.conversationId === selectedConversation.conversationId
          ? { ...con, unseenMsg: 0 }
          : con,
      ),
    }));
  },

  setUnselectedConversation: (selectedConversation) => {
    set({ selectedConversation });
  },

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
<<<<<<< HEAD
        users: mergeUniqueById(state.users, resdata.users || resdata.filtered || []),
=======
<<<<<<< HEAD
        users: mergeUniqueById(
          state.users,
          resdata.users || resdata.filtered || [],
        ),
=======
        users: mergeUniqueById(state.users, resdata.users || resdata.filtered || []),
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
>>>>>>> aee32a26c10e2c6e2a2d7cc35e8c7e0620636a9c
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
    set((state) => ({
      selectedConversation: state.selectedConversation.conversationId == id && {
        ...state.selectedConversation,
        bgImage: image,
      },
    }));
  },

  messageUpdate: async (id, data) => {
    try {
      await updateMessage(id, data);
    } catch (error) {
      toast.error(error);
      console.log(error);
    }
  },

  setUpdatedMessage: (message) => {
    const authUser = useAuthStore.getState().authUser;
    set((state) => ({
      conversations: state.conversations.map((con) => {
        if (con.conversationId !== message.conversationId) {
          return con;
        }
        return {
          ...con,
          lastmessage: {
            ...con.lastmessage,
            text:
              message.reacted !== con.lastmessage.reacted
                ? con.isgroup
                  ? authUser._id == message.userId
                    ? `You reacted ${message?.reacted} to '${message.text}'`
                    : `${con.groupdetail.membersDetail[message.userId].fullname} reacted ${message.reacted} to '${message.text}'`
                  : authUser._id == message.userId
                    ? `You reacted ${message?.reacted} to '${message.text}'`
                    : `${con.name} reacted ${message.reacted} to '${message.text}'`
                : message.text,
          },
        };
      }),
    }));
  },

  setReactedMsg: (message) => {
    set((state) => ({
      message: state.message.map((msg) =>
        msg._id === message._id ? { ...msg, reacted: message.reacted } : msg,
      ),
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
                  image: message.image,
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
          return {
            ...con,
            lastmessage: {
              ...con.lastmessage,
              text:
                authUser._id == message.sender
                  ? "You deleted this message"
                  : "This message was deleted",
              reacted: message.reacted,
              image: message.image,
            },
            unseenMsg: con.unseenMsg - 1 >= 0 ? con.unseenMsg - 1 : 0,
          };
        } else return con;
      }),
    }));
  },

  clearAllMsg: async (id) => {
    try {
      const resdata = await clearChat(id);
      toast.success(resdata.message);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
    }
  },

  setClearChat: (conversation) => {
    set((state) => ({
      conversations: state.conversations.map((con) => {
        if (con.conversationId == conversation._id) {
          return {
            ...con,
            lastmessage: {
              ...con.lastmessage,
              text: "",
              unseenMsg: 0,
            },
          };
        } else return con;
      }),
      message: [],
      messageCursor: null,
      hasMoreMessages: false,
    }));
  },

  setShowInfo: () => {
    set((state) => ({ showInfo: !state.showInfo }));
  },

  setDeleteChat: async (id) => {
    try {
      const resdata = await deleteConversation(id);
      toast.success(resdata.message);
      set({ selectedConversation: null });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data.message);
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
