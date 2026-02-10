import { create } from "zustand";
import toast from "react-hot-toast";
import {
  createConversation,
  getConversations,
  getMessages,
  getSurroundUsers,
  sendMessage,
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

  getMessage: async(conversationId) => {
    set({ isMessageLoading: true });
    const { selectedConversation} = get();
    try {
      const resdata = await getMessages(conversationId);
      set({ messages: resdata.messages });
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
      set({ message: [...message, resdata.newMessage] });
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
      set({ message: [...get().message, newmsg] });
    });
  },

  offlineToMessage: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newmessage");
  },

  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),

  getSurroundingUsers: async () => {
    try {
      const resdata = await getSurroundUsers();
      set({ users: resdata.users });
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
}));
