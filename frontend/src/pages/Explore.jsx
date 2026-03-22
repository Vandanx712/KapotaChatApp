import {
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  SendIcon,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { postFeed } from "../lib/axios";
import { PhotoProvider, PhotoView } from "react-photo-view";

function Explore() {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);

  useEffect(() => {
    if (!isNearbyModalOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsNearbyModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isNearbyModalOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadPosts();
      }
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [cursor]);

  const loadPosts = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const resdata = await postFeed(cursor);

      setPosts((prev) => [...prev, ...resdata.posts]);
      setCursor(resdata.nextCursor);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PhotoProvider>
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="h-[calc(100vh-5rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar">
          {posts.map((post, index) => (
            <section
              key={post.id}
              className="flex min-h-[calc(100vh-5rem)] snap-start items-start justify-center px-4 py-4 sm:items-center sm:py-6"
            >
              <article
                className="inline-flex max-w-full flex-col"
                style={{ maxWidth: "min(92vw, 560px)" }}
              >
                <div className="mb-3 flex items-center space-x-3">
                  <div className="avatar relative">
                    <div className="w-10 rounded-full">
                      <img
                        src={post.user?.profilePic?.url}
                        alt={post.user?.fullname}
                      />
                    </div>
                    {/* {post.isOnline && (
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-base-100 bg-green-500" />
                    )} */}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {post.user?.fullname}
                    </p>
                    {post.location?.name && (
                      <div className="flex items-start gap-1 text-xs text-base-content/60">
                        <MapPin className="mt-0.5 size-3.5 shrink-0" />
                        <span className="break-words">
                          {post.location?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden">
                  <PhotoView src={post.image?.url}>
                    <img
                      src={post.image?.url}
                      loading={index < 2 ? "eager" : "lazy"}
                      className="block h-auto w-auto max-h-[calc(100vh-17rem)] max-w-full object-contain sm:max-h-[calc(100vh-15rem)]"
                      style={{ maxWidth: "min(92vw, 560px)" }}
                    />
                  </PhotoView>
                </div>

                <div className="mt-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex flex-col space-y-2">
                    <div className="flex shrink-0 items-center gap-4">
                      <button
                        type="button"
                        className="text-base-content transition-colors hover:text-primary"
                      >
                        <Heart className="size-5" />
                        <span className="mt-1 block text-xs">
                          {post.hideLike ? "Likes" : post.likesCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={post.disableShare}
                        className="text-base-content transition-colors hover:text-primary"
                      >
                        <SendIcon className="size-5" />
                        <span className="mt-1 block text-xs">
                          {post.disableShare? "Send" : post.sharesCount}
                        </span>
                      </button>
                    </div>
                    <p className="text-sm leading-6 break-words">
                      {post.caption && (
                        <span className="mr-2 font-bold">
                          {post.user?.fullname}
                        </span>
                      )}
                      <span className="font-normal">{post.caption}</span>
                      <time className="flex gap-2 items-center text-sm opacity-50">
                        {formatMessageTime(post.createdAt)}
                      </time>
                    </p>
                  </div>
                </div>
              </article>
            </section>
          ))}

          <div ref={loadMoreRef} className=" flex justify-center">
            {loading && <Loader2 className="size-12 wanimate-spin" />}
          </div>
        </div>
      </div>
    </PhotoProvider>
  );
}

export default Explore;
