import { create } from "zustand";
import {
  checkUser,
  forgetPassword,
  loginuser,
  logout,
  register,
  updatePic,
  updateProfile,
} from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIng: false,
  isUpdateProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const data = await checkUser();
      set({ authUser: data.user });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const resdata = await register(data);
      toast.success(resdata.message);
      set({ authUser: data });
      get().connectSocket();
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  forgetPassword: async (data) => {
    try {
      const resdata = await forgetPassword(data);
      toast.success(resdata.message);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  },

  login: async (data) => {
    set({ isLoggingIng: true });
    try {
      const resdata = await loginuser(data);
      set({ authUser: resdata.user });
      toast.success(resdata.message);
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data.message);
    } finally {
      set({ isLoggingIng: false });
    }
  },

  logout: async () => {
    try {
      const data = await logout({});
      set({ authUser: null });
      get().disconnectSocket();
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdateProfile: true });
    try {
      const resdata = await updatePic(data);
      toast.success(resdata.message);
    } catch (error) {
      toast.error(error.response?.dats?.message);
      console.log(error);
    } finally {
      set({ isUpdateProfile: false });
    }
  },

  updateDetails: async (data) => {
    set({ isUpdateProfile: true });
    try {
      const resdata = await updateProfile(data);
      set({ authUser: resdata.user });
      toast.success(resdata.message);
    } catch (error) {
      toast.error(error.response?.dats?.message);
      console.log(error);
    } finally {
      set({ isUpdateProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();
    set({ socket: socket });

    socket.on("getonlineusers", (users) => {
      set({ onlineUsers: users });
    });
  },

  disconnectSocket: () => {
    if (get().socket.connected) get().socket.disconnect();
  },
}));
