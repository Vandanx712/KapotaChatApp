import { Check } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "../../lib/utils";

export function Field({ label, hint, error, htmlFor, className = "", children }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      {children}
      {(error || hint) && (
        <p className={cn("text-xs leading-5", error ? "text-danger" : "text-muted")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef(function Input(
  { icon: Icon, trailing, className = "", inputClassName = "", ...props },
  ref,
) {
  return (
    <div
      className={cn(
        "flex h-10 w-full items-center gap-2.5 rounded-control border border-line bg-surface px-3 shadow-control transition focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15",
        className,
      )}
    >
      {Icon && <Icon className="size-4 shrink-0 text-subtle" aria-hidden="true" />}
      <input
        ref={ref}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm text-ink outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-subtle disabled:cursor-not-allowed disabled:opacity-60",
          inputClassName,
        )}  
        {...props}
      />
      {trailing}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { className = "", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "min-h-24 w-full resize-y rounded-control border border-line bg-surface px-3 py-2.5 text-sm text-ink shadow-control outline-none transition placeholder:text-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select(
  { className = "", children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink shadow-control outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Checkbox({ label, description, className = "", ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <span className="relative mt-0.5 flex size-4 shrink-0">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-[4px] border border-line-strong bg-surface transition peer-checked:border-brand peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30" />
        <Check className="pointer-events-none absolute inset-0 m-auto size-3 text-on-brand opacity-0 peer-checked:opacity-100" strokeWidth={3} />
      </span>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

export function Switch({ label, description, className = "", ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4", className)}>
      {(label || description) && (
        <span className="min-w-0">
          {label && <span className="block text-sm font-medium text-ink">{label}</span>}
          {description && <span className="mt-0.5 block text-xs leading-5 text-muted">{description}</span>}
        </span>
      )}
      <span className="relative inline-flex h-5 w-9 shrink-0">
        <input type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full bg-line-strong transition peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30" />
        <span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}

export function Radio({ label, className = "", ...props }) {
  return (
    <label className={cn("flex cursor-pointer items-center gap-2.5 text-sm", className)}>
      <span className="relative flex size-4 shrink-0">
        <input type="radio" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full border border-line-strong bg-surface peer-checked:border-[5px] peer-checked:border-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/30" />
      </span>
      {label}
    </label>
  );
}

export function SegmentedControl({ options, value, onChange, className = "" }) {
  return (
    <div className={cn("inline-flex rounded-control bg-surface-muted p-1", className)} role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex h-8 items-center justify-center gap-2 rounded-[5px] px-3 text-xs font-semibold transition",
            value === option.value
              ? "bg-surface-raised text-ink shadow-control"
              : "text-muted hover:text-ink",
          )}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}
