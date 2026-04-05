import { Loader2 } from "lucide-react";

function SectionLoader({
  loading = false,
  minHeight = 140,
  className = "",
  label = "Loading...",
  children,
}) {
  if (!loading) return children;

  return (
    <div
      className={`w-full rounded-2xl border border-base-300/60 bg-base-200/50 ${className}`}
      style={{ minHeight }}
    >
      <div className="flex h-full w-full items-center justify-center gap-2 px-4 py-6 text-base-content/70">
        <Loader2 className="size-4 animate-spin" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export default SectionLoader;
