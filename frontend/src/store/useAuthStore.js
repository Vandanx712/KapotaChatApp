import { create } from "zustand";
import { checkUser, logout, register } from "../lib/axios";
import toast from "react-hot-toast";

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

  signup:async(data)=>{
    set({isSigningUp:true})
    try {
      const resdata = await register(data)
      toast.success(resdata.message)
      set({authUser:data})
    } catch (error) {
      toast.error(error?.response?.data?.message)
    }finally{
      set({isSigningUp:false})
    }
  },

  logout:async()=>{
    try {
      const data = await logout({})
      set({authUser:null})
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message)
    }
  }
}));
