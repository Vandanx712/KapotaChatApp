import { Link, NavLink } from "react-router-dom";
import {
  Compass,
  ImagePlus,
  MessageCircle,
  Moon,
  Settings,
  Sun,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import Logo from "./common/Logo";
import { Avatar, Tooltip } from "./ui";
import { cn } from "../lib/utils";

const Navbar = () => {
  const { authUser } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navLinkClass = ({ isActive }) =>
    cn(
      "flex size-10 items-center justify-center rounded-control border transition-colors",
      isActive
        ? "border-brand/20 bg-brand-soft text-brand-strong"
        : "border-transparent text-muted hover:bg-surface-hover hover:text-ink",
    );

  const links = [
    { to: "/", label: "Chats", icon: <MessageCircle className="size-5" strokeWidth={1.8} />, end: true },
    { to: "/explore", label: "Explore", icon: <Compass className="size-5" strokeWidth={1.8} /> },
    { to: "/addpost", label: "Create post", icon: <ImagePlus className="size-5" strokeWidth={1.8} /> },
    { to: "/setting", label: "Settings", icon: <Settings className="size-5" strokeWidth={1.8} /> },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-[72px] flex-col items-center border-r border-line bg-surface py-4">
      <Tooltip label="Kapota" side="right">
        <Link
          to="/"
          aria-label="Kapota chats"
          className="flex size-11 items-center justify-center rounded-app transition hover:bg-surface-hover"
        >
          <Logo size={36} />
        </Link>
      </Tooltip>

      <nav aria-label="Primary navigation" className="mt-8 flex flex-col items-center gap-2">
        {links.map(({ to, label, icon, end }) => (
          <Tooltip key={to} label={label} side="right">
            <NavLink to={to} end={end} className={navLinkClass} aria-label={label}>
              {icon}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3">
        <Tooltip label={theme === "dark" ? "Use light theme" : "Use dark theme"} side="right">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex size-10 items-center justify-center rounded-control border border-transparent text-muted transition hover:bg-surface-hover hover:text-ink"
            aria-label={theme === "dark" ? "Use light theme" : "Use dark theme"}
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </Tooltip>

        <Tooltip label="Your profile" side="right">
          <NavLink
            to="/profile"
            aria-label="Your profile"
            className={({ isActive }) =>
              cn(
                "rounded-full border-2 p-0.5 transition",
                isActive ? "border-brand" : "border-transparent hover:border-line-strong",
              )
            }
          >
            <Avatar
              src={authUser?.profilePic?.url}
              alt={authUser?.fullname || "Profile"}
              size="md"
            />
          </NavLink>
        </Tooltip>
      </div>
    </aside>
  );
};
export default Navbar;
