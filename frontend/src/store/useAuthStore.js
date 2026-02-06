import { create } from "zustand";
import { checkUser, loginuser, logout, register, updatePic } from "../lib/axios";
import toast from "react-hot-toast";

export const useAuthStore = create((set) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIng: false,
  isUpdateProfile: false,
  isCheckingAuth: true,
  onlineUsers:[],

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

  login:async(data)=>{
    set({isLoggingIng:true})
    try {
      const resdata = await loginuser(data)
      set({authUser:resdata.user})
      toast.success(resdata.message)
    } catch (error) {
      toast.error(error.response?.data.message)
    }finally{
      set({isLoggingIng:false})
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
  },

  updateProfile: async(data)=>{
    set({isUpdateProfile:true})
    try {
      const resdata = await updatePic(data)
      set({authUser:data.user})
      toast.success(resdata.message)
    } catch (error) {
      toast.error(error.response?.dats?.message)
      console.log(error)
    }finally{
      set({isUpdateProfile:false})
    }
  }
}));
