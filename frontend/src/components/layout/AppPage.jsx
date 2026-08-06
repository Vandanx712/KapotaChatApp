import { cn } from "../../lib/utils";

export function AppPage({ children, className = "", contentClassName = "" }) {
  return (
    <main className={cn("min-h-screen bg-canvas pl-[72px]", className)}>
      <div className={cn("mx-auto min-h-screen max-w-[1600px]", contentClassName)}>
        {children}
      </div>
    </main>
  );
}

export function PageHeader({ title, description, actions, backAction, className = "" }) {
  return (
    <header className={cn("flex min-h-20 items-center justify-between gap-6 border-b border-line bg-surface px-8 py-4", className)}>
      <div className="flex min-w-0 items-center gap-3">
        {backAction}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
          {description && <p className="mt-1 truncate text-sm text-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function PageSection({ title, description, action, children, className = "" }) {
  return (
    <section className={cn("border-b border-line py-6", className)}>
      {(title || description || action) && (
        <div className="mb-5 flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-[220px] flex-1">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
