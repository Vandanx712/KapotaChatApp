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
    set((state) => ({
      conversations: state.conversations.map((con) => {
        if (con.conversationId !== newMessage.conversationId) {
          return con;
        }

        const isOwnMessage = newMessage.sender === authUser._id;
        const isOpenConversation =
          state.currentConversationId === newMessage.conversationId;

        return {
          ...con,
          lastmessage: newMessage,
          unseenMsg:
            isOwnMessage || isOpenConversation ? 0 : (con.unseenMsg || 0) + 1,
        };
      }),
    }));
  },

  setSelectedConversation: (selectedConversation) => {
    const authUser = useAuthStore.getState().authUser;
    set((state) => ({
      selectedConversation,
      conversations: state.conversations.map((con) =>
        con.conversationId === selectedConversation.conversationId
          ? { ...con, unseenMsg: 0 }
          : con
      ),
    }));
  },

  setUnselectedConversation:(selectedConversation)=>{
    set({selectedConversation})
  },

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
