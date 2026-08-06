import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  CircleQuestionMark,
  Clock3,
  EllipsisVertical,
  Heart,
  Key,
  Laptop2,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  RefreshCw,
  Send,
  Settings2,
  Share2,
  ShieldCheck,
  Sun,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { deletePost, getMyPosts, updatePostSettings } from "../lib/axios";
import { cn, mergeUniqueById } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { AppPage, PageSection } from "../components/layout/AppPage";
import LoadableImage from "../components/common/LoadableImage";
import {
  Avatar,
  Badge,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  Input,
  Modal,
  Skeleton,
  Spinner,
  Switch,
} from "../components/ui";

const SUPPORT_EMAIL = "support@kapota.app";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "v1.0.0";

const settingsItems = [
  {
    id: "account",
    icon: Key,
    label: "Account",
    description: "Devices, security, and account access",
  },
  {
    id: "posts",
    icon: Settings2,
    label: "Posts",
    description: "Visibility, archive, and sharing",
  },
  {
    id: "chats",
    icon: MessageCircle,
    label: "Chats",
    description: "Appearance and message preview",
  },
  {
    id: "help",
    icon: CircleQuestionMark,
    label: "Help and feedback",
    description: "Support, feedback, and privacy",
  },
];

const HELP_TOPICS = [
  {
    title: "Account and profile",
    description: "Profile photo, bio, password, and account controls.",
  },
  {
    title: "Chats and groups",
    description: "Messages, shared media, calls, and group actions.",
  },
  {
    title: "Posts and sharing",
    description: "Explore, likes, shares, archive, and post visibility.",
  },
];

const previewMessages = [
  { id: 1, content: "Hey, how is the new screen going?", sent: false },
  { id: 2, content: "Looking good. I will send it over today.", sent: true },
];

function SettingsHeader({ item }) {
  const Icon = item.icon;
  return (
    <header className="flex min-h-20 items-center gap-4 border-b border-line bg-surface px-8 py-4">
      <span className="flex size-10 items-center justify-center rounded-control bg-brand-soft text-brand-strong">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold text-ink">{item.label}</h1>
        <p className="mt-1 truncate text-sm text-muted">{item.description}</p>
      </div>
    </header>
  );
}

