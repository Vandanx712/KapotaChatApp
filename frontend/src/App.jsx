import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import CallManager from "./components/CallManager";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgetPassword = lazy(() => import("./pages/ForgetPassword"));
const AddPost = lazy(() => import("./pages/AddPost"));
const Explore = lazy(() => import("./pages/Explore"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Setting = lazy(() => import("./pages/Setting"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth && !authUser)
    return (
      <div className=" flex items-center justify-center h-screen">
        <Loader className=" size-10 animate-spin" />
      </div>
    );
  return (
    <div data-theme={theme}>
      {authUser && <Navbar />}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route
            path="/signup"
            element={!authUser ? <Signup /> : <Navigate to="/" />}
          />
          <Route
            path="/login"
            element={!authUser ? <Login /> : <Navigate to="/" />}
          />
          <Route path="/forget-password" element={<ForgetPassword />} />

          <Route
            path="/"
            element={authUser ? <Home /> : <Navigate to="/login" />}
          />
          <Route
            path="/addpost"
            element={authUser ? <AddPost /> : <Navigate to="/login" />}
          />
          <Route
            path="/explore"
            element={authUser ? <Explore /> : <Navigate to="/login" />}
          />
          <Route
            path="/post/:id"
            element={authUser ? <PostDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/setting"
            element={authUser ? <Setting /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={authUser ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile/:id"
            element={authUser ? <UserProfile /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
      {authUser && <CallManager />}
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
}

export default App;
