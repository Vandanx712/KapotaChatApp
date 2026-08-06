import { ArrowLeft, MessageSquareOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/common/Logo";
import { Button } from "../components/ui";
import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";

export default function NotFound() {
  const navigate = useNavigate();
  const authUser = useAuthStore((state) => state.authUser);

  return (
    <main
      className={cn(
        "flex min-h-screen items-center justify-center bg-canvas px-8 py-12",
        authUser && "pl-[104px]",
      )}
    >
      <section className="w-full max-w-xl text-center">
        <Logo size={48} className="mx-auto" alt="Kapota" />
        <div className="mx-auto mt-8 flex size-16 items-center justify-center rounded-app bg-surface-muted text-brand-strong">
          <MessageSquareOff className="size-7" />
        </div>
        <p className="mt-7 text-sm font-semibold text-brand-strong">404</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">
          This page left the conversation
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
          No last seen, no forwarding address, and absolutely no useful status
          update. The link may be old or mistyped.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-4" />
            Go back
          </Button>
          <Link
            to={authUser ? "/" : "/login"}
            className="inline-flex h-10 items-center justify-center rounded-control border border-brand bg-brand px-4 text-sm font-semibold text-on-brand shadow-control transition hover:bg-brand-strong"
          >
            {authUser ? "Back to chats" : "Open Kapota Web"}
          </Link>
        </div>
      </section>
    </main>
  );
}
