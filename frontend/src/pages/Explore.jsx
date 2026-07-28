import {
  Check,
  Heart,
  Loader2,
  MapPin,
  Search,
  SendIcon,
  X,
} from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, mergeUniqueById } from "../lib/utils";
import { postFeed, postLiked, sendMessage } from "../lib/axios";
import { PhotoProvider, PhotoView } from "react-photo-view";
import toast from "react-hot-toast";

function Explore() {
  const ref = useRef({});
  const loadMoreRef = useRef(null);
  const joinedPostsRef = useRef(new Set());

  const { socket } = useAuthStore();
  const { conversations, getConversation } = useChatStore();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isNearbyModalOpen, setIsNearbyModalOpen] = useState(false);
  const [visiblePostIds, setVisiblePostIds] = useState(new Set());
  const [sharePost, setSharePost] = useState(null);
  const [shareSearch, setShareSearch] = useState("");
  const [selectedConversationIds, setSelectedConversationIds] = useState([]);
  const [isSharing, setIsSharing] = useState(false);

  const filteredConversations = useMemo(() => {
    const query = shareSearch.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const label = conversation.isgroup
        ? conversation.groupdetail?.groupname
        : conversation.name;

      return (label || "").toLowerCase().includes(query);
    });
  }, [conversations, shareSearch]);

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
    if (!hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        loadPosts();
      }
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePostIds((prev) => {
          const updated = new Set(prev);

          entries.forEach((entry) => {
            const id = entry.target.dataset.id;

            if (entry.isIntersecting) {
              updated.add(id);
            } else {
              updated.delete(id);
            }
          });

          return updated;
        });
      },
      { threshold: 0.5 },
    );

    Object.values(ref.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [posts]);

  useEffect(() => {
    if (!socket) return;

    visiblePostIds.forEach((id) => {
      if (!joinedPostsRef.current.has(id)) {
        socket.emit("joinPost", id);
        joinedPostsRef.current.add(id);
      }
    });

    joinedPostsRef.current.forEach((id) => {
      if (!visiblePostIds.has(id)) {
        socket.emit("leavePost", id);
        joinedPostsRef.current.delete(id);
      }
    });
  }, [visiblePostIds, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleLikeUpdate = ({ postId, likesCountChange }) => {
      if (!visiblePostIds.has(postId)) return;

      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId
            ? {
              ...post,
              isLiked: likesCountChange == -1 ? false : true,
              likesCount: post.likesCount + likesCountChange,
            }
            : post,
        ),
      );
    };

    socket.on("postLiked", handleLikeUpdate);

    return () => socket.off("postLiked", handleLikeUpdate);
  }, [socket, visiblePostIds]);

  useEffect(() => {
    if (sharePost && conversations.length === 0) {
      getConversation();
    }
  }, [sharePost, conversations.length, getConversation]);

  const loadPosts = useEffectEvent(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const resdata = await postFeed({ cursor, limit: 10 });

      setPosts((prev) => mergeUniqueById(prev, resdata.posts || []));
      setCursor(resdata.nextCursor ?? null);
      setHasMore(Boolean(resdata.hasMore));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  });

  const handleLike = async (id) => {
    try {
      await postLiked(id);
    } catch (error) {
      console.log(error);
      toast.error(error.response.data?.message);
    }
  };

  const handleOpenShareModal = async (post) => {
    setSharePost(post);
    setShareSearch("");
    setSelectedConversationIds([]);

    if (conversations.length === 0) {
      await getConversation();
    }
  };

  const toggleConversationSelection = (conversationId) => {
    setSelectedConversationIds((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      }

      if (prev.length >= 5) {
        toast.error("You can send a post to only 5 conversations");
        return prev;
      }

      return [...prev, conversationId];
    });
  };

  const handleSharePost = async () => {
    if (!sharePost?._id) return;
    if (selectedConversationIds.length === 0) {
      toast.error("Select at least one conversation");
      return;
    }

    setIsSharing(true);

    const results = await Promise.allSettled(
      selectedConversationIds.map((conversationId) =>
        sendMessage(conversationId, {
          text: "Send a post",
          postId: sharePost._id,
        }),
      ),
    );

    const successCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      setPosts((prev) =>
        prev.map((post) =>
          post._id === sharePost._id
            ? {
              ...post,
              sharesCount: (post.sharesCount || 0) + successCount,
            }
            : post,
        ),
      );
      toast.success(
        `Post sent to ${successCount} conversation${successCount > 1 ? "s" : ""}`,
      );
    }

    if (failedCount > 0) {
      toast.error(
        `${failedCount} conversation${failedCount > 1 ? "s" : ""} failed`,
      );
    }

    setSharePost(null);
    setSelectedConversationIds([]);
    setShareSearch("");

    setIsSharing(false);
  };

  return (
    <PhotoProvider>
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="h-[calc(100vh-5rem)] overflow-y-auto snap-y snap-mandatory no-scrollbar">
          {posts.map((post, index) => (
            <section
              key={post._id}
              data-id={post._id}
              ref={(el) => (ref.current[post._id] = el)}
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
                        onClick={() => handleLike(post._id)}
                        className="text-base-content transition-colors hover:text-primary"
                      >
                        <Heart
                          className={`size-5 ${post.isLiked ? "fill-red-700" : "fill-transparent"}`}
                        />
                        <span className="mt-1 block text-xs">
                          {post.hideLike ? "Likes" : post.likesCount}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenShareModal(post)}
                        disabled={post.disableShare}
                        className="text-base-content transition-colors hover:text-primary"
                      >
                        <SendIcon className="size-5" />
                        <span className="mt-1 block text-xs">
                          {post.disableShare ? "Send" : post.sharesCount}
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
            {loading && <Loader2 className="size-12 animate-spin" />}
            {!loading && !hasMore && posts.length > 0 && (
              <p className="py-6 text-sm text-base-content/60">
                You&apos;ve reached the end of the feed.
              </p>
            )}
          </div>
        </div>

        {sharePost && (
          <div className="modal modal-open">
            <div className="modal-box max-w-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Send post</h3>
                  <p className="mt-1 text-sm text-base-content/70">
                    Select up to 5 conversations, just like an Instagram-style
                    share sheet.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-circle btn-ghost btn-sm"
                  onClick={() => setSharePost(null)}
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-base-300 bg-base-200/60 p-3">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-base-300">
                    <img
                      src={sharePost.image?.url}
                      alt={sharePost.caption || "Shared post"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {sharePost.user?.fullname}
                    </p>
                    <p className="line-clamp-2 text-sm text-base-content/70">
                      {sharePost.caption || "No caption"}
                    </p>
                    {sharePost.location?.name && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-base-content/55">
                        <MapPin className="size-3.5" />
                        <span className="truncate">
                          {sharePost.location.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <label className="input input-bordered mt-4 flex items-center gap-2">
                <Search className="size-4 text-base-content/55" />
                <input
                  type="text"
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full bg-transparent"
                />
              </label>

              <div className="mt-3 flex items-center justify-between text-sm text-base-content/70">
                <span>{selectedConversationIds.length}/5 selected</span>
                <span>{filteredConversations.length} conversations</span>
              </div>

              <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                {filteredConversations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-base-300 px-4 py-8 text-center text-sm text-base-content/65">
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const label = conversation.isgroup
                      ? conversation.groupdetail?.groupname
                      : conversation.name;
                    const image = conversation.isgroup
                      ? conversation.groupdetail?.groupIcon?.url
                      : conversation.profilePic?.url;
                    const isSelected = selectedConversationIds.includes(
                      conversation.conversationId,
                    );

                    return (
                      <button
                        key={conversation.conversationId}
                        type="button"
                        onClick={() =>
                          toggleConversationSelection(
                            conversation.conversationId,
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${isSelected
                            ? "border-primary bg-primary/10"
                            : "border-base-300 bg-base-100 hover:bg-base-200/60"
                          }`}
                      >
                        <div className="avatar">
                          <div className="w-12 rounded-full bg-base-300">
                            <img src={image} alt={label} />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {label}
                          </p>
                          <p className="truncate text-xs text-base-content/60">
                            {conversation.lastmessage?.text ||
                              (conversation.isgroup
                                ? "Group conversation"
                                : "Direct conversation")}
                          </p>
                        </div>

                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${isSelected
                              ? "border-primary bg-primary text-primary-content"
                              : "border-base-300"
                            }`}
                        >
                          {isSelected && <Check className="size-4" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSharePost(null)}
                  disabled={isSharing}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSharePost}
                  disabled={isSharing || selectedConversationIds.length === 0}
                >
                  {isSharing && (
                    <span className="loading loading-spinner loading-xs"></span>
                  )}
                  Send post
                </button>
              </div>
            </div>

            <button
              type="button"
              className="modal-backdrop"
              onClick={() => setSharePost(null)}
            >
              close
            </button>
          </div>
        )}
      </div>
    </PhotoProvider>
  );
}

export default Explore;
