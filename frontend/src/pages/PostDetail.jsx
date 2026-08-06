import { ArrowLeft, Heart, ImageOff, MapPin, SendIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PhotoProvider, PhotoView } from "react-photo-view";
import toast from "react-hot-toast";
import "react-photo-view/dist/react-photo-view.css";
import { getPostDetail, postLiked, sendMessage } from "../lib/axios";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";
import { AppPage, PageHeader } from "../components/layout/AppPage";
import { Avatar, Button, EmptyState, Spinner } from "../components/ui";
import LoadableImage from "../components/common/LoadableImage";
import SharePostDialog from "../components/posts/SharePostDialog";

function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { conversations, getConversation } = useChatStore();
  const sharedPost = location.state?.sharedPost || null;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
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
    let active = true;
    const loadPost = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const response = await getPostDetail(id);
        if (active) setPost(response.post || null);
      } catch (error) {
        if (!active) return;
        const message = error.response?.data?.message || "Failed to load shared post";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadPost();
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (sharePost && conversations.length === 0) getConversation();
  }, [sharePost, conversations.length, getConversation]);

  const handleLike = async () => {
    if (!post?._id || likeLoading) return;
    try {
      setLikeLoading(true);
      const response = await postLiked(post._id);
      setPost((current) =>
        current
          ? {
            ...current,
            isLiked: response.liked,
            likesCount: current.likesCount + (response.liked ? 1 : -1),
          }
          : current,
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to like post");
    } finally {
      setLikeLoading(false);
    }
  };

  const handleOpenShareModal = async (selectedPost) => {
    setSharePost(selectedPost);
    setShareSearch("");
    setSelectedConversationIds([]);
    if (conversations.length === 0) await getConversation();
  };

  const toggleConversationSelection = (conversationId) => {
    setSelectedConversationIds((current) => {
      if (current.includes(conversationId)) return current.filter((item) => item !== conversationId);
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
      setPost((current) =>
        current ? { ...current, sharesCount: (current.sharesCount || 0) + successCount } : current,
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

  if (loading) {
    return (
      <AppPage contentClassName="bg-surface">
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppPage>
    );
  }

  if (!post?._id) {
    return (
      <AppPage contentClassName="bg-surface">
        <PageHeader
          title="Post unavailable"
          backAction={
            <Button iconOnly size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          }
        />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <EmptyState
            icon={ImageOff}
            title="This post is unavailable"
            description={loadError || "It may have been removed or is no longer visible."}
            action={<Button variant="primary" onClick={() => navigate(-1)}>Go back</Button>}
          />
        </div>
      </AppPage>
    );
  }

  return (
    <PhotoProvider>
      <AppPage contentClassName="bg-surface">
        <PageHeader
          title={sharedPost ? "Shared post" : "Post"}
          description={sharedPost ? "Opened from a conversation" : `Shared by ${post.user?.fullname || "Kapota user"}`}
          backAction={
            <Button iconOnly size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          }
        />

        <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center px-10 py-8">
          <article className="grid w-full grid-cols-[minmax(0,1.55fr)_minmax(320px,0.75fr)] overflow-hidden rounded-app border border-line bg-surface shadow-panel">
            <PhotoView src={post.image?.url}>
              <div className="flex min-h-[620px] cursor-zoom-in items-center justify-center bg-canvas">
                <LoadableImage
                  src={post.image?.url}
                  alt={post.caption || "Post"}
                  className="max-h-[76vh] w-full object-contain"
                  wrapperClassName="h-full w-full"
                  imgProps={{ loading: "eager", decoding: "async" }}
                />
              </div>
            </PhotoView>

            <div className="flex min-h-[620px] flex-col border-l border-line">
              <header className="flex items-center gap-3 border-b border-line p-4">
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
              </header>

              <div className="ui-scrollbar min-h-0 flex-1 overflow-y-auto p-5">
                {post.caption ? (
                  <p className="text-sm leading-7 text-ink">
                    <span className="mr-2 font-semibold">{post.user?.fullname}</span>
                    {post.caption}
                  </p>
                ) : (
                  <p className="text-sm text-muted">No caption</p>
                )}
                <time className="mt-4 block text-xs text-subtle">{formatMessageTime(post.createdAt)}</time>
                {loadError && (
                  <p className="mt-4 rounded-control bg-warning/10 p-3 text-xs leading-5 text-warning">
                    Live refresh failed. Showing the available post preview.
                  </p>
                )}
              </div>

              <footer className="flex items-center gap-2 border-t border-line p-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLike}
                  loading={likeLoading}
                  className={post.isLiked ? "text-danger" : ""}
                >
                  <Heart className={`size-4 ${post.isLiked ? "fill-current" : ""}`} />
                  {post.hideLike ? "Likes hidden" : post.likesCount || 0}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenShareModal(post)}
                  disabled={post.disableShare}
                >
                  <SendIcon className="size-4" />
                  {post.disableShare ? "Sharing off" : post.sharesCount || 0}
                </Button>
              </footer>
            </div>
          </article>
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

export default PostDetail;
