import { Download, Laptop, Moon, Smartphone, Sun } from "lucide-react";
import Logo from "../components/common/Logo";
import { Button, Tooltip } from "../components/ui";
import { useThemeStore } from "../store/useThemeStore";

const isAppleMobile = () =>
  typeof navigator !== "undefined" &&
  (/iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

export default function MobileAppRequired() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const androidAppUrl = import.meta.env.VITE_ANDROID_APP_URL;
  const iosAppUrl = import.meta.env.VITE_IOS_APP_URL;
  const appUrl = isAppleMobile() ? iosAppUrl : androidAppUrl;

  return (
    <main className="flex min-h-[100svh] flex-col bg-canvas">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-5">
        <div className="flex items-center gap-3">
          <Logo size={38} alt="Kapota" />
          <span className="text-base font-semibold text-ink">Kapota</span>
        </div>
        <Tooltip
          label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          side="bottom"
        >
          <Button
            iconOnly
            size="sm"
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
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div className="relative flex size-24 items-center justify-center rounded-app border border-line bg-surface shadow-control">
          <Smartphone className="size-10 text-brand-strong" strokeWidth={1.6} />
          <span className="absolute -bottom-2 -right-2 flex size-9 items-center justify-center rounded-full border-4 border-canvas bg-brand text-on-brand">
            <Download className="size-4" />
          </span>
        </div>

        <h1 className="mt-8 text-2xl font-semibold text-ink">
          Kapota belongs in your mobile app
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Kapota Web is designed for computers. Install the mobile application
          to create an account, sign in, and message from this device.
        </p>

        {appUrl ? (
          <a
            href={appUrl}
            className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control border border-brand bg-brand px-5 text-sm font-semibold text-on-brand shadow-control transition hover:bg-brand-strong"
          >
            <Download className="size-4" />
            Install Kapota
          </a>
        ) : (
          <div className="mt-8 w-full rounded-app border border-line bg-surface px-4 py-3 text-sm leading-6 text-muted">
            Open your device&apos;s app store and search for
            <span className="font-semibold text-ink"> Kapota</span>.
          </div>
        )}

        <div className="mt-8 flex items-start gap-3 border-t border-line pt-6 text-left">
          <Laptop className="mt-0.5 size-5 shrink-0 text-brand-strong" />
          <p className="text-xs leading-5 text-muted">
            To use Kapota Web, open this address on a computer and scan the QR
            code from the Linked devices section in the mobile app.
          </p>
        </div>
      </section>
    </main>
  );
}
