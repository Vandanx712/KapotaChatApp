import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const variants = {
  primary:
    "border-brand bg-brand text-on-brand shadow-control hover:border-brand-strong hover:bg-brand-strong",
  secondary:
    "border-line bg-surface-raised text-ink shadow-control hover:border-line-strong hover:bg-surface-hover",
  outline:
    "border-line-strong bg-transparent text-ink hover:border-brand/60 hover:bg-brand-soft hover:text-brand-strong",
  ghost: "border-transparent bg-transparent text-muted hover:bg-surface-hover hover:text-ink",
  danger:
    "border-danger bg-danger text-on-danger shadow-control hover:brightness-95",
  dangerGhost:
    "border-transparent bg-transparent text-danger hover:bg-danger-soft",
  link: "border-transparent bg-transparent px-0 text-brand-strong hover:text-brand hover:underline",
};

const sizes = {
  xs: "h-7 gap-1.5 px-2.5 text-xs",
  sm: "h-8 gap-2 px-3 text-xs",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-11 gap-2.5 px-5 text-sm",
};

function buttonClass({
  variant = "secondary",
  size = "md",
  iconOnly = false,
  className = "",
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-control border font-semibold transition duration-150 disabled:pointer-events-none disabled:opacity-45",
    variants[variant] || variants.secondary,
    iconOnly ? { xs: "size-7", sm: "size-8", md: "size-10", lg: "size-11" }[size] : sizes[size],
    className,
  );
}

const Button = forwardRef(function Button(
  {
    variant = "secondary",
    size = "md",
    iconOnly = false,
    loading = false,
    disabled,
    className = "",
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={buttonClass({ variant, size, iconOnly, className })}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export default Button;
