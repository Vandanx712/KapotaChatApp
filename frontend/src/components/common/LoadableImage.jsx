import { useState } from "react";

function LoadableImage({
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  skeletonClassName = "",
  fallback = null,
  imgProps = {},
}) {
  const [loadedSrc, setLoadedSrc] = useState("");
  const [failedSrc, setFailedSrc] = useState("");
  const isLoaded = loadedSrc === src;
  const hasError = failedSrc === src;

  if (!src || hasError) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${wrapperClassName}`}
      >
        {fallback || <div className={`skeleton h-full w-full ${skeletonClassName}`} />}
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden ${wrapperClassName}`}>
      {!isLoaded && (
        <div className={`absolute inset-0 skeleton ${skeletonClassName}`} />
      )}
      <img
        key={src}
        src={src}
        alt={alt}
        onLoad={() => {
          setLoadedSrc(src);
          setFailedSrc("");
        }}
        onError={() => {
          setFailedSrc(src);
          setLoadedSrc(src);
        }}
        className={`h-full w-full ${className} ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
        {...imgProps}
      />
    </div>
  );
}

export default LoadableImage;
