import { create } from "zustand";
import {
  checkUser,
  contactDetail,
  getActiveSessions as getActiveSessionsRequest,
  loginuser,
  logout,
  qrLoginComplete,
  qrLoginRequest,
  requestForgotPasswordOtp as requestForgotPasswordOtpRequest,
  requestSignupOtp as requestSignupOtpRequest,
  updatePic,
  updateProfile,
  updateMediaSettings as updateMediaSettingsRequest,
  verifyForgotPasswordOtp as verifyForgotPasswordOtpRequest,
  verifySignupOtp as verifySignupOtpRequest,
} from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  otherUser: null,
  isSigningUp: false,
  isForgotPasswordLoading: false,
  isLoggingIng: false,
  isUpdateProfile: false,
  isProfilePhotoUploading: false,
  isProfileDetailsUpdating: false,
  isMediaSettingsUpdating: false,
  activeSessions: [],
  isSessionsLoading: false,
  isContactLoading: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  qrDetail: {},

  checkAuth: async () => {
    try {
      const data = await checkUser();
      set({ authUser: data?.user ?? null, activeSessions: [] });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null, activeSessions: [] });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  requestSignupOtp: async (data) => {
    set({ isSigningUp: true });
    try {
      const resdata = await requestSignupOtpRequest(data);
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifySignupOtp: async (data) => {
    set({ isSigningUp: true });
    try {
      const resdata = await verifySignupOtpRequest(data);
      toast.success(resdata.message);
      set({ authUser: resdata.user });
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message);
      return false;
    } finally {
      set({ isSigningUp: false });
    }
  },

  requestForgotPasswordOtp: async (data) => {
    set({ isForgotPasswordLoading: true });
    try {
      const resdata = await requestForgotPasswordOtpRequest(data);
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message);
      return false;
    } finally {
      set({ isForgotPasswordLoading: false });
    }
  },

  verifyForgotPasswordOtp: async (data) => {
    set({ isForgotPasswordLoading: true });
    try {
      const resdata = await verifyForgotPasswordOtpRequest(data);
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message);
      return false;
    } finally {
      set({ isForgotPasswordLoading: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIng: true });
    try {
      const resdata = await loginuser(data);
      set({ authUser: resdata.user, activeSessions: [] });
      toast.success(resdata.message);
      get().connectSocket();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to log in");
      return false;
    } finally {
      set({ isLoggingIng: false });
    }
  },

  logout: async () => {
    try {
      const data = await logout({});
      set({ authUser: null, activeSessions: [] });
      get().disconnectSocket();
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdateProfile: true, isProfilePhotoUploading: true });
    try {
      const resdata = await updatePic(data);
      toast.success(resdata.message);
      set((state) => ({
        authUser: { ...state.authUser, profilePic: resdata.user.profilePic },
      }));
    } catch (error) {
      toast.error(error.response?.dats?.message);
      console.log(error);
    } finally {
      set({ isUpdateProfile: false, isProfilePhotoUploading: false });
    }
  },

  updateDetails: async (data) => {
    set({ isUpdateProfile: true, isProfileDetailsUpdating: true });
    try {
      const resdata = await updateProfile(data);
      set({ authUser: resdata.user });
      toast.success(resdata.message);
    } catch (error) {
      toast.error(error.response?.dats?.message);
      console.log(error);
    } finally {
      set({ isUpdateProfile: false, isProfileDetailsUpdating: false });
    }
  },

  updateMediaSettings: async (data) => {
    set({ isMediaSettingsUpdating: true });
    try {
      const resdata = await updateMediaSettingsRequest(data);
      set({ authUser: resdata.user });
      toast.success(resdata.message || "Media settings updated");
      return true;
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to update media settings");
      return false;
    } finally {
      set({ isMediaSettingsUpdating: false });
    }
  },

  contactDetail: async (id) => {
    set({ isContactLoading: true });
    try {
      const resdata = await contactDetail(id);
      set({ otherUser: resdata.user });
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data.message);
    } finally {
      set({ isContactLoading: false });
    }
  },

  fetchActiveSessions: async () => {
    set({ isSessionsLoading: true });
    try {
      const resdata = await getActiveSessionsRequest();
      set({
        activeSessions: resdata.sessions || [],
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load devices");
    } finally {
      set({ isSessionsLoading: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;
    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
    });
    socket.connect();

    socket.on("force-logout", () => {
      get().disconnectSocket();

      set({
        authUser: null,
        onlineUsers: [],
        activeSessions: [],
      });

      toast.error("You were logged out from this device");
    });

    set({ socket: socket });

    socket.on("getonlineusers", (users) => {
      set({ onlineUsers: users });
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
    set({ socket: null });
  },
  //linked device

  qrRequest: async () => {
    try {
      const resdata = await qrLoginRequest();
      set({ qrDetail: resdata.qr });
      return resdata.qr;
    } catch (error) {
      set({ qrDetail: {} });
      throw error;
    }
  },

  qrComplete: async (data) => {
    const resdata = await qrLoginComplete(data);
    if (resdata.status === "completed" && resdata.user) {
      set({
        authUser: resdata.user,
        activeSessions: [],
        qrDetail: {},
      });
      get().connectSocket();
    }
    return resdata;
  },
}));
