import { ChevronDown, ChevronRight } from "lucide-react";
import {
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../lib/utils";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  className = "",
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "max-h-[calc(100vh-48px)] w-full overflow-hidden rounded-app border border-line bg-surface-raised shadow-overlay animate-ui-in",
          widths[size],
          className,
        )}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {(title || description) && (
          <header className="border-b border-line px-5 py-4">
            {title && <h2 id={titleId} className="text-base font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-5 text-muted">{description}</p>}
          </header>
        )}
        <div className="ui-scrollbar max-h-[calc(100vh-190px)] overflow-y-auto p-5">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</footer>}
      </section>
    </div>,
    document.body,
  );
}

const MenuContext = createContext(null);

export function DropdownMenu({ trigger, children, align = "end", side = "bottom", className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const triggerNode = isValidElement(trigger)
    ? cloneElement(trigger, {
      onClick: (event) => {
        trigger.props.onClick?.(event);
        setOpen((value) => !value);
      },
      "aria-haspopup": "menu",
      "aria-expanded": open,
    })
    : trigger;

  return (
    <MenuContext.Provider value={{ close: () => setOpen(false) }}>
      <div ref={rootRef} className="relative inline-flex">
        {triggerNode}
        {open && (
          <div
            role="menu"
            className={cn(
              "absolute z-[80] min-w-48 rounded-app border border-line bg-surface-raised p-1.5 shadow-panel animate-ui-in",
              align === "end" ? "right-0" : "left-0",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2",
              className,
            )}
          >
            {children}
          </div>
        )}
      </div>
    </MenuContext.Provider>
  );
}

export function MenuItem({
  icon: Icon,
  destructive = false,
  submenu = false,
  className = "",
  children,
  onClick,
  ...props
}) {
  const context = useContext(MenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      onClick={(event) => {
        onClick?.(event);
        context?.close();
      }}
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-control px-2.5 text-left text-sm transition",
        destructive ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-surface-hover",
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0 text-current" aria-hidden="true" />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {submenu && <ChevronRight className="size-4 text-subtle" aria-hidden="true" />}
    </button>
  );
}

export function MenuSeparator() {
  return <div className="my-1 border-t border-line" role="separator" />;
}

export function Tooltip({ label, side = "right", children, className = "" }) {
  const positions = {
    right: "left-full top-1/2 ml-2 -translate-y-1/2",
    left: "right-full top-1/2 mr-2 -translate-y-1/2",
    top: "bottom-full left-1/2 mb-2 -translate-x-1/2",
    bottom: "left-1/2 top-full mt-2 -translate-x-1/2",
  };

  return (
    <span className={cn("group/tooltip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute z-[120] hidden whitespace-nowrap rounded-control bg-ink px-2 py-1 text-[11px] font-medium text-surface shadow-panel group-hover/tooltip:block group-focus-within/tooltip:block",
          positions[side],
        )}
      >
        {label}
      </span>
    </span>
  );
}

export function Popover({ trigger, children, align = "end", className = "" }) {
  return <DropdownMenu trigger={trigger} align={align} className={cn("min-w-64 p-3 ", className)}>{children}</DropdownMenu>;
}

export function ContextMenu({ children, menu, className = "" }) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (!position) return undefined;
    const close = () => setPosition(null);
    window.addEventListener("click", close);
    window.addEventListener("blur", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("blur", close);
    };
  }, [position]);

  return (
    <div
      className={className}
      onContextMenu={(event) => {
        event.preventDefault();
        setPosition({ x: event.clientX, y: event.clientY });
      }}
    >
      {children}
      {position && createPortal(
        <div
          role="menu"
          className="fixed z-[120] min-w-48 rounded-app border border-line bg-surface-raised p-1.5 shadow-overlay animate-ui-in"
          style={{ left: position.x, top: position.y }}
          onClick={() => setPosition(null)}
        >
          {menu}
        </div>,
        document.body,
      )}
    </div>
  );
}

export function Disclosure({
  icon: Icon,
  title,
  description,
  defaultOpen = false,
  open: controlledOpen,
  onToggle,
  children,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const openState = controlledOpen !== undefined ? controlledOpen : isOpen;

  return (
    <details
      className={cn("group/disclosure border-b border-line", className)}
      open={openState}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        if (controlledOpen === undefined) {
          setIsOpen(nextOpen);
        }
        onToggle?.(event, nextOpen);
      }}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-1 py-4 marker:content-none">
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-surface-muted text-muted">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{title}</span>
          {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-subtle transition-transform group-open/disclosure:rotate-180" />
      </summary>
      <div className="pb-5 pl-11 pr-1">{children}</div>
    </details>
  );
}
