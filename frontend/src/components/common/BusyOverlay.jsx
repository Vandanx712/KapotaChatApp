import { Spinner } from "../ui";

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
      className={`${positionClass} inset-0 z-[80] flex items-center justify-center bg-surface/75 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-center gap-3 rounded-app border border-line bg-surface-raised px-4 py-3 shadow-overlay">
        <Spinner />
        <span className="text-sm font-medium text-muted">{label}</span>
      </div>
    </div>
  );
}

export default BusyOverlay;
