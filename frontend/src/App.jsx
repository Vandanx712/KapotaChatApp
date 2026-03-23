import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Setting from "./pages/Setting";
import Profile from "./pages/Profile";
import { useAuthStore } from "./store/useAuthStore";
import { Loader } from 'lucide-react'
import {Toaster} from 'react-hot-toast'
import { useThemeStore } from "./store/useThemeStore";
import Explore from "./pages/Explore";
import ForgetPassword from "./pages/ForgetPassword";
import AddPost from "./pages/AddPost";
import UserProfile from "./pages/UserProfile";
import PostDetail from "./pages/PostDetail";

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const {theme} = useThemeStore()
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isCheckingAuth && !authUser) return (
    <div className=" flex items-center justify-center h-screen">
      <Loader className=' size-10 animate-spin' />
    </div>
  )
  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to='/' />} />
        <Route path="/login" element={!authUser ? <Login /> : <Navigate to='/' />} />
        <Route path="/forget-password" element={<ForgetPassword/>}/>
        <Route path="/" element={authUser ? <Home /> : <Navigate to='/login' />} />
        <Route path="/addpost" element={authUser ? <AddPost /> : <Navigate to='/login' />} />
        <Route path="/explore" element={authUser ? <Explore /> : <Navigate to='/login' />}/>
        <Route path="/post/:id" element={authUser ? <PostDetail /> : <Navigate to='/login' />}/>
        <Route path="/setting" element={authUser ? <Setting /> : <Navigate to='/login' />} />
        <Route path="/profile" element={authUser ? <Profile /> : <Navigate to='/login' />} />
        <Route path="/profile/:id" element={authUser ? <UserProfile /> : <Navigate to='/login' />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false}/>
    </div>
  );
}

export default App;
