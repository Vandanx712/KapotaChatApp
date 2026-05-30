import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  User,
  UserCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import AuthImagePattern from "../components/AuthImagePattern";
import toast from "react-hot-toast";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    gender: "",
    location: {},
  });
  const { requestSignupOtp, verifySignupOtp, isSigningUp } = useAuthStore();

  const getcoordinates = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          location: {
            lng: position.coords.longitude,
            lat: position.coords.latitude,
          },
        }));
        toast.success("Location added. Submit again to continue.");
      },
      (err) => {
        toast.error(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  const validateForm = () => {
    if (!formData.fullname.trim()) return toast.error("Full name is required");
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!formData.password.trim()) return toast.error("Password is required");
    if (!formData.gender) return toast.error("Gender is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    if (formData.password.length < 6)
      return toast.error("Password at least 6 characters");
    if (formData.location.lat == null || formData.location.lng == null) {
      getcoordinates();
      return toast.error("Allow location and submit again");
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = validateForm();
    if (success !== true) return;

    if (isOtpStep) {
      if (!otp.trim()) return toast.error("OTP is required");
      await verifySignupOtp({ ...formData, otp: otp.trim() });
      return;
    }

    const otpSent = await requestSignupOtp(formData);
    if (otpSent) setIsOtpStep(true);
  };

  const handleResendOtp = async () => {
    const success = validateForm();
    if (success !== true) return;
    await requestSignupOtp(formData);
  };

  return (
    <div className="h-auto pt-5 grid lg:grid-cols-2">
      <div className=" flex flex-col justify-center items-center p-6 sm:p-12">
        <div className=" w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <MessageSquare className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">
                {isOtpStep ? "Verify Email" : "Create Account"}
              </h1>
              <p className="text-base-content/60">
                {isOtpStep
                  ? "Enter the code sent to your email"
                  : "Get started with your free account"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isOtpStep ? (
              <>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Full Name</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      className="input input-bordered w-full pl-10"
                      placeholder="John Doe"
                      value={formData.fullname}
                      onChange={(e) =>
                        setFormData({ ...formData, fullname: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Email</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="email"
                      className="input input-bordered w-full pl-10"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Password</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="input input-bordered w-full pl-10"
                      placeholder="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="size-5 text-base-content/40" />
                      ) : (
                        <Eye className="size-5 text-base-content/40" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Gender</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserCheck className="size-5 text-base-content/40" />
                    </div>
                    <select
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                      value={formData.gender}
                      className="select select-secondary w-full pl-10"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                  <p className="text-sm font-medium">Verification code</p>
                  <p className="mt-1 text-sm leading-6 text-base-content/65">
                    We sent a 6-digit code to {formData.email}.
                  </p>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">OTP Code</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="size-5 text-base-content/40" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      className="input input-bordered w-full pl-10 tracking-[0.4em]"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-ghost btn-sm w-full"
                  disabled={isSigningUp}
                  onClick={handleResendOtp}
                >
                  Resend code
                </button>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={isSigningUp}
            >
              {isSigningUp ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isOtpStep ? (
                "Verify and create account"
              ) : (
                "Create Account"
              )}
            </button>

            {isOtpStep && (
              <button
                type="button"
                className="btn btn-link w-full"
                disabled={isSigningUp}
                onClick={() => setIsOtpStep(false)}
              >
                Edit signup details
              </button>
            )}
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Already have an account?{" "}
              <Link to="/login" className="link link-primary">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Join the Conversation"
        subtitle="Meet new people, share moments, and chat without limits."
      />
    </div>
  );
}

export default Signup;
