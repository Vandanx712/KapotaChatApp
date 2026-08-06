import { useState } from "react";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import Logo from "../components/common/Logo";
import AuthLayout from "../components/auth/AuthLayout";
import { Button, Field, Input, Select } from "../components/ui";

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
      (error) => toast.error(error.message),
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
    if (!/\S+@\S+\.\S+/.test(formData.email)) return toast.error("Invalid email format");
    if (formData.password.length < 6) return toast.error("Password at least 6 characters");
    if (formData.location.lat == null || formData.location.lng == null) {
      getcoordinates();
      return toast.error("Allow location and submit again");
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
    <AuthLayout
      visualTitle="A calmer place for every conversation"
      visualSubtitle="Create your Kapota account and keep messages, groups, calls, and shared moments together."
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <Logo size={42} />
          <span className="text-base font-semibold text-ink">Kapota</span>
        </div>
        <h1 className="mt-8 text-3xl font-semibold text-ink">
          {isOtpStep ? "Verify your email" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          {isOtpStep
            ? `Enter the code sent to ${formData.email}.`
            : "Set up your profile to start messaging."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isOtpStep ? (
          <>
            <Field label="Full name" htmlFor="signup-name">
              <Input
                id="signup-name"
                icon={User}
                type="text"
                autoComplete="name"
                placeholder="Your full name"
                value={formData.fullname}
                onChange={(event) => setFormData({ ...formData, fullname: event.target.value })}
              />
            </Field>

            <Field label="Email" htmlFor="signup-email">
              <Input
                id="signup-email"
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
              />
            </Field>

            <Field label="Password" hint="Use at least 6 characters." htmlFor="signup-password">
              <Input
                id="signup-password"
                icon={Lock}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                trailing={
                  <Button
                    iconOnly
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                }
              />
            </Field>

            <Field label="Gender" htmlFor="signup-gender">
              <Select
                id="signup-gender"
                value={formData.gender}
                onChange={(event) => setFormData({ ...formData, gender: event.target.value })}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </Select>
            </Field>
          </>
        ) : (
          <>
            <div className="rounded-app border border-brand/20 bg-brand-soft p-4">
              <p className="text-sm font-semibold text-ink">Verification code sent</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                Use the latest 6-digit code from your email. It expires shortly.
              </p>
            </div>

            <Field label="Verification code" htmlFor="signup-otp">
              <Input
                id="signup-otp"
                icon={Mail}
                type="text"
                inputMode="numeric"
                maxLength={6}
                inputClassName="text-center font-semibold"
                placeholder="123456"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              />
            </Field>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isSigningUp}
              onClick={handleResendOtp}
            >
              Resend code
            </Button>
          </>
        )}

        <Button type="submit" variant="primary" className="w-full" loading={isSigningUp}>
          {isOtpStep ? "Verify and create account" : "Create account"}
        </Button>

        {isOtpStep && (
          <Button
            type="button"
            variant="link"
            className="w-full"
            disabled={isSigningUp}
            onClick={() => setIsOtpStep(false)}
          >
            Edit signup details
          </Button>
        )}
      </form>

      <div className="mt-7 border-t border-line pt-6 text-center">
        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-brand-strong hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Signup;
