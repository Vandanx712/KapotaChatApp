import axios from "axios";
import { useEffect, useRef, useState } from "react";
import {
    Download,
    FileText,
    Image as ImageIcon,
    Loader2,
    Music,
    Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { PhotoProvider, PhotoView } from "react-photo-view";
import { Button } from "../ui";
import { getMediaAccess } from "../../lib/axios";
import { getCachedMedia, saveMediaToCache } from "../../lib/mediaCache";
import { useAuthStore } from "../../store/useAuthStore";

const formatBytes = (bytes = 0) => {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const saveFile = (url, name) => {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = name || "kapota-download";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
};

export default function MediaAttachment({ media, reserveTime = false }) {
    const [localUrl, setLocalUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isCheckingCache, setIsCheckingCache] = useState(true);
    const [progress, setProgress] = useState(0);
    const abortRef = useRef(null);

    const authUser = useAuthStore((state) => state.authUser);
    const autoDownload = authUser?.mediaSettings?.autoDownload ?? true;
    const maxAutoDownloadBytes = authUser?.mediaSettings?.maxAutoDownloadBytes ?? (10 * 1024 * 1024);

    const mimeType = media?.mimeType || "";
    const kind = mimeType.startsWith("image/")
        ? "image"
        : mimeType.startsWith("video/")
            ? "video"
            : mimeType.startsWith("audio/")
                ? "audio"
                : "file";

    const loadMedia = async ({ download = false } = {}) => {
        if (loading) return;

        if (localUrl) {
            if (download) saveFile(localUrl, media.originalName);
            return;
        }

        setLoading(true);
        setProgress(0);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const access = await getMediaAccess(
                media._id,
                download ? "attachment" : "inline",
            );

            const response = await axios.get(access.url, {
                responseType: "blob",
                signal: controller.signal,
                onDownloadProgress: ({ loaded, total }) => {
                    const size = total || media.bytes;
                    if (size) {
                        setProgress(Math.min(Math.round((loaded / size) * 100), 100));
                    }
                },
            });

            const blob = response.data;

            await saveMediaToCache(media._id, {
                blob,
                mimeType: media.mimeType,
                name: media.originalName,
                size: media.bytes,
            });

            const objectUrl = URL.createObjectURL(blob);

            if (download) {
                saveFile(objectUrl, media.originalName);
                setLocalUrl(objectUrl);
            } else {
                setLocalUrl(objectUrl);
            }
        } catch (error) {
            if (error.code !== "ERR_CANCELED") {
                toast.error(
                    error.response?.data?.message || "Attachment could not be downloaded",
                );
            }
        } finally {
            abortRef.current = null;
            setLoading(false);
        }
    };

    const loadMediaRef = useRef(loadMedia);
    useEffect(() => {
        loadMediaRef.current = loadMedia;
    });

    useEffect(() => {
        let isMounted = true;

        const checkCache = async () => {
            if (!media?._id) {
                setIsCheckingCache(false);
                return;
            }

            try {
                const cached = await getCachedMedia(media._id);
                if (cached?.blob && isMounted) {
                    const objectUrl = URL.createObjectURL(cached.blob);
                    setLocalUrl(objectUrl);
                    setIsCheckingCache(false);
                    return;
                }

                // Check auto-download based on user mediaSettings
                const fileSize = media.bytes || 0;
                if (autoDownload && fileSize <= maxAutoDownloadBytes && isMounted) {
                    setIsCheckingCache(false);
                    loadMediaRef.current({ download: false });
                    return;
                }
            } catch (err) {
                console.error("Cache check failed", err);
            } finally {
                if (isMounted) setIsCheckingCache(false);
            }
        };

        checkCache();

        return () => {
            isMounted = false;
        };
    }, [media?._id, autoDownload, maxAutoDownloadBytes, media?.bytes]);

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (localUrl) URL.revokeObjectURL(localUrl);
        };
    }, [localUrl]);

    if (isCheckingCache) {
        return (
            <div className="flex h-14 w-[280px] max-w-full items-center gap-3 rounded-control border border-line bg-surface/40 
  p-2.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted">
                    <Loader2 className="size-4 animate-spin text-muted" />
                </span>
                <div className="flex-1 space-y-1">
                    <div className="h-3 w-3/4 rounded bg-surface-muted" />
                    <div className="h-2 w-1/2 rounded bg-surface-muted" />
                </div>
            </div>
        );
    }

    if (localUrl) {
        return (
            <div className={reserveTime ? "pb-3" : ""}>
                {kind === "image" && (
                    <PhotoProvider>
                        <PhotoView src={localUrl}>
                            <img
                                src={localUrl}
                                alt={media.originalName || "Attachment"}
                                className="max-h-[360px] max-w-[min(360px,42vw)] cursor-pointer rounded-control object-contain"
                            />
                        </PhotoView>
                    </PhotoProvider>
                )}

                {kind === "video" && (
                    <video
                        src={localUrl}
                        controls
                        preload="metadata"
                        className="max-h-[360px] max-w-[min(360px,42vw)] rounded-control bg-black"
                    />
                )}

                {kind === "audio" && (
                    <audio src={localUrl} controls className="w-[280px] max-w-full" />
                )}

                <Button
                    iconOnly
                    size="xs"
                    variant="ghost"
                    className="mt-1"
                    onClick={() => loadMedia({ download: true })}
                    aria-label="Save attachment"
                >
                    <Download className="size-4" />
                </Button>
            </div>
        );
    }

    const TypeIcon =
        kind === "image"
            ? ImageIcon
            : kind === "video"
                ? Video
                : kind === "audio"
                    ? Music
                    : FileText;

    return (
        <button
            type="button"
            disabled={loading}
            onClick={() => loadMedia({ download: kind === "file" })}
            className={[
                "flex w-[280px] max-w-full items-center gap-3 rounded-control",
                "border border-line bg-surface/60 p-2.5 text-left",
                "transition hover:bg-surface-hover disabled:cursor-wait",
                reserveTime ? "mb-3" : "",
            ].join(" ")}
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-brand-soft text-brand-strong">
                {loading ? (
                    <Loader2 className="size-5 animate-spin" />
                ) : (
                    <TypeIcon className="size-5" />
                )}
            </span>

            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">
                    {media.originalName || "Attachment"}
                </span>
                <span className="block text-xs text-muted">
                    {loading ? `Downloading ${progress}%` : formatBytes(media.bytes)}
                </span>
            </span>

            {!loading && <Download className="size-4 shrink-0 text-muted" />}
        </button>
    );
}