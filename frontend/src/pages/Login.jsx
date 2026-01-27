import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEye, FiEyeOff, FiMail, FiLock } from "react-icons/fi";
import "../index.css";
import toast from "react-hot-toast";
import { loginuser } from "../api/auth.api";
import { connectSocket, disconnectSocket } from "../socket/socket";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate()

  useEffect(()=>{
    if(sessionStorage.getItem('token')) disconnectSocket() 
  },[])

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailvalid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailvalid.test(email)) toast.error("Enter valid email");
    else if (password.length < 6) toast.error("Password at least 6 characters");
    else {
      try {
        const data = await loginuser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        sessionStorage.setItem('token',data.user.token)
        connectSocket(data.user.token)
        toast.success(data.message);
        navigate('/home')
      } catch (error) {
        console.log(error);
        toast.error(error.response?.data.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="auth-card animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-primary">
            KapotaChat
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Welcome back to your conversations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground auth-input pl-10"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-foreground"
            >
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground auth-input pl-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button type="submit" className="btn-primary mt-6">
            Login
          </button>
        </form>

        {/* Sign Up Link */}
        <p className="text-center mt-6 text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary font-medium hover:underline transition-all"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
