import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Sun,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Logo from "../components/common/Logo";
import { Button, Field, Input, Spinner, Tooltip } from "../components/ui";
import { useQrLoginPolling } from "../hooks/useQrLoginPolling";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const QR_REFRESH_BUFFER_MS = 10_000;

function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("method") === "email" ? "email" : "qr";
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [createStatus, setCreateStatus] = useState("idle");
  const [createError, setCreateError] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const creatingRef = useRef(false);

  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIng);
  const qrRequest = useAuthStore((state) => state.qrRequest);
  const qrDetail = useAuthStore((state) => state.qrDetail);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const createQrRequest = useCallback(async () => {
    if (creatingRef.current) return;
    creatingRef.current = true;
    setCreateStatus("creating");
    setCreateError("");

    try {
      await qrRequest();
      setCreateStatus("created");
    } catch (error) {
      setCreateStatus("error");
      setCreateError(
        error?.response?.data?.message ||
          "Kapota could not create a secure QR code. Please try again.",
      );
    } finally {
      creatingRef.current = false;
    }
  }, [qrRequest]);

  useEffect(() => {
    if (
      mode !== "qr" ||
      qrDetail?.requestId ||
      createStatus !== "idle"
    ) {
      return undefined;
    }
    const timer = window.setTimeout(createQrRequest, 0);
    return () => window.clearTimeout(timer);
  }, [createQrRequest, createStatus, mode, qrDetail?.requestId]);

  useEffect(() => {
    if (!qrDetail?.expiresAt) {
      setSecondsRemaining(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(qrDetail.expiresAt).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [qrDetail?.expiresAt]);

  useEffect(() => {
    if (mode !== "qr" || !qrDetail?.expiresAt) return undefined;

    const refreshDelay = Math.max(
      0,
      new Date(qrDetail.expiresAt).getTime() -
        Date.now() -
        QR_REFRESH_BUFFER_MS,
    );
    const timer = window.setTimeout(createQrRequest, refreshDelay);
    return () => window.clearTimeout(timer);
  }, [createQrRequest, mode, qrDetail?.expiresAt]);

  const handleLoginCompleted = useCallback(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  const handleQrExpired = useCallback(() => {
    createQrRequest();
  }, [createQrRequest]);

  const { status, error, isWaiting } = useQrLoginPolling({
    requestId: qrDetail?.requestId,
    browserSecret: qrDetail?.browserSecret,
    enabled:
      mode === "qr" &&
      createStatus === "created" &&
      Boolean(qrDetail?.requestId),
    onCompleted: handleLoginCompleted,
    onExpired: handleQrExpired,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const loggedIn = await login({
      email: formData.email.trim(),
      password: formData.password,
    });
    if (loggedIn) navigate("/", { replace: true });
  };

  const qrStatusText =
    status === "completed"
      ? "Linked successfully"
      : status === "network-error"
        ? "Connection interrupted. Retrying automatically..."
        : createStatus === "creating"
          ? "Creating a fresh QR code..."
          : isWaiting
            ? "Waiting for your phone"
            : "Ready to scan";
  const refreshSeconds = Math.max(
    0,
    secondsRemaining - QR_REFRESH_BUFFER_MS / 1000,
  );

  return (
    <main className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-8">
          <div className="flex items-center gap-3">
            <Logo size={42} alt="Kapota" />
            <div>
              <div className="text-base font-semibold text-ink">Kapota</div>
              <div className="text-xs text-muted">Desktop messaging</div>
            </div>
          </div>
          <Tooltip
            label={theme === "dark" ? "Use light theme" : "Use dark theme"}
            side="bottom"
          >
            <Button
              iconOnly
              variant="ghost"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>
          </Tooltip>
        </div>
      </header>

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-8 py-10">
        <div className="grid w-full overflow-hidden rounded-app border border-line bg-surface shadow-panel lg:grid-cols-[1fr_420px]">
          <div className="px-10 py-11 xl:px-14">
            {mode === "qr" ? (
              <>
                <div className="flex size-11 items-center justify-center rounded-app bg-brand-soft text-brand-strong">
                  <ScanLine className="size-5" />
                </div>
                <h1 className="mt-6 text-3xl font-semibold text-ink">
                  Link Kapota to this computer
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  Use the Kapota application on your phone to securely open your
                  conversations on this desktop.
                </p>

                <ol className="mt-8 space-y-5">
                  {[
                    "Open Kapota on your phone.",
                    "Open Settings, then choose Linked devices.",
                    "Choose Link a device and scan the QR code.",
                  ].map((step, index) => (
                    <li key={step} className="flex items-center gap-4 text-sm text-ink">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-semibold text-brand-strong">
                        {index + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                <div className="mt-9 flex items-center gap-2 text-xs text-muted">
                  <ShieldCheck className="size-4 text-brand-strong" />
                  The code is temporary and refreshes automatically.
                </div>

                <div className="mt-8 border-t border-line pt-6">
                  <Link
                    to="/login?method=email"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong hover:underline"
                  >
                    Log in with email and password
                    <ArrowRight className="size-4" />
                  </Link>
                  <p className="mt-2 text-xs text-muted">
                    New Kapota accounts are created in the mobile application.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex size-11 items-center justify-center rounded-app bg-brand-soft text-brand-strong">
                  <KeyRound className="size-5" />
                </div>
                <h1 className="mt-6 text-3xl font-semibold text-ink">
                  Log in with your account
                </h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                  Use an existing Kapota account. Account creation remains in
                  the mobile application.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 max-w-md space-y-5">
                  <Field label="Email" htmlFor="login-email">
                    <Input
                      id="login-email"
                      icon={Mail}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      required
                      value={formData.email}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                    />
                  </Field>

                  <Field label="Password" htmlFor="login-password">
                    <Input
                      id="login-password"
                      icon={Lock}
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      required
                      value={formData.password}
                      onChange={(event) =>
                        setFormData((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      trailing={
                        <Button
                          iconOnly
                          size="xs"
                          variant="ghost"
                          onClick={() => setShowPassword((visible) => !visible)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                      }
                    />
                  </Field>

                  <div className="flex items-center justify-between gap-4">
                    <Link
                      to="/forget-password"
                      className="text-sm font-semibold text-brand-strong hover:underline"
                    >
                      Forgot password?
                    </Link>
                    <Button type="submit" variant="primary" loading={isLoggingIn}>
                      Log in
                    </Button>
                  </div>
                </form>

                <Link
                  to="/login"
                  className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
                >
                  <ArrowLeft className="size-4" />
                  Back to QR code
                </Link>
              </>
            )}
          </div>

          <aside className="flex min-h-[540px] flex-col items-center justify-center border-l border-line bg-surface-muted px-8 py-10">
            {mode === "qr" ? (
              <>
                <div className="relative flex size-[284px] items-center justify-center rounded-app border border-line bg-white p-5 shadow-control">
                  {qrDetail?.qrPayload && createStatus !== "error" ? (
                    <QRCodeSVG
                      value={qrDetail.qrPayload}
                      size={240}
                      level="M"
                      bgColor="#ffffff"
                      fgColor="#17221e"
                      aria-label="Kapota device linking QR code"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-sm text-muted">
                      {createStatus === "creating" ? (
                        <Spinner size="lg" />
                      ) : (
                        <RefreshCw className="size-6" />
                      )}
                      {createStatus === "error"
                        ? "QR code unavailable"
                        : "Preparing QR code"}
                    </div>
                  )}

                  {status === "completed" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center rounded-app bg-white/95 text-brand-strong">
                      <CheckCircle2 className="size-10" />
                      <span className="mt-3 text-sm font-semibold">Device linked</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm font-medium text-ink">
                  <Smartphone className="size-4 text-brand-strong" />
                  {qrStatusText}
                </div>
                {refreshSeconds > 0 && createStatus === "created" && (
                  <p className="mt-2 text-xs text-muted">
                    Refreshing in {refreshSeconds} seconds
                  </p>
                )}
                {(createError || error) && (
                  <p className="mt-3 max-w-xs text-center text-xs leading-5 text-danger">
                    {createError || error}
                  </p>
                )}
                {createStatus === "error" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    onClick={createQrRequest}
                  >
                    <RefreshCw className="size-4" />
                    Try again
                  </Button>
                )}
              </>
            ) : (
              <div className="max-w-xs text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-app bg-brand-soft text-brand-strong">
                  <Smartphone className="size-7" />
                </div>
                <h2 className="mt-6 text-xl font-semibold text-ink">
                  QR linking is recommended
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted">
                  Scan once from a trusted Kapota mobile session. No password
                  needs to be typed into this computer.
                </p>
                <Link
                  to="/login"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-strong hover:underline"
                >
                  <ScanLine className="size-4" />
                  Use QR code instead
                </Link>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}

export default Login;
