import { create } from "zustand";
import {
  checkUser,
  contactDetail,
  deleteAccount as deleteAccountRequest,
  getActiveSessions as getActiveSessionsRequest,
  loginuser,
  logout,
  logoutOneSession as logoutOneSessionRequest,
  logoutOtherSessions as logoutOtherSessionsRequest,
  requestForgotPasswordOtp as requestForgotPasswordOtpRequest,
  requestSignupOtp as requestSignupOtpRequest,
  updatePic,
  updateProfile,
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
  isDeletingAccount: false,
  activeSessions: [],
  canManageDevices: false,
  isSessionsLoading: false,
  sessionActionId: "",
  isLoggingOutOthers: false,
  isContactLoading: false,
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
      set({ authUser: null, activeSessions: [], canManageDevices: false });
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
      set({ authUser: resdata.user, canManageDevices: true });
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
      set({ authUser: resdata.user, activeSessions: [], canManageDevices: false });
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
      set({ authUser: null, activeSessions: [], canManageDevices: false });
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

  deleteAccount: async (data) => {
    set({ isDeletingAccount: true });
    try {
      const resdata = await deleteAccountRequest(data);
      get().disconnectSocket();
      set({
        authUser: null,
        otherUser: null,
        activeSessions: [],
        canManageDevices: false,
      });
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message);
      return false;
    } finally {
      set({ isDeletingAccount: false });
    }
  },

  fetchActiveSessions: async () => {
    set({ isSessionsLoading: true });
    try {
      const resdata = await getActiveSessionsRequest();
      set({
        activeSessions: resdata.sessions || [],
        canManageDevices: Boolean(resdata.canManageDevices),
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load devices");
    } finally {
      set({ isSessionsLoading: false });
    }
  },

  logoutOneSession: async (sessionId) => {
    const targetSession = get().activeSessions.find(
      (session) => session._id === sessionId,
    );

    if (targetSession?.isCurrent) {
      await get().logout();
      return true;
    }

    set({ sessionActionId: sessionId });
    try {
      const resdata = await logoutOneSessionRequest(sessionId);
      set((state) => ({
        activeSessions: state.activeSessions.filter(
          (session) => session._id !== sessionId,
        ),
      }));
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to logout device");
      return false;
    } finally {
      set({ sessionActionId: "" });
    }
  },

  logoutOtherSessions: async () => {
    set({ isLoggingOutOthers: true });
    try {
      const resdata = await logoutOtherSessionsRequest();
      set((state) => ({
        activeSessions: state.activeSessions.filter(
          (session) => session.isCurrent,
        ),
      }));
      toast.success(resdata.message);
      return true;
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to logout other devices",
      );
      return false;
    } finally {
      set({ isLoggingOutOthers: false });
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
        canManageDevices: false,
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
}));
