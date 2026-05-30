import { useState } from "react";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

function ForgetPassword() {
  const [step, setStep] = useState("email");
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const {
    isForgotPasswordLoading,
    requestForgotPasswordOtp,
    verifyForgotPasswordOtp,
  } = useAuthStore();

  const validateEmail = () => {
    if (!formData.email.trim()) return toast.error("Email is required");
    if (!/\S+@\S+\.\S+/.test(formData.email))
      return toast.error("Invalid email format");
    return true;
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (validateEmail() !== true) return;

    const sent = await requestForgotPasswordOtp({
      email: formData.email.trim(),
    });

    if (sent) setStep("reset");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (validateEmail() !== true) return;
    if (!formData.otp.trim()) return toast.error("OTP is required");
    if (formData.password.length < 6)
      return toast.error("Password at least 6 characters");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Password and confirm password must be same");

    const updated = await verifyForgotPasswordOtp({
      email: formData.email.trim(),
      otp: formData.otp.trim(),
      password: formData.password,
    });

    if (updated) navigate("/login");
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid min-h-screen pt-10 lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors 
              group-hover:bg-primary/20"
              >
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h1 className="mt-2 text-2xl font-bold">
                {step === "email" ? "Reset password" : "Verify your email"}
              </h1>
              <p className="text-base-content/60">
                {step === "email"
                  ? "We will send a reset code to your email"
                  : `Enter the code sent to ${formData.email}`}
              </p>
            </div>
          </div>

          {step === "email" ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Email</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="email"
                    className="input input-bordered w-full pl-10"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isForgotPasswordLoading}
              >
                {isForgotPasswordLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Send reset code"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm font-medium">Password reset code</p>
                <p className="mt-1 text-sm leading-6 text-base-content/65">
                  The code expires soon. Use the latest code if you request
                  another one.
                </p>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">OTP Code</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    className="input input-bordered w-full pl-10 tracking-[0.4em]"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={(e) =>
                      updateField("otp", e.target.value.replace(/\D/g, ""))
                    }
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">New Password</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-10"
                    placeholder="password"
                    value={formData.password}
                    onChange={(e) => updateField("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-base-content/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-base-content/40" />
                    )}
                  </button>
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    Confirm Password
                  </span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-base-content/40" />
                  </div>
                  <input
                    type={showConPassword ? "text" : "password"}
                    className="input input-bordered w-full pl-10"
                    placeholder="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      updateField("confirmPassword", e.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowConPassword(!showConPassword)}
                  >
                    {showConPassword ? (
                      <EyeOff className="h-5 w-5 text-base-content/40" />
                    ) : (
                      <Eye className="h-5 w-5 text-base-content/40" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isForgotPasswordLoading}
              >
                {isForgotPasswordLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Update password"
                )}
              </button>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  disabled={isForgotPasswordLoading}
                  onClick={handleRequestOtp}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  className="btn btn-link btn-sm"
                  disabled={isForgotPasswordLoading}
                  onClick={() => setStep("email")}
                >
                  Change email
                </button>
              </div>
            </form>
          )}

          <div className="text-center">
            <p className="text-base-content/60">
              Go back to{" "}
              <Link to="/login" className="link link-primary">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>

      <AuthImagePattern
        title="Recover your account"
        subtitle="Verify your email and choose a fresh password to continue."
      />
    </div>
  );
}

export default ForgetPassword;
