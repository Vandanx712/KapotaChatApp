import { Loader2 } from "lucide-react";

function BusyOverlay({
  show = false,
  label = "Loading...",
  fixed = false,
  className = "",
}) {
  if (!show) return null;

  const positionClass = fixed ? "fixed" : "absolute";

  return (
    <div
      className={`${positionClass} inset-0 z-[80] flex items-center justify-center bg-base-100/70 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 px-5 py-3 shadow-2xl">
        <Loader2 className="size-5 animate-spin text-primary" />
        <span className="text-sm font-medium text-base-content/80">{label}</span>
      </div>
    </div>
  );
}

export default BusyOverlay;
