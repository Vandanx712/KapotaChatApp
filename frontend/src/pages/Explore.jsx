import { Heart, ImageOff, MapPin, SendIcon } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";
import toast from "react-hot-toast";
import "react-photo-view/dist/react-photo-view.css";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, mergeUniqueById } from "../lib/utils";
import { postFeed, postLiked, sendMessage } from "../lib/axios";
import { AppPage, PageHeader } from "../components/layout/AppPage";
import { Avatar, Button, EmptyState, Spinner } from "../components/ui";
import LoadableImage from "../components/common/LoadableImage";
import SharePostDialog from "../components/posts/SharePostDialog";

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

  const loadPosts = useEffectEvent(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await postFeed({ cursor, limit: 10 });
      setPosts((current) => mergeUniqueById(current, response.posts || []));
      setCursor(response.nextCursor ?? null);
      setHasMore(Boolean(response.hasMore));
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load posts");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (!hasMore) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) loadPosts();
    });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setVisiblePostIds((current) => {
          const updated = new Set(current);
          entries.forEach((entry) => {
            const id = entry.target.dataset.id;
            if (entry.isIntersecting) updated.add(id);
            else updated.delete(id);
          });
          return updated;
        });
      },
      { threshold: 0.5 },
    );

    Object.values(ref.current).forEach((element) => {
      if (element) observer.observe(element);
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
    if (!socket) return undefined;
    const handleLikeUpdate = ({ postId, likesCountChange }) => {
      if (!visiblePostIds.has(postId)) return;
      setPosts((current) =>
        current.map((post) =>
          post._id === postId
            ? {
              ...post,
              isLiked: likesCountChange !== -1,
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
    if (sharePost && conversations.length === 0) getConversation();
  }, [sharePost, conversations.length, getConversation]);

  const handleLike = async (id) => {
    try {
      await postLiked(id);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to like post");
    }
  };

  const handleOpenShareModal = async (post) => {
    setSharePost(post);
    setShareSearch("");
    setSelectedConversationIds([]);
    if (conversations.length === 0) await getConversation();
  };

  const toggleConversationSelection = (conversationId) => {
    setSelectedConversationIds((current) => {
      if (current.includes(conversationId)) return current.filter((id) => id !== conversationId);
      if (current.length >= 5) {
        toast.error("You can send a post to only 5 conversations");
        return current;
      }
      return [...current, conversationId];
    });
  };

  const closeShareDialog = () => {
    if (isSharing) return;
    setSharePost(null);
    setSelectedConversationIds([]);
    setShareSearch("");
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
    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      setPosts((current) =>
        current.map((post) =>
          post._id === sharePost._id
            ? { ...post, sharesCount: (post.sharesCount || 0) + successCount }
            : post,
        ),
      );
      toast.success(`Post sent to ${successCount} conversation${successCount > 1 ? "s" : ""}`);
    }
    if (failedCount > 0) {
      toast.error(`${failedCount} conversation${failedCount > 1 ? "s" : ""} failed`);
    }

    setSharePost(null);
    setSelectedConversationIds([]);
    setShareSearch("");
    setIsSharing(false);
  };

  return (
    <PhotoProvider>
      <AppPage>
        <PageHeader title="Explore" description="Recent moments shared on Kapota" />

        <div className="mx-auto max-w-7xl px-8 py-7">
          {posts.length === 0 && !loading ? (
            <EmptyState
              icon={ImageOff}
              title="Nothing to explore yet"
              description="New posts will appear here as people share them."
              className="min-h-[60vh]"
            />
          ) : (
            <div className="grid grid-cols-2 items-start gap-6">
              {posts.map((post, index) => (
                <article
                  key={post._id}
                  data-id={post._id}
                  ref={(element) => (ref.current[post._id] = element)}
                  className="overflow-hidden rounded-app border border-line bg-surface shadow-control"
                >
                  <header className="flex h-16 items-center gap-3 px-4">
                    <Avatar src={post.user?.profilePic?.url} alt={post.user?.fullname || "User"} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{post.user?.fullname}</p>
                      {post.location?.name && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{post.location.name}</span>
                        </p>
                      )}
                    </div>
                    <time className="text-xs text-subtle">{formatMessageTime(post.createdAt)}</time>
                  </header>

                  <PhotoView src={post.image?.url}>
                    <div className="aspect-[4/3] w-full bg-canvas">
                      <LoadableImage
                        src={post.image?.url}
                        alt={post.caption || "Post"}
                        className="h-full w-full cursor-zoom-in object-contain"
                        wrapperClassName="h-full w-full"
                        imgProps={{ loading: index < 4 ? "eager" : "lazy", decoding: "async" }}
                      />
                    </div>
                  </PhotoView>

                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleLike(post._id)}
                        className={post.isLiked ? "text-danger" : ""}
                        aria-label={post.isLiked ? "Unlike post" : "Like post"}
                      >
                        <Heart className={`size-4 ${post.isLiked ? "fill-current" : ""}`} />
                        {post.hideLike ? "Likes hidden" : post.likesCount || 0}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenShareModal(post)}
                        disabled={post.disableShare}
                        aria-label="Send post"
                      >
                        <SendIcon className="size-4" />
                        {post.disableShare ? "Sharing off" : post.sharesCount || 0}
                      </Button>
                    </div>
                    {post.caption && (
                      <p className="mt-3 text-sm leading-6 text-ink">
                        <span className="mr-2 font-semibold">{post.user?.fullname}</span>
                        {post.caption}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="flex min-h-20 items-center justify-center">
            {loading && <Spinner size="lg" />}
            {!loading && !hasMore && posts.length > 0 && (
              <p className="py-6 text-sm text-muted">You&apos;ve reached the end of the feed.</p>
            )}
          </div>
        </div>

        <SharePostDialog
          post={sharePost}
          conversations={filteredConversations}
          search={shareSearch}
          onSearchChange={setShareSearch}
          selectedIds={selectedConversationIds}
          onToggle={toggleConversationSelection}
          onClose={closeShareDialog}
          onSend={handleSharePost}
          isSending={isSharing}
        />
      </AppPage>
    </PhotoProvider>
  );
}

export default Explore;
