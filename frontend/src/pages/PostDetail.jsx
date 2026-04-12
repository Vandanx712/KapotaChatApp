import {
  ArrowLeft,
  Heart,
  Loader2,
  MapPin,
  Search,
  SendIcon,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { PhotoProvider, PhotoView } from "react-photo-view";
import toast from "react-hot-toast";
import "react-photo-view/dist/react-photo-view.css";
import { getPostDetail, postLiked, sendMessage } from "../lib/axios";
import { formatMessageTime } from "../lib/utils";
import { useChatStore } from "../store/useChatStore";

function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { conversations, getConversation } = useChatStore();
  const sharedPost = location.state?.sharedPost || null;

  const [post, setPost] = useState({});
  const [loading, setLoading] = useState(false);
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
        if (!active) return;
        setPost(response.post);
      } catch (error) {
        if (!active) return;
        const message =
          error.response?.data?.message || "Failed to load shared post";
        setLoadError(message);
        toast.error(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadPost();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (sharePost && conversations.length === 0) {
      getConversation();
    }
  }, [sharePost, conversations.length, getConversation]);

  const handleLike = async () => {
    if (!post?._id || likeLoading) return;

    try {
      setLikeLoading(true);
      const response = await postLiked(post._id);

      setPost((prev) =>
        prev
          ? {
              ...prev,
              isLiked: response.liked,
              likesCount: prev.likesCount + (response.liked ? 1 : -1),
            }
          : prev,
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to like post");
    } finally {
      setLikeLoading(false);
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

    setSharePost(null);
    setSelectedConversationIds([]);
    setShareSearch("");

    setIsSharing(false);
  };

  if (loading && !post) {
    return (
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
          <Loader2 className="size-10 animate-spin text-base-content/50" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-2xl flex-col items-center justify-center px-6 text-center">
          <h1 className="text-2xl font-semibold">Post unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-base-content/70">
            {loadError || "This shared post is no longer available."}
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-primary mt-6"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <PhotoProvider>
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center px-4 py-6">
          <article className="w-full max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn btn-circle btn-ghost btn-sm"
              >
                <ArrowLeft className="size-5" />
              </button>
              <div>
                <p className="text-lg font-semibold">
                  {sharedPost ? "Shared Post" : "Post"}
                </p>
                <p className="text-sm text-base-content/60">
                  {sharedPost ? "Opened from chat" : "Opened from profile"}
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="avatar">
                  <div className="w-11 rounded-full">
                    <img
                      src={post.user?.profilePic?.url}
                      alt={post.user?.fullname}
                    />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {post.user?.fullname}
                  </p>
                  {post.location?.name && (
                    <div className="flex items-start gap-1 text-xs text-base-content/60">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      <span className="break-words">{post.location.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] bg-base-200">
                <PhotoView src={post.image?.url}>
                  <img
                    src={post.image?.url}
                    alt={post.caption || "Shared post"}
                    className="block max-h-[70vh] w-full object-contain"
                  />
                </PhotoView>
              </div>

              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex shrink-0 items-center gap-4">
                    <button
                      type="button"
                      onClick={handleLike}
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
                    <span>{post.caption}</span>
                  </p>

                  <time className="block text-sm opacity-50">
                    {formatMessageTime(post.createdAt)}
                  </time>

                  {loadError && (
                    <p className="text-xs text-warning">
                      Live post refresh failed. Showing available preview data.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
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
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          isSelected
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
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            isSelected
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

export default PostDetail;
