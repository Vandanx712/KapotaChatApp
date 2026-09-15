import { useEffect, useState } from "react";
import { getCachedMedia, saveMediaToCache } from "../../lib/mediaCache";

function LoadableImage({
  src,
  alt = "",
  width,
  height,
  aspectRatio,
  className = "",
  wrapperClassName = "",
  skeletonClassName = "",
  fallback = null,
  imgProps = {},
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src);
  const [loadedSrc, setLoadedSrc] = useState("");
  const [failedSrc, setFailedSrc] = useState("");
  const [objectUrlToRevoke, setObjectUrlToRevoke] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    if (!src) {
      setResolvedSrc("");
      return;
    }

    // Check IndexedDB media cache
    getCachedMedia(src).then((cached) => {
      if (!isCurrent) return;
      if (cached?.blob) {
        const objUrl = URL.createObjectURL(cached.blob);
        setObjectUrlToRevoke(objUrl);
        setResolvedSrc(objUrl);
      } else {
        setResolvedSrc(src);
      }
    }).catch(() => {
      if (isCurrent) setResolvedSrc(src);
    });

    return () => {
      isCurrent = false;
    };
  }, [src]);

  // Clean up any generated object URLs
  useEffect(() => {
    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [objectUrlToRevoke]);

  const isLoaded = loadedSrc === resolvedSrc;
  const hasError = failedSrc === resolvedSrc;

  const handleLoad = () => {
    setLoadedSrc(resolvedSrc);
    setFailedSrc("");

    // If loaded from network (http/https) and not already a blob url, cache it to IndexedDB
    if (src && (src.startsWith("http://") || src.startsWith("https://"))) {
      fetch(src, { mode: "cors" })
        .then((res) => {
          if (!res.ok) throw new Error("Fetch failed");
          return res.blob();
        })
        .then((blob) => {
          saveMediaToCache(src, {
            blob,
            mimeType: blob.type || "image/jpeg",
            name: "cached-image",
            size: blob.size,
          });
        })
        .catch(() => {
          // Ignore background caching errors (CORS, etc.)
        });
    }
  };

  const handleError = () => {
    setFailedSrc(resolvedSrc);
    setLoadedSrc(resolvedSrc);
  };

  const styleProps = {};
  if (width) styleProps.width = typeof width === "number" ? `${width}px` : width;
  if (height) styleProps.height = typeof height === "number" ? `${height}px` : height;
  if (aspectRatio) styleProps.aspectRatio = aspectRatio;

  if (!src || hasError) {
    return (
      <div
        style={styleProps}
        className={`relative flex h-full w-full items-center justify-center overflow-hidden ${wrapperClassName}`}
      >
        {fallback || (
          <div className={`ui-skeleton h-full w-full ${skeletonClassName}`} />
        )}
      </div>
    );
  }

  return (
    <div
      style={styleProps}
      className={`relative h-full w-full overflow-hidden ${wrapperClassName}`}
    >
      {!isLoaded && (
        <div className={`ui-skeleton absolute inset-0 ${skeletonClassName}`} />
      )}
      <img
        key={resolvedSrc}
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={imgProps.loading || "lazy"}
        decoding={imgProps.decoding || "async"}
        onLoad={handleLoad}
        onError={handleError}
        className={`${className} ${
          isLoaded ? "opacity-100" : "opacity-0"
        } transition-opacity duration-200`}
        {...imgProps}
      />
    </div>
  );
}

export default LoadableImage;
