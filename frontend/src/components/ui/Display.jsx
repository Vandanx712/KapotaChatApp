import { Loader2, UserRound } from "lucide-react";
import LoadableImage from "../common/LoadableImage";
import { cn } from "../../lib/utils";

const avatarSizes = {
  xs: "size-7",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-20",
  "2xl": "size-32",
};

export function Avatar({
  src,
  alt = "",
  size = "md",
  status,
  className = "",
  fallback,
}) {
  return (
    <span className={cn("relative inline-flex shrink-0 rounded-full", avatarSizes[size], className)}>
      <LoadableImage
        src={src}
        alt={alt}
        wrapperClassName="rounded-full bg-surface-muted"
        className="h-full w-full rounded-full object-cover"
        skeletonClassName="rounded-full"
        fallback={
          fallback || (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-surface-hover text-subtle">
              <UserRound className="size-1/2" aria-hidden="true" />
            </span>
          )
        }
        imgProps={{ loading: "lazy", decoding: "async" }}
      />
      {status && (
        <span
          className={cn(
            "absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface",
            status === "online" ? "bg-success" : "bg-subtle",
          )}
          aria-label={status}
        />
      )}
    </span>
  );
}

const badgeVariants = {
  neutral: "border-line bg-surface-muted text-muted",
  brand: "border-brand/20 bg-brand-soft text-brand-strong",
  success: "border-success/20 bg-success/10 text-success",
  danger: "border-danger/20 bg-danger-soft text-danger",
  warning: "border-warning/20 bg-warning/10 text-warning",
};

export function Badge({ variant = "neutral", className = "", children }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold",
        badgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className = "", children, ...props }) {
  return (
    <section
      className={cn("rounded-app border border-line bg-surface shadow-control", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Spinner({ size = "md", label = "Loading", className = "" }) {
  const sizeClass = { sm: "size-3.5", md: "size-5", lg: "size-8" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2 text-muted", className)} role="status">
      <Loader2 className={cn(sizeClass, "animate-spin")} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ className = "" }) {
  return <span className={cn("ui-skeleton block", className)} aria-hidden="true" />;
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {Icon && (
        <span className="mb-4 flex size-11 items-center justify-center rounded-app bg-brand-soft text-brand-strong">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
