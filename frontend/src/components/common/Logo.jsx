export default function Logo({
  size = 48,
  className = "",
  src = "/logo.png",
  alt = "Logo",
}) {
  return (
    <div
      className={`rounded-xl overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <img src={src} alt={alt} className="w-full h-full object-cover" />
    </div>
  );
}
