import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import CallManager from "./components/CallManager";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { Spinner, ToastViewport } from "./components/ui";
import MobileAppRequired from "./pages/MobileAppRequired";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const ForgetPassword = lazy(() => import("./pages/ForgetPassword"));
const AddPost = lazy(() => import("./pages/AddPost"));
const Explore = lazy(() => import("./pages/Explore"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Setting = lazy(() => import("./pages/Setting"));
const Profile = lazy(() => import("./pages/Profile"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  if (navigator.userAgentData?.mobile) return true;

  return (
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

function App() {
  const authUser = useAuthStore((state) => state.authUser);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const { theme } = useThemeStore();
  const mobileDevice = isMobileDevice();

  useEffect(() => {
    if (!mobileDevice) checkAuth();
  }, [checkAuth, mobileDevice]);

  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-kapota-theme", theme);
  }, [theme]);

  if (mobileDevice) return <MobileAppRequired />;

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <div className="flex items-center gap-3 text-sm font-medium text-muted">
          <Spinner size="lg" />
          Opening Kapota
        </div>
      </div>
    );
  return (
    <div className="min-h-screen bg-canvas text-ink">
      {authUser && <Navbar />}
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas">
            <Spinner size="lg" />
          </div>
        }
      >
        <Routes>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      {authUser && <CallManager />}
      <ToastViewport />
    </div>
  );
}

export default App;
