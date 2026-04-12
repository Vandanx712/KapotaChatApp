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
  LoaderCircle,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { mergeUniqueById } from "../lib/utils";

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
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4">
          <LoaderCircle className="size-8 animate-spin text-base-content/60" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-base-100 pt-20">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
          <div className="mt-8 rounded-[2rem] border border-dashed border-base-300 bg-base-200/50 px-6 py-14 text-center">
            <h1 className="text-2xl font-semibold">Profile not found</h1>
            <p className="mt-2 text-sm text-base-content/60">
              This user profile could not be loaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PhotoProvider>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_24%),radial-gradient(circle_at_left,_rgba(34,197,94,0.10),_transparent_24%)] pt-20">
        <div className="mx-auto max-w-5xl px-4 pb-10">
          <div className="mb-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>

            <button
              type="button"
              onClick={handleMessage}
              disabled={isStartingChat}
              className="btn btn-primary btn-sm"
            >
              {isStartingChat ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <MessageCircle className="size-4" />
              )}
              Message
            </button>
          </div>

          <section className="rounded-[2rem] border border-base-300 bg-base-100/85 p-6 shadow-xl shadow-base-300/10 backdrop-blur">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="mx-auto md:mx-0">
                <PhotoView src={user.profilePic?.url}>
                  <button
                    type="button"
                    className="block overflow-hidden rounded-full ring-4 ring-primary/20 ring-offset-4 ring-offset-base-100"
                  >
                    <img
                      src={user.profilePic?.url}
                      alt={user.fullname}
                      className="size-28 object-cover sm:size-36"
                    />
                  </button>
                </PhotoView>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold">{user.fullname}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-base-content/70">
                      {user.bio || "No bio added yet."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-center sm:min-w-[250px]">
                    <div className="rounded-2xl bg-base-200/70 px-4 py-4">
                      <p className="text-xl font-semibold">
                        {user.postsCount ?? posts.length}
                      </p>
                      <p className="text-xs uppercase tracking-[0.18em] text-base-content/55">
                        Posts
                      </p>
                    </div>
                    <div className="rounded-2xl bg-base-200/70 px-4 py-4">
                      <p className="text-sm font-semibold">{joinedText}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-base-content/55">
                        Joined
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-base-content/65">
                  {user.location?.lat != null && user.location?.lng != null && (
                    <div className="inline-flex items-center gap-2 rounded-full bg-base-200/70 px-4 py-2">
                      <MapPin className="size-4" />
                      {user.location.name}
                    </div>
                  )}
                  <div className="inline-flex items-center gap-2 rounded-full bg-base-200/70 px-4 py-2">
                    <Grid3X3 className="size-4" />
                    {user.postsCount ?? posts.length} shared moments
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-[2rem] border border-base-300 bg-base-100/85 p-6 shadow-xl shadow-base-300/10 backdrop-blur">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-full bg-base-200 p-3">
                <Grid3X3 className="size-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">Posts</h2>
                <p className="text-sm text-base-content/60">
                  A quick look at what {user.fullname.split(" ")[0]} has shared.
                </p>
              </div>
            </div>

            {posts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {posts.map((post) => {
                    const postImage = getPostImage(post);

                    return (
                      <button
                        key={post._id}
                        type="button"
                        onClick={() => navigate(`/post/${post._id}`)}
                        className="aspect-square overflow-hidden bg-base-200 text-left"
                      >
                        <img
                          src={postImage}
                          alt={post.caption || "Post"}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
                {hasMorePosts && (
                  <div className="mt-5 flex justify-center">
                    <button
                      type="button"
                      onClick={loadMorePosts}
                      disabled={isLoadingMorePosts}
                      className="btn btn-outline"
                    >
                      {isLoadingMorePosts ? "Loading..." : "Load more posts"}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-base-300 bg-base-200/40 px-6 py-12 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-base-100">
                  <ImagePlus className="size-6 text-base-content/55" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">No posts yet</h3>
                <p className="mt-2 text-sm text-base-content/60">
                  This user has not shared any visible posts yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </PhotoProvider>
  );
}

export default UserProfile;
