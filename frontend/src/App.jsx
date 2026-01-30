import React, { useEffect } from "react";
import Navbar from "./components/Navbar";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Setting from "./pages/Setting";
import Profile from "./pages/Profile";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { authUser, checkAuth } = useAuthStore();

  useEffect(()=>{
    checkAuth()
  },[checkAuth])
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Home />} />
        <Route path="/setting" element={<Setting />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}

export default App;
