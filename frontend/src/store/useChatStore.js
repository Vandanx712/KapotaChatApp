import { create } from "zustand";
import toast from "react-hot-toast";
import {
  createConversation,
  deleteMessage,
  getConversations,
  getMessages,
  getSurroundUsers,
  sendMessage,
  updateConBgimage,
  updateMessage,
} from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  message: [],
  users: [],
  conversations: [],
  selectedUser: null,
  selectedConversation: null,
  isUsersLoading: false,
  isConversationLoading: false,
  isMessageLoading: false,

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
    set({ isMessageLoading: true });
    const { selectedConversation } = get();
    const authUser = useAuthStore.getState().authUser;
    try {
      const resdata = await getMessages(selectedConversation.conversationId);
      set({ message: resdata.messages });
      resdata.messages.forEach((msg) => {
        if (msg.sender !== authUser._id && msg.isSeen == false) {
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

  sendMessage: async (messageData) => {
    const { selectedConversation, message } = get();
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

  onlineToMessage: () => {
    const { selectedConversation } = get();
    if (!selectedConversation) return;

    const socket = useAuthStore.getState().socket;
    socket.on("newmessage", (newmsg) => {
      if (newmsg.sender !== selectedConversation.oruserId) return;
      set((state) => ({
        message: [...state.message, newmsg],
      }));
    });
  },

  offlineToMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newmessage");
  },

  setIsTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("istyping", { receiverId: selectedConversation.oruserId });
  },

  setStopTyping: (selectedConversation) => {
    const socket = useAuthStore.getState().socket;
    socket.emit("StopTyping", { receiverId: selectedConversation.oruserId });
  },

  setMsgSeen: (msgId) => {
    set((state) => ({
      message: state.message.map((msg) =>
        msg._id == msgId ? { ...msg, isSeen: true } : msg,
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
      const isOwnMessage = newMessage.sender === authUser._id;
      const isOpenConversation =
        state.selectedConversation?.conversationId ===
        newMessage?.conversationId;
      const updatedTargetCon = {
        ...targetCon,
        lastmessage: newMessage,
        unseenMsg:
          isOwnMessage || isOpenConversation
            ? 0
            : (targetCon?.unseenMsg || 0) + 1,
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
      const resdata = await getSurroundUsers();
      set({ users: resdata.filtered });
    } catch (error) {
      console.log(error);
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
                ? authUser._id == message.userId
                  ? `You reacted ${message?.reacted} to '${message.text}'`
                  : `${con.name} reacted ${message.reacted} to '${message.text}'`
                : message.text,
          },
        };
      }),
    }));
    console.log(get().conversations, "updated con");
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
}));
