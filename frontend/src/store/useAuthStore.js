import { create } from "zustand";
import { checkUser } from "../lib/axios";

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIng: false,
  isUpdateProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      const data = await checkUser();
      set({ authUser: data.user });
    } catch (error) {
        console.log('Error in checkAuth:',error)
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
}));
