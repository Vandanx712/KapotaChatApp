import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { contactDetail } from "../lib/axios";
import toast from "react-hot-toast";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import {
  ArrowLeft,
  Grid3X3,
  ImagePlus,
  MapPin,
  MessageCircle,
  UserRoundX,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { mergeUniqueById } from "../lib/utils";
import { AppPage, PageHeader, PageSection } from "../components/layout/AppPage";
import { Avatar, Badge, Button, EmptyState, Spinner } from "../components/ui";
import LoadableImage from "../components/common/LoadableImage";

function UserProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { conversations, setSelectedConversation, creteConversation } =
    useChatStore();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [postsCursor, setPostsCursor] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [id]);

  const loadUserProfile = useEffectEvent(async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const resdata = await contactDetail(id, { limit: 12 });
      setUser(resdata.user || null);
      setPosts(resdata.user?.posts || []);
      setPostsCursor(resdata.nextCursor ?? null);
      setHasMorePosts(Boolean(resdata.hasMore));
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  });

  const loadMorePosts = async () => {
    if (!id || !postsCursor || !hasMorePosts || isLoadingMorePosts) return;

    setIsLoadingMorePosts(true);
    try {
      const resdata = await contactDetail(id, {
        cursor: postsCursor,
        limit: 12,
      });

      setUser((prev) => ({
        ...(prev || {}),
        ...(resdata.user || {}),
      }));
      setPosts((prev) => mergeUniqueById(prev, resdata.user?.posts || []));
      setPostsCursor(resdata.nextCursor ?? null);
      setHasMorePosts(Boolean(resdata.hasMore));
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to load more posts");
    } finally {
      setIsLoadingMorePosts(false);
    }
  };

  const handleMessage = async () => {
    if (!id) return;

    setIsStartingChat(true);
    try {
      const existingConversation = conversations.find(
        (conversation) =>
          !conversation.isgroup && conversation.oruserId?.toString() === id,
      );

      if (existingConversation) {
        setSelectedConversation(existingConversation);
        navigate("/");
        return;
      }

      await creteConversation(id);
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to open chat");
    } finally {
      setIsStartingChat(false);
    }
  };

  const joinedText = useMemo(() => {
    if (!user?.createdAt) return "Recently joined";

    return new Date(user.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [user?.createdAt]);

  const getPostImage = (post) => post?.image?.url || post?.image || "";

  if (isLoading) {
    return (
      <AppPage contentClassName="bg-surface">
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      </AppPage>
    );
  }

  if (!user) {
    return (
      <AppPage contentClassName="bg-surface">
        <PageHeader
          title="Profile unavailable"
          backAction={
            <Button iconOnly size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          }
        />
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center">
          <EmptyState
            icon={UserRoundX}
            title="Profile not found"
            description="This user profile could not be loaded."
          />
        </div>
      </AppPage>
    );
  }

  return (
    <PhotoProvider>
      <AppPage contentClassName="bg-surface">
        <PageHeader
          title={user.fullname || "Profile"}
          description="Kapota profile"
          backAction={
            <Button iconOnly size="sm" variant="ghost" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="size-5" />
            </Button>
          }
          actions={
            <Button variant="primary" onClick={handleMessage} loading={isStartingChat}>
              <MessageCircle className="size-4" />
              Message
            </Button>
          }
        />

        <div className="mx-auto max-w-6xl px-10 py-2">
          <PageSection>
            <div className="grid grid-cols-[auto_minmax(0,1fr)_260px] items-center gap-8 py-3">
              <div>
                <PhotoView src={user.profilePic?.url}>
                  <button
                    type="button"
                    className="block rounded-full ring-2 ring-brand/25 ring-offset-4 ring-offset-surface"
                  >
                    <Avatar src={user.profilePic?.url} alt={user.fullname || "Profile"} size="2xl" />
                  </button>
                </PhotoView>
              </div>

              <div className="min-w-0">
                    <h1 className="text-2xl font-semibold text-ink">{user.fullname}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                      {user.bio || "No bio added yet."}
                    </p>
                <div className="mt-5 flex flex-wrap gap-2 text-sm text-muted">
                  {user.location?.lat != null && user.location?.lng != null && (
                    <Badge>
                      <MapPin className="size-4" />
                      {user.location.name || "Location shared"}
                    </Badge>
                  )}
                  <Badge>
                    <Grid3X3 className="size-4" />
                    {user.postsCount ?? posts.length} shared moments
                  </Badge>
                </div>
              </div>

              <dl className="grid grid-cols-2 divide-x divide-line rounded-app border border-line bg-surface-muted text-center">
                <div className="px-4 py-5">
                  <dd className="text-xl font-semibold text-ink">{user.postsCount ?? posts.length}</dd>
                  <dt className="mt-1 text-xs text-muted">Posts</dt>
                </div>
                <div className="px-4 py-5">
                  <dd className="text-sm font-semibold text-ink">{joinedText}</dd>
                  <dt className="mt-1 text-xs text-muted">Joined</dt>
                </div>
              </dl>
            </div>
          </PageSection>

          <PageSection>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-control bg-brand-soft text-brand-strong">
                <Grid3X3 className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">Posts</h2>
                <p className="text-sm text-muted">
                  Moments shared by {user.fullname?.split(" ")?.[0] || "this user"}.
                </p>
              </div>
            </div>

            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 xl:grid-cols-4">
                  {posts.map((post) => {
                    const postImage = getPostImage(post);

                    return (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="group aspect-square overflow-hidden rounded-control bg-surface-muted text-left"
                      >
                        <LoadableImage
                          src={postImage}
                          alt={post.caption || "Post"}
                          className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                          wrapperClassName="h-full w-full"
                        />
                      </button>
                    );
                  })}
                </div>
                {hasMorePosts && (
                  <div className="mt-5 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={loadMorePosts}
                      loading={isLoadingMorePosts}
                    >
                      Load more posts
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={ImagePlus}
                title="No posts yet"
                description="This user has not shared any visible posts yet."
              />
            )}
          </PageSection>
        </div>
      </AppPage>
    </PhotoProvider>
  );
}

export default UserProfile;
