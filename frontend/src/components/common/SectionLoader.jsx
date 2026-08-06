import { Spinner } from "../ui";

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
      className={`w-full rounded-app border border-line bg-surface-muted ${className}`}
      style={{ minHeight }}
    >
      <div className="flex h-full w-full items-center justify-center gap-2 px-4 py-6 text-muted">
        <Spinner size="sm" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

export default SectionLoader;
