import { Heart, MapPin, MessageCircle, SendIcon, Users, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const EXPLORE_POSTS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop",
    caption: "Golden hour and the city finally slows down.",
    location: "Park Street, Kolkata",
    likes: "3.2k",
    comments: "180",
    authorName: "Ava",
    authorAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    caption: "Found a quiet ridge with the loudest view.",
    location: "Darjeeling Hills",
    likes: "1.1k",
    comments: "64",
    authorName: "Mason",
    authorAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
    caption: "Work table chaos, but in a satisfying way.",
    location: "Salt Lake Sector V",
    likes: "2.8k",
    comments: "142",
    authorName: "Noah",
    authorAvatar:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
    caption: "A little road, a lot of green, zero urgency.",
    location: "Munnar Route",
    likes: "980",
    comments: "41",
    authorName: "Sofia",
    authorAvatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop",
    caption: "The kind of sky that makes you put the phone down.",
    location: "Shillong Viewpoint",
    likes: "1.7k",
    comments: "95",
    authorName: "Liam",
    authorAvatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?q=80&w=300&auto=format&fit=crop",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1200&auto=format&fit=crop",
    caption: "Street color, sneakers, and way too much energy.",
    location: "Bandra, Mumbai",
    likes: "780",
    comments: "33",
    authorName: "Emma",
    authorAvatar:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=300&auto=format&fit=crop",
  },
];

const INITIAL_VISIBLE_POSTS = 4;
const POSTS_PER_BATCH = 2;

function Explore() {
  const { authUser, onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  const feedRef = useRef(null);
  const loadMoreRef = useRef(null);

  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_POSTS);
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

  const onlineUsersSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

  const reelPosts = useMemo(() => {
    return EXPLORE_POSTS.map((post, index) => {
      return {
        ...post,
        authorAvatar: authUser?.profilePic?.url || post.authorAvatar,
      };
    });
  }, [authUser?.profilePic?.url, onlineUsersSet]);

  useEffect(() => {
    const root = feedRef.current;
    const target = loadMoreRef.current;

    if (!root || !target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        setVisibleCount((current) =>
          Math.min(current + POSTS_PER_BATCH, reelPosts.length),
        );
      },
      {
        root,
        rootMargin: "240px 0px",
        threshold: 0.2,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [reelPosts.length]);

  const visiblePosts = reelPosts.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div
        ref={feedRef}
        className="h-[calc(100vh-5rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar"
      >
        {visiblePosts.map((post, index) => (
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
                    <img src={post.authorAvatar} alt={post.authorName} />
                  </div>
                  {post.isOnline && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-base-100 bg-green-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {post.authorName}
                  </p>
                  <div className="flex items-start gap-1 text-xs text-base-content/60">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    <span className="break-words">{post.location}</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                <img
                  src={post.src}
                  alt={post.caption}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="block h-auto w-auto max-h-[calc(100vh-17rem)] max-w-full object-contain sm:max-h-[calc(100vh-15rem)]"
                  style={{ maxWidth: "min(92vw, 560px)" }}
                />
              </div>

              <div className="mt-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex flex-col space-y-2">
                  <div className="flex shrink-0 items-center gap-4">
                    <button
                      type="button"
                      className="text-base-content transition-colors hover:text-primary"
                    >
                      <Heart className="size-5" />
                      <span className="mt-1 block text-xs">{post.likes}</span>
                    </button>

                    <button
                      type="button"
                      className="text-base-content transition-colors hover:text-primary"
                    >
                      <SendIcon className="size-5" />
                      <span className="mt-1 block text-xs">
                        {post.comments}
                      </span>
                    </button>
                  </div>
                  <p className="text-sm leading-6 break-words">
                    <span className="mr-2 font-semibold">
                      {post.authorName}
                    </span>
                    {post.caption}
                    <time className="flex gap-2 items-center text-sm opacity-50">
                      {formatMessageTime(Date.now())}
                    </time>
                  </p>
                </div>
              </div>
            </article>
          </section>
        ))}

        <div
          ref={loadMoreRef}
          className="flex h-10 items-center justify-center text-xs text-base-content/40"
        >
          {visibleCount < reelPosts.length ? "Loading more..." : ""}
        </div>
      </div>
    </div>
  );
}

export default Explore;
