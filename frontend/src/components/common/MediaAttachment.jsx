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
    const [progress, setProgress] = useState(0);
    const abortRef = useRef(null);

    const mimeType = media?.mimeType || "";
    const kind = mimeType.startsWith("image/")
        ? "image"
        : mimeType.startsWith("video/")
            ? "video"
            : mimeType.startsWith("audio/")
                ? "audio"
                : "file";

    useEffect(() => {
        return () => {
            abortRef.current?.abort();
            if (localUrl) URL.revokeObjectURL(localUrl);
        };
    }, [localUrl]);

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

            const objectUrl = URL.createObjectURL(response.data);

            if (download) {
                saveFile(objectUrl, media.originalName);
                window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
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