function Setting() {
  const [activeSection, setActiveSection] = useState("account");
  const [myPosts, setMyPosts] = useState([]);
  const [postLoading, setPostLoading] = useState(false);
  const [isMorePostsLoading, setIsMorePostsLoading] = useState(false);
  const [updatingPostId, setUpdatingPostId] = useState("");
  const [postToDelete, setPostToDelete] = useState(null);
  const [postCursor, setPostCursor] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [postSummary, setPostSummary] = useState({
    total: 0,
    archived: 0,
    hiddenLikes: 0,
    shareDisabled: 0,
  });
  const { theme, setTheme } = useThemeStore();
  const {
    activeSessions,
    authUser,
    fetchActiveSessions,
    isSessionsLoading,
    logout,
  } = useAuthStore();
  const navigate = useNavigate();

  const activeItem = useMemo(
    () => settingsItems.find((item) => item.id === activeSection) || settingsItems[0],
    [activeSection],
  );

  const loadMyPosts = useCallback(async ({ reset = false, cursor = null } = {}) => {
    try {
      if (reset) setPostLoading(true);
      else setIsMorePostsLoading(true);

      const response = await getMyPosts({ cursor, limit: 12 });
      const nextPosts = response.posts || [];
      setMyPosts((current) => (reset ? nextPosts : mergeUniqueById(current, nextPosts)));
      setPostCursor(response.nextCursor ?? null);
      setHasMorePosts(Boolean(response.hasMore));
      setPostSummary(
        response.summary || {
          total: 0,
          archived: 0,
          hiddenLikes: 0,
          shareDisabled: 0,
        },
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load posts");
    } finally {
      setPostLoading(false);
      setIsMorePostsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "account") fetchActiveSessions();
  }, [activeSection, fetchActiveSessions]);

  useEffect(() => {
    if (activeSection !== "posts") return;
    setMyPosts([]);
    setPostCursor(null);
    setHasMorePosts(false);
    loadMyPosts({ reset: true });
  }, [activeSection, loadMyPosts]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePostSettingChange = async (postId, field, checked) => {
    const previousPosts = [...myPosts];
    const previousSummary = { ...postSummary };
    const previousPost = myPosts.find((post) => post._id === postId);
    const updatedPosts = myPosts.map((post) =>
      post._id === postId ? { ...post, [field]: checked } : post,
    );

    setMyPosts(updatedPosts);
    if (previousPost && previousPost[field] !== checked) {
      setPostSummary((current) => ({
        ...current,
        archived:
          field === "isArchived"
            ? current.archived + (checked ? 1 : -1)
            : current.archived,
        hiddenLikes:
          field === "hideLike"
            ? current.hiddenLikes + (checked ? 1 : -1)
            : current.hiddenLikes,
        shareDisabled:
          field === "disableShare"
            ? current.shareDisabled + (checked ? 1 : -1)
            : current.shareDisabled,
      }));
    }
    setUpdatingPostId(postId);

    const changedPost = updatedPosts.find((post) => post._id === postId);
    try {
      const response = await updatePostSettings({
        postId,
        hideLikes: changedPost.hideLike,
        disableShare: changedPost.disableShare,
        isArchived: changedPost.isArchived,
      });
      toast.success(response.message);
    } catch (error) {
      setMyPosts(previousPosts);
      setPostSummary(previousSummary);
      toast.error(error.response?.data?.message || "Failed to update post");
    } finally {
      setUpdatingPostId("");
    }
  };

  const handleDeletePost = async () => {
    if (!postToDelete?._id) return;
    try {
      setUpdatingPostId(postToDelete._id);
      const response = await deletePost(postToDelete._id);
      setMyPosts((current) => current.filter((post) => post._id !== postToDelete._id));
      setPostSummary((current) => ({
        total: Math.max(current.total - 1, 0),
        archived: Math.max(current.archived - (postToDelete.isArchived ? 1 : 0), 0),
        hiddenLikes: Math.max(current.hiddenLikes - (postToDelete.hideLike ? 1 : 0), 0),
        shareDisabled: Math.max(current.shareDisabled - (postToDelete.disableShare ? 1 : 0), 0),
      }));
      setPostToDelete(null);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    } finally {
      setUpdatingPostId("");
    }
  };

  const handleCopySupportEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast.success("Support email copied");
    } catch {
      toast.error("Unable to copy support email");
    }
  };

  const handleEmailSupport = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=Kapota support`;
  };

  const formatSessionTime = (value) => {
    if (!value) return "Unknown";
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  };

  const renderAccountSection = () => (
    <div className="mx-auto max-w-5xl px-8 py-4">
      <PageSection
        title="Active devices"
        description="Review where your account is signed in and remove devices you no longer use."
        action={
          <Button size="sm" variant="outline" onClick={fetchActiveSessions} loading={isSessionsLoading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      >
        <div className="mb-4 rounded-control border border-line bg-surface-muted px-4 py-3 text-sm leading-6 text-muted">
          To log out another device or delete your account, use Kapota on your primary mobile device.
        </div>

        {isSessionsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-4 rounded-app border border-line p-4">
                <Skeleton className="size-10 rounded-control" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-44 rounded-control" />
                  <Skeleton className="mt-3 h-3 w-72 rounded-control" />
                </div>
              </div>
            ))}
          </div>
        ) : activeSessions.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No active devices"
            description="Your current device sessions will appear here after you sign in."
          />
        ) : (
          <div className="space-y-2">
            {activeSessions.map((session) => (
              <div
                key={session._id}
                className={cn(
                  "rounded-app border p-4",
                  session.isCurrent || session.isPrimaryDevice
                    ? "border-brand/30 bg-brand-soft/50"
                    : "border-line bg-surface",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-surface-muted text-muted">
                    <Laptop2 className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-ink">
                        {session.deviceName || "Unknown device"}
                      </h3>
                      {session.isCurrent && <Badge variant="brand">This device</Badge>}
                      {session.isPrimaryDevice && <Badge>Primary</Badge>}
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <dt className="flex items-center gap-1 text-subtle"><Clock3 className="size-3" /> Last active</dt>
                        <dd className="mt-1 truncate font-medium text-muted">{formatSessionTime(session.lastSeenAt)}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-subtle"><ShieldCheck className="size-3" /> Signed in</dt>
                        <dd className="mt-1 truncate font-medium text-muted">{formatSessionTime(session.createdAt)}</dd>
                      </div>
                      <div>
                        <dt className="flex items-center gap-1 text-subtle"><MapPin className="size-3" /> Network</dt>
                        <dd className="mt-1 truncate font-medium text-muted">{session.ipAddress || "Unavailable"}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>

    </div>
  );

  const renderChatsSection = () => (
    <div className="mx-auto max-w-5xl px-8 py-4">
      <PageSection title="Appearance" description="Choose between Kapota's custom light and dark themes.">
        <div className="grid grid-cols-2 gap-4">
          {["light", "dark"].map((option) => {
            const isSelected = theme === option;
            return (
              <button
                key={option}
                type="button"
                data-kapota-theme={option}
                onClick={() => setTheme(option)}
                className={cn(
                  "rounded-app border bg-surface p-3 text-left text-ink transition",
                  isSelected ? "border-brand ring-2 ring-brand/15" : "border-line hover:border-line-strong",
                )}
              >
                <div className="overflow-hidden rounded-control border border-line bg-canvas p-3">
                  <div className="flex items-center gap-2 border-b border-line bg-surface pb-3">
                    <span className="size-7 rounded-full bg-brand" />
                    <span className="h-2 w-20 rounded-full bg-line-strong" />
                  </div>
                  <div className="space-y-2 py-3">
                    <div className="h-7 w-2/3 rounded-control bg-message-in" />
                    <div className="ml-auto h-7 w-3/4 rounded-control bg-message-out" />
                  </div>
                </div>
                <span className="mt-3 flex items-center justify-between text-sm font-semibold text-ink">
                  <span className="flex items-center gap-2">
                    {option === "light" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    {option === "light" ? "Light" : "Dark"}
                  </span>
                  {isSelected && <Check className="size-4 text-brand-strong" />}
                </span>
              </button>
            );
          })}
        </div>
      </PageSection>

      <PageSection title="Message preview" description="Preview the active theme in a compact conversation.">
        <div className="mx-auto max-w-xl overflow-hidden rounded-app border border-line bg-canvas shadow-control">
          <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
            <Avatar fallback={<span className="flex h-full w-full items-center justify-center rounded-full bg-[#ef8f74] text-sm font-semibold text-white">J</span>} size="md" />
            <div>
              <p className="text-sm font-semibold text-ink">John Doe</p>
              <p className="text-xs text-brand-strong">Online</p>
            </div>
          </div>
          <div className="chat-canvas space-y-3 p-5">
            {previewMessages.map((message) => (
              <div key={message.id} className={`flex ${message.sent ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-app px-3 py-2 text-sm text-ink shadow-control ${message.sent ? "rounded-br-[2px] bg-message-out" : "rounded-bl-[2px] bg-message-in"}`}>
                  {message.content}
                  <span className="mt-1 block text-right text-[10px] text-muted">12:00 PM</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line bg-surface p-3">
            <Input value="This is a preview" readOnly />
            <Button iconOnly variant="primary" aria-label="Send preview message"><Send className="size-4" /></Button>
          </div>
        </div>
      </PageSection>
    </div>
  );

  const renderHelpSection = () => (
    <div className="mx-auto max-w-5xl px-8 py-4">
      <PageSection
        title="Support"
        description="Contact the Kapota team for account help, bug reports, or product feedback."
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopySupportEmail}>
              Copy email
            </Button>
            <Button size="sm" variant="primary" onClick={handleEmailSupport}>
              <Send className="size-4" /> Email support
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-3 divide-x divide-line rounded-app border border-line">
          {HELP_TOPICS.map((topic) => (
            <div key={topic.title} className="p-5">
              <h3 className="text-sm font-semibold text-ink">{topic.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{topic.description}</p>
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection title="Privacy overview" description="A summary of the information associated with your Kapota account.">
        <dl className="divide-y divide-line rounded-app border border-line">
          {[
            ["Account data", "Your name, bio, email address, and profile photo."],
            ["Chats and media", "Messages, shared images, and conversation details."],
            ["Posts and activity", "Posts, likes, shares, and explore activity tied to your account."],
          ].map(([title, description]) => (
            <div key={title} className="grid grid-cols-[180px_1fr] gap-5 px-4 py-3">
              <dt className="text-sm font-medium text-ink">{title}</dt>
              <dd className="text-sm leading-6 text-muted">{description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-muted">
          For full privacy details, contact <span className="font-medium text-ink">{SUPPORT_EMAIL}</span>.
        </p>
      </PageSection>
    </div>
  );

  const renderPostSettings = (post) => (
    <div className="w-72 space-y-4 p-1">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Post settings</p>
        {updatingPostId === post._id && <Spinner size="sm" />}
      </div>
      <Switch
        label="Hide like count"
        checked={Boolean(post.hideLike)}
        disabled={updatingPostId === post._id}
        onChange={(event) => handlePostSettingChange(post._id, "hideLike", event.target.checked)}
      />
      <Switch
        label="Disable sharing"
        checked={Boolean(post.disableShare)}
        disabled={updatingPostId === post._id}
        onChange={(event) => handlePostSettingChange(post._id, "disableShare", event.target.checked)}
      />
      <Switch
        label="Archive post"
        checked={Boolean(post.isArchived)}
        disabled={updatingPostId === post._id}
        onChange={(event) => handlePostSettingChange(post._id, "isArchived", event.target.checked)}
      />
      <Button
        size="sm"
        variant="dangerGhost"
        className="w-full"
        onClick={() => setPostToDelete(post)}
        disabled={updatingPostId === post._id}
      >
        <Trash2 className="size-4" /> Delete post
      </Button>
    </div>
  );

  const renderPostSection = () => {
    const overview = [
      ["Total posts", postSummary.total],
      ["Archived", postSummary.archived],
      ["Likes hidden", postSummary.hiddenLikes],
      ["Sharing disabled", postSummary.shareDisabled],
    ];

    return (
      <div className="mx-auto max-w-6xl px-8 py-4">
        <PageSection title="Post overview" description="Manage visibility and sharing for posts in your account.">
          <dl className="grid grid-cols-4 divide-x divide-line rounded-app border border-line bg-surface-muted">
            {overview.map(([label, value]) => (
              <div key={label} className="px-5 py-4">
                <dd className="text-2xl font-semibold text-ink">{value}</dd>
                <dt className="mt-1 text-xs text-muted">{label}</dt>
              </div>
            ))}
          </dl>
        </PageSection>

        <PageSection title="Your posts">
          {postLoading ? (
            <div className="grid grid-cols-2 gap-5">
              {[1, 2].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <div className="flex items-center gap-3 p-4"><Skeleton className="size-10 rounded-full" /><Skeleton className="h-4 w-36 rounded-control" /></div>
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-4"><Skeleton className="h-4 w-4/5 rounded-control" /></div>
                </Card>
              ))}
            </div>
          ) : myPosts.length === 0 ? (
            <EmptyState
              icon={Settings2}
              title="No posts yet"
              description="Posts you share will appear here with visibility and archive controls."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-5">
                {myPosts.map((post) => (
                  <Card key={post._id} className="overflow-visible">
                    <header className="flex items-start gap-3 p-4">
                      <Avatar src={authUser?.profilePic?.url} alt={authUser?.fullname || "Profile"} size="md" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-ink">{authUser?.fullname}</h3>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                          <MapPin className="size-3" /> {post.location?.name || "No location"}
                          <span className="mx-1">·</span>
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <DropdownMenu
                        trigger={
                          <Button iconOnly size="sm" variant="ghost" aria-label="Post settings">
                            <EllipsisVertical className="size-4" />
                          </Button>
                        }
                        className="w-80 p-3"
                      >
                        {renderPostSettings(post)}
                      </DropdownMenu>
                    </header>

                    <div className="aspect-[4/3] overflow-hidden bg-canvas">
                      <LoadableImage
                        src={post.image?.url}
                        alt={post.caption || "Post image"}
                        className="h-full w-full object-contain"
                        wrapperClassName="h-full w-full"
                      />
                    </div>

                    <div className="p-4">
                      <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted">
                        {post.caption || "No caption added for this post."}
                      </p>
                      <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs text-muted">
                        <span className="flex items-center gap-1.5"><Heart className="size-4 text-danger" /> {post.likesCount ?? 0} likes</span>
                        <span className="flex items-center gap-1.5"><Share2 className="size-4 text-brand-strong" /> {post.sharesCount ?? 0} shares</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {post.hideLike && <Badge>Likes hidden</Badge>}
                        {post.disableShare && <Badge>Sharing off</Badge>}
                        {post.isArchived && <Badge variant="warning"><Archive className="size-3" /> Archived</Badge>}
                        {!post.hideLike && !post.disableShare && !post.isArchived && <Badge variant="success">Active</Badge>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {hasMorePosts && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => loadMyPosts({ cursor: postCursor, reset: false })}
                    loading={isMorePostsLoading}
                  >
                    Load more posts
                  </Button>
                </div>
              )}
            </>
          )}
        </PageSection>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return renderAccountSection();
      case "posts":
        return renderPostSection();
      case "chats":
        return renderChatsSection();
      case "help":
        return renderHelpSection();
      default:
        return null;
    }
  };

  return (
    <AppPage contentClassName="max-w-none bg-surface">
      <div className="grid min-h-screen grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sticky top-0 flex h-screen flex-col border-r border-line bg-surface">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="m-4 flex items-center gap-3 rounded-app border border-line bg-surface-muted p-3 text-left transition hover:bg-surface-hover"
          >
            <Avatar src={authUser?.profilePic?.url} alt={authUser?.fullname || "Profile"} size="lg" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{authUser?.fullname}</span>
              <span className="mt-0.5 block truncate text-xs text-muted">{authUser?.bio}</span>
            </span>
          </button>

          <div className="border-t border-line px-3 py-4">
            <p className="mb-2 px-2 text-xs font-semibold text-subtle">Settings</p>
            <nav className="space-y-1" aria-label="Settings sections">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-control border-l-2 px-3 py-2.5 text-left transition",
                      isActive
                        ? "border-brand bg-brand-soft text-brand-strong"
                        : "border-transparent text-muted hover:bg-surface-hover hover:text-ink",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{item.label}</span>
                      <span className="mt-0.5 block truncate text-xs opacity-75">{item.description}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-line p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold text-danger transition hover:bg-danger-soft"
            >
              <LogOut className="size-4" /> Log out
            </button>
            <p className="mt-3 px-3 text-xs text-subtle">Kapota {APP_VERSION}</p>
          </div>
        </aside>

        <section className="min-w-0 bg-surface">
          <SettingsHeader item={activeItem} />
          {renderContent()}
        </section>
      </div>

      <Modal
        open={Boolean(postToDelete)}
        onClose={() => setPostToDelete(null)}
        title="Delete this post?"
        description="This permanently removes the post from your account and cannot be undone."
        size="sm"
        footer={
          <>
            <Button onClick={() => setPostToDelete(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={handleDeletePost}
              loading={updatingPostId === postToDelete?._id}
            >
              Delete post
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">The image, caption, likes, and shares will all be removed.</p>
      </Modal>

    </AppPage>
  );
}

export default Setting;
