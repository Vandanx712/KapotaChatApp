import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "../../store/useThemeStore";
import AuthImagePattern from "../AuthImagePattern";
import { Button, Tooltip } from "../ui";

export default function AuthLayout({ children, visualTitle, visualSubtitle }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <main className="relative grid min-h-screen bg-surface xl:grid-cols-[minmax(480px,44%)_1fr]">
      <div className="absolute right-5 top-5 z-10">
        <Tooltip label={theme === "dark" ? "Use light theme" : "Use dark theme"} side="bottom">
          <Button iconOnly variant="secondary" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </Tooltip>
      </div>

      <section className="ui-scrollbar flex min-h-screen items-center justify-center overflow-y-auto px-10 py-12">
        <div className="w-full max-w-[420px]">{children}</div>
      </section>

      <AuthImagePattern title={visualTitle} subtitle={visualSubtitle} />
    </main>
  );
}
