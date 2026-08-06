import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import Logo from "../components/common/Logo";
import AuthLayout from "../components/auth/AuthLayout";
import { Button, Field, Input } from "../components/ui";

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
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    return true;
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    if (validateEmail() !== true) return;

    const sent = await requestForgotPasswordOtp({
      email: formData.email.trim(),
    });
    if (sent) setStep("reset");
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (validateEmail() !== true) return;
    if (!formData.otp.trim()) return toast.error("OTP is required");
    if (formData.password.length < 6) return toast.error("Password at least 6 characters");
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Password and confirm password must be same");
    }

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

  const passwordToggle = (visible, onToggle) => (
    <Button
      iconOnly
      size="xs"
      variant="ghost"
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
    >
      {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );

  return (
    <AuthLayout
      visualTitle="Return to your conversations securely"
      visualSubtitle="Verify your email, choose a fresh password, and continue right where you left off."
    >
      <div className="mb-9">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <span className="text-base font-semibold text-ink">Kapota</span>
        </div>
        <h1 className="mt-10 text-3xl font-semibold text-ink">
          {step === "email" ? "Reset your password" : "Choose a new password"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {step === "email"
            ? "We will send a verification code to your email."
            : `Enter the code sent to ${formData.email}.`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleRequestOtp} className="space-y-5">
          <Field label="Email" htmlFor="reset-email">
            <Input
              id="reset-email"
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </Field>

          <Button type="submit" variant="primary" className="w-full" loading={isForgotPasswordLoading}>
            Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="rounded-app border border-brand/20 bg-brand-soft p-4">
            <p className="text-sm font-semibold text-ink">Password reset code</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Use the latest code if you requested more than one.
            </p>
          </div>

          <Field label="Verification code" htmlFor="reset-otp">
            <Input
              id="reset-otp"
              icon={Mail}
              type="text"
              inputMode="numeric"
              maxLength={6}
              inputClassName="text-center font-semibold"
              placeholder="123456"
              value={formData.otp}
              onChange={(event) => updateField("otp", event.target.value.replace(/\D/g, ""))}
            />
          </Field>

          <Field label="New password" hint="Use at least 6 characters." htmlFor="reset-password">
            <Input
              id="reset-password"
              icon={Lock}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="New password"
              value={formData.password}
              onChange={(event) => updateField("password", event.target.value)}
              trailing={passwordToggle(showPassword, () => setShowPassword((visible) => !visible))}
            />
          </Field>

          <Field label="Confirm password" htmlFor="reset-confirm-password">
            <Input
              id="reset-confirm-password"
              icon={Lock}
              type={showConPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat new password"
              value={formData.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              trailing={passwordToggle(showConPassword, () => setShowConPassword((visible) => !visible))}
            />
          </Field>

          <Button type="submit" variant="primary" className="w-full" loading={isForgotPasswordLoading}>
            Update password
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="ghost" disabled={isForgotPasswordLoading} onClick={handleRequestOtp}>
              Resend code
            </Button>
            <Button size="sm" variant="link" disabled={isForgotPasswordLoading} onClick={() => setStep("email")}>
              Change email
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 border-t border-line pt-6 text-center">
        <p className="text-sm text-muted">
          Back to{" "}
          <Link to="/login" className="font-semibold text-brand-strong hover:underline">
            sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default ForgetPassword;
