import { useEffect, useCallback, useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bell,
  Clock3,
  CircleQuestionMark,
  EllipsisVerticalIcon,
  Heart,
  Key,
  Laptop2,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  RefreshCw,
  Send,
  Settings,
  Settings2,
  Share2,
  ShieldCheck,
  Trash2,
  Video,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { THEMES } from "../constants";
import { deletePost, getMyPosts, updatePostSettings } from "../lib/axios";
import { mergeUniqueById } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const previewMessages = [
  { id: 1, content: "Hey! How's it going", issent: false },
  {
    id: 2,
    content: "I'm doing great! just working on some new features",
    issent: true,
  },
];

const SUPPORT_EMAIL = "support@kapota.app";
const APP_VERSION = import.meta.env.VITE_APP_VERSION || "v1.0.0";
const HELP_TOPICS = [
  {
    title: "Account and profile",
    description: "Profile photo, bio, password help, and account controls.",
  },
  {
    title: "Chats and groups",
    description: "Theme, media, group actions, and conversation settings.",
  },
  {
    title: "Posts and sharing",
    description:
      "Explore feed, post settings, likes, shares, and archive help.",
  },
];

const settingsItems = [
  {
    id: 1,
    icon: Key,
    label: "Account",
    description: "Security notifications, account info",
  },
  {
    id: 2,
    icon: Settings2,
    label: "Post",
    description: "See posts, post setting",
  },
  // {
  //   id: 3,
  //   icon: Lock,
  //   label: "Privacy",
  //   description: "Blocked contacts, disappearing messages",
  // },
  {
    id: 4,
    icon: MessageCircle,
    label: "Chats",
    description: "Theme, wallpaper, chat settings",
  },
  // {
  //   id: 5,
  //   icon: Video,
  //   label: "Video & voice",
  //   description: "Camera, microphone & speakers",
  // },
  // {
  //   id: 6,
  //   icon: Bell,
  //   label: "Notifications",
  //   description: "Message notifications",
  // },
  {
    id: 8,
    icon: CircleQuestionMark,
    label: "Help and feedback",
    description: "Help centre, contact us, privacy policy",
  },
];

function SectionShell({ item, onBack, children }) {
  const Icon = item.icon;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-base-300 bg-base-100/90 px-5 py-5 backdrop-blur lg:px-8">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn btn-circle btn-ghost lg:hidden"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Icon className="size-6" />
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-base-content">
              {item.label}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-base-content/70">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 lg:p-8">{children}</div>
    </div>
  );
}

function Setting() {
  const [activeSection, setActiveSection] = useState("all");
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
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const { theme, setTheme } = useThemeStore();
  const {
    activeSessions,
    canManageDevices,
    authUser,
    deleteAccount,
    fetchActiveSessions,
    isDeletingAccount,
    isLoggingOutOthers,
    isSessionsLoading,
    logout,
    logoutOneSession,
    logoutOtherSessions,
    sessionActionId,
  } = useAuthStore();
  const navigate = useNavigate();

  const activeItem = useMemo(
    () => settingsItems.find((item) => item.label === activeSection) || null,
    [activeSection],
  );

  const postOverview = useMemo(
    () => ({
      total: postSummary.total,
      archived: postSummary.archived,
      hiddenLikes: postSummary.hiddenLikes,
      shareDisabled: postSummary.shareDisabled,
    }),
    [postSummary],
  );

  const otherSessionsCount = useMemo(
    () => activeSessions.filter((session) => !session.isCurrent).length,
    [activeSessions],
  );

  const loadMyPosts = useCallback(
    async ({ reset = false, cursor = null } = {}) => {
      try {
        if (reset) {
          setPostLoading(true);
        } else {
          setIsMorePostsLoading(true);
        }

        const response = await getMyPosts({
          cursor,
          limit: 12,
        });

        const nextPosts = response.posts || [];
        setMyPosts((prev) =>
          reset ? nextPosts : mergeUniqueById(prev, nextPosts),
        );
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
    }, []
  );

  useEffect(() => {
    if (activeSection === "Account") {
      fetchActiveSessions();
    }
  }, [activeSection, fetchActiveSessions]);

  useEffect(() => {
    if (activeSection === "Post") {
      setMyPosts([]);
      setPostCursor(null);
      setHasMorePosts(false);
      loadMyPosts({ reset: true });
    }
  }, [activeSection,loadMyPosts]);

  const handleItemClick = async (label) => {
    if (label === "Profile") {
      navigate("/profile");
      return;
    }

    if (label === "Logout") {
      try {
        await logout();
      } catch (error) {
        console.log(error);
      }
      return;
    }

    setActiveSection(label);
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
      setPostSummary((prev) => ({
        ...prev,
        archived:
          field === "isArchived"
            ? prev.archived + (checked ? 1 : -1)
            : prev.archived,
        hiddenLikes:
          field === "hideLike"
            ? prev.hiddenLikes + (checked ? 1 : -1)
            : prev.hiddenLikes,
        shareDisabled:
          field === "disableShare"
            ? prev.shareDisabled + (checked ? 1 : -1)
            : prev.shareDisabled,
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
      setMyPosts((prev) =>
        prev.filter((post) => post._id !== postToDelete._id),
      );
      setPostSummary((prev) => ({
        total: Math.max(prev.total - 1, 0),
        archived: Math.max(
          prev.archived - (postToDelete.isArchived ? 1 : 0),
          0,
        ),
        hiddenLikes: Math.max(
          prev.hiddenLikes - (postToDelete.hideLike ? 1 : 0),
          0,
        ),
        shareDisabled: Math.max(
          prev.shareDisabled - (postToDelete.disableShare ? 1 : 0),
          0,
        ),
      }));
      setPostToDelete(null);
      toast.success(response.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    } finally {
      setUpdatingPostId("");
    }
  };

  const closeDeleteAccountModal = () => {
    if (isDeletingAccount) return;
    setDeleteAccountPassword("");
    setIsDeleteAccountModalOpen(false);
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountPassword.trim()) {
      toast.error("Password is required");
      return;
    }

    const isDeleted = await deleteAccount({ password: deleteAccountPassword });
    if (isDeleted) {
      closeDeleteAccountModal();
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
    <SectionShell item={activeItem} onBack={() => setActiveSection("all")}>
      <div className="mx-auto w-full max-w-[1120px] px-3 sm:px-5 lg:px-6">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,740px)_320px] xl:justify-center">
          {/* Main content */}
          <div className="space-y-5">
            <div className="overflow-hidden rounded-3xl border border-base-300/70 bg-base-100 shadow-sm">
              <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-7">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Laptop2 className="size-6" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold sm:text-2xl">
                      Active devices
                    </h2>

                    <p className="mt-1 max-w-2xl text-sm leading-6 text-base-content/65 sm:text-[15px]">
                      See where your account is currently logged in and remove
                      devices you no longer use.
                    </p>
                  </div>
                </div>

                {/* Notice */}
                <div className="rounded-2xl border border-base-300/60 bg-base-200/40 px-4 py-3 text-sm leading-6 text-base-content/70">
                  {canManageDevices
                    ? "Oldest non-primary devices are removed automatically when a new login goes over your device limit."
                    : "Device management is available from your primary device."}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 border-t border-base-300/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm w-full sm:btn-md sm:w-auto"
                    onClick={fetchActiveSessions}
                    disabled={isSessionsLoading}
                  >
                    <RefreshCw
                      className={`size-4 ${isSessionsLoading ? "animate-spin" : ""
                        }`}
                    />
                    Refresh
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-error btn-sm w-full sm:btn-md sm:w-auto"
                    onClick={logoutOtherSessions}
                    disabled={
                      !canManageDevices ||
                      isLoggingOutOthers ||
                      otherSessionsCount === 0
                    }
                  >
                    {isLoggingOutOthers ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      <LogOut className="size-4" />
                    )}

                    <span className="truncate">Log out other devices</span>
                  </button>
                </div>

                {/* Loading */}
                {isSessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="rounded-3xl border border-base-300/70 p-4 sm:p-5"
                      >
                        <div className="flex items-start gap-4">
                          <div className="skeleton h-12 w-12 shrink-0 rounded-2xl"></div>
                          <div className="min-w-0 flex-1">
                            <div className="skeleton h-5 w-44 max-w-full"></div>
                            <div className="mt-4 grid gap-0 overflow-hidden rounded-2xl border border-base-300/50 sm:grid-cols-3">
                              <div className="p-3">
                                <div className="skeleton h-3 w-20"></div>
                                <div className="skeleton mt-2 h-4 w-28"></div>
                              </div>
                              <div className="border-t border-base-300/50 p-3 sm:border-l sm:border-t-0">
                                <div className="skeleton h-3 w-20"></div>
                                <div className="skeleton mt-2 h-4 w-28"></div>
                              </div>
                              <div className="border-t border-base-300/50 p-3 sm:border-l sm:border-t-0">
                                <div className="skeleton h-3 w-20"></div>
                                <div className="skeleton mt-2 h-4 w-28"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeSessions.length === 0 ? (
                  /* Empty state */
                  <div className="rounded-3xl border border-dashed border-base-300 px-5 py-14 text-center">
                    <ShieldCheck className="mx-auto size-11 text-base-content/35" />

                    <h3 className="mt-4 text-lg font-semibold">
                      No active devices
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-base-content/65">
                      Once you log in, your current device sessions will appear
                      here.
                    </p>
                  </div>
                ) : (
                  /* Sessions */
                  <div className="space-y-4">
                    {activeSessions.map((session) => (
                      <div
                        key={session._id}
                        className={`group rounded-3xl border p-4 transition-all duration-200 sm:p-5 lg:p-6 ${session.isCurrent || session.isPrimaryDevice
                            ? "border-primary/40 bg-primary/[0.04] shadow-sm"
                            : "border-base-300/70 bg-base-100 hover:border-base-300 hover:shadow-sm"
                          }`}
                      >
                        <div className="flex flex-col gap-5">
                          {/* Top */}
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex min-w-0 items-start gap-4">
                              <div
                                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${session.isCurrent
                                    ? "bg-primary/10 text-primary"
                                    : session.isPrimaryDevice
                                      ? "bg-primary/8 text-primary"
                                      : "bg-base-200 text-base-content/70"
                                  }`}
                              >
                                <Laptop2 className="size-5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="truncate text-base font-semibold sm:text-lg">
                                    {session.deviceName || "Unknown device"}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {!session.isCurrent && (
                              <button
                                type="button"
                                className="btn btn-outline btn-error btn-sm w-full lg:w-auto"
                                onClick={() => logoutOneSession(session._id)}
                                disabled={
                                  !canManageDevices ||
                                  sessionActionId === session._id
                                }
                              >
                                {sessionActionId === session._id ? (
                                  <span className="loading loading-spinner loading-sm"></span>
                                ) : (
                                  <LogOut className="size-4" />
                                )}
                                Log out
                              </button>
                            )}
                          </div>

                          {/* Stats */}
                          <div className="grid overflow-hidden rounded-2xl border border-base-300/60 bg-base-100 sm:grid-cols-2 xl:grid-cols-3">
                            <div className="p-4">
                              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/45">
                                <Clock3 className="size-3.5 shrink-0" />
                                Last active
                              </div>

                              <p className="mt-1.5 text-sm font-medium text-base-content/80">
                                {formatSessionTime(session.lastSeenAt)}
                              </p>
                            </div>

                            <div className="border-t border-base-300/60 p-4 sm:border-l sm:border-t-0">
                              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/45">
                                <ShieldCheck className="size-3.5 shrink-0" />
                                Logged in
                              </div>

                              <p className="mt-1.5 text-sm font-medium text-base-content/80">
                                {formatSessionTime(session.createdAt)}
                              </p>
                            </div>

                            <div className="border-t border-base-300/60 p-4 sm:col-span-2 xl:col-span-1 xl:border-l xl:border-t-0">
                              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/45">
                                <MapPin className="size-3.5 shrink-0" />
                                Network
                              </div>

                              <p className="mt-1.5 truncate text-sm font-medium text-base-content/80">
                                {session.ipAddress || "IP unavailable"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="xl:sticky xl:self-start">
            <div className="rounded-3xl border border-error/25 bg-base-100 shadow-sm">
              <div className="flex flex-col gap-5 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-semibold text-error sm:text-xl">
                    Delete account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-base-content/68">
                    Permanently remove your account, your posts, and your direct
                    conversations. This action cannot be undone.
                  </p>
                </div>

                <div className="rounded-2xl border border-error/10 bg-error/7 p-4 text-sm leading-6 text-base-content/75">
                  You will be signed out immediately after the account is
                  deleted.
                </div>

                <button
                  type="button"
                  className="btn btn-error w-full"
                  onClick={() => setIsDeleteAccountModalOpen(true)}
                >
                  <Trash2 className="size-4" />
                  Delete account
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SectionShell>
  );

  const renderChatsSection = () => (
    <SectionShell item={activeItem} onBack={() => setActiveSection("all")}>
      <div className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-6">
              <div>
                <h2 className="card-title text-lg">Theme</h2>
                <p className="text-sm text-base-content/70">
                  Choose a theme for your chat interface.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 xl:grid-cols-5">
                {THEMES.map((itemTheme) => (
                  <button
                    key={itemTheme}
                    type="button"
                    className={`group rounded-2xl border p-2 transition ${theme === itemTheme
                        ? "border-primary bg-primary/10"
                        : "border-base-300 bg-base-100 hover:border-base-content/20 hover:bg-base-200/60"
                      }`}
                    onClick={() => setTheme(itemTheme)}
                  >
                    <div
                      className="relative h-10 w-full overflow-hidden rounded-xl"
                      data-theme={itemTheme}
                    >
                      <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                      </div>
                    </div>
                    <span className="mt-2 block truncate text-[11px] font-medium">
                      {itemTheme.charAt(0).toUpperCase() + itemTheme.slice(1)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <div>
                <h2 className="card-title text-lg">Preview</h2>
                <p className="text-sm text-base-content/70">
                  A quick look at how chats feel with the current theme.
                </p>
              </div>

              <div className="overflow-hidden rounded-3xl border border-base-300 bg-base-200">
                <div className="border-b border-base-300 bg-base-100 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-medium text-primary-content">
                      J
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-base-100 p-4">
                  {previewMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.issent ? "justify-end" : "justify-start"
                        }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-3 text-sm shadow-sm ${message.issent
                            ? "bg-primary text-primary-content"
                            : "bg-base-200 text-base-content"
                          }`}
                      >
                        <p>{message.content}</p>
                        <p
                          className={`mt-1 text-[10px] ${message.issent
                              ? "text-primary-content/70"
                              : "text-base-content/70"
                            }`}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-base-300 bg-base-100 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm"
                      value="This is a preview"
                      readOnly
                    />
                    <button type="button" className="btn btn-primary">
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderHelpSection = () => (
    <SectionShell item={activeItem} onBack={() => setActiveSection("all")}>
      <div className="space-y-6">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="card-title text-2xl">We are here to help</h2>
                <p className="mt-2 text-sm leading-6 text-base-content/70">
                  Find quick guidance for common parts of Kapota, contact
                  support, and share feedback that helps us improve the app.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEmailSupport}
              >
                <Send className="size-4" />
                Email support
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopySupportEmail}
              >
                <CircleQuestionMark className="size-4" />
                Copy support email
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CircleQuestionMark className="size-5" />
                </div>
                <div>
                  <h3 className="card-title text-base">Help centre</h3>
                  <p className="text-sm leading-6 text-base-content/70">
                    Start with the most common areas users usually need help
                    with.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {HELP_TOPICS.map((topic) => (
                  <div
                    key={topic.title}
                    className="rounded-2xl border border-base-300 bg-base-100 p-4"
                  >
                    <h4 className="font-medium text-base-content">
                      {topic.title}
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-base-content/70">
                      {topic.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <h3 className="card-title text-base">Feedback and support</h3>
                  <p className="text-sm leading-6 text-base-content/70">
                    Report bugs, request features, or send product feedback with
                    a little context so we can help faster.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl bg-base-200/70 p-5">
                <p className="text-sm font-medium text-base-content">
                  Best things to include in your message
                </p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-base-content/70">
                  <p>- What you were trying to do</p>
                  <p>- What happened instead</p>
                  <p>- Device, browser, and screenshots if available</p>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-outline w-fit"
                onClick={handleEmailSupport}
              >
                <Send className="size-4" />
                Send feedback
              </button>
            </div>
          </div>

          <div className="card border border-base-300 bg-base-100 shadow-sm xl:col-span-2">
            <div className="card-body gap-5">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h3 className="card-title text-base">Privacy policy</h3>
                  <p className="text-sm leading-6 text-base-content/70">
                    A quick summary of the areas people usually look for before
                    reaching out.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-base-300 p-4">
                  <p className="text-sm font-medium">Account data</p>
                  <p className="mt-1 text-sm leading-6 text-base-content/70">
                    Profile information like name, bio, email, and profile
                    photo.
                  </p>
                </div>
                <div className="rounded-2xl border border-base-300 p-4">
                  <p className="text-sm font-medium">Chats and media</p>
                  <p className="mt-1 text-sm leading-6 text-base-content/70">
                    Messages, shared images, and conversation details inside the
                    app.
                  </p>
                </div>
                <div className="rounded-2xl border border-base-300 p-4">
                  <p className="text-sm font-medium">Posts and activity</p>
                  <p className="mt-1 text-sm leading-6 text-base-content/70">
                    Posts, likes, shares, and related explore activity tied to
                    your account.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-base-300 px-4 py-3 text-sm leading-6 text-base-content/70">
                Need the full privacy details? Reach us at{" "}
                <span className="font-medium text-base-content">
                  {SUPPORT_EMAIL}
                </span>
                .
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );

  const renderGenericSection = () => {
    const highlights = activeItem.description
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const Icon = activeItem.icon;

    return (
      <SectionShell item={activeItem} onBack={() => setActiveSection("all")}>
        <div className="grid gap-4 xl:grid-cols-2">
          {highlights.map((highlight) => (
            <div
              key={highlight}
              className="card border border-base-300 bg-base-100 shadow-sm"
            >
              <div className="card-body">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="card-title text-base">{highlight}</h3>
                    <p className="text-sm leading-6 text-base-content/70">
                      {activeItem.label} controls for {highlight.toLowerCase()}{" "}
                      can live here while keeping the same section-based
                      settings flow.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="card border border-dashed border-base-300 bg-base-100 shadow-sm xl:col-span-2">
            <div className="card-body">
              <h3 className="card-title text-base">Section Summary</h3>
              <p className="text-sm leading-6 text-base-content/70">
                This page now follows your switch-based navigation, and the UI
                for each section is shaped directly from the section label and
                description so it stays consistent as you add more settings.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>
    );
  };

  const renderPostSection = () => (
    <SectionShell item={activeItem} onBack={() => setActiveSection("all")}>
      <div className="space-y-6">
        <div className="stats stats-vertical border border-base-300 bg-base-100 shadow-sm lg:stats-horizontal">
          <div className="stat">
            <div className="stat-title">Total posts</div>
            <div className="stat-value text-3xl">{postOverview.total}</div>
            <div className="stat-desc">All uploads in your account</div>
          </div>
          <div className="stat">
            <div className="stat-title">Archived</div>
            <div className="stat-value text-3xl">{postOverview.archived}</div>
            <div className="stat-desc">Posts hidden from the feed</div>
          </div>
          <div className="stat">
            <div className="stat-title">Likes hidden</div>
            <div className="stat-value text-3xl">
              {postOverview.hiddenLikes}
            </div>
            <div className="stat-desc">Posts with hidden like count</div>
          </div>
          <div className="stat">
            <div className="stat-title">Share disabled</div>
            <div className="stat-value text-3xl">
              {postOverview.shareDisabled}
            </div>
            <div className="stat-desc">Posts not allowed to share</div>
          </div>
        </div>

        {postLoading ? (
          <div className="grid gap-5 xl:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="card border border-base-300 bg-base-100 shadow-sm"
              >
                <div className="card-body gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="skeleton h-5 w-40"></div>
                      <div className="skeleton h-4 w-28"></div>
                    </div>
                    <div className="skeleton h-10 w-10 rounded-full"></div>
                  </div>
                  <div className="skeleton h-72 w-full rounded-3xl"></div>
                  <div className="skeleton h-16 w-full rounded-2xl"></div>
                  <div className="skeleton h-24 w-full rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : myPosts.length === 0 ? (
          <div className="card border border-dashed border-base-300 bg-base-100 shadow-sm">
            <div className="card-body items-center py-16 text-center">
              <Settings2 className="size-14 text-base-content/35" />
              <h2 className="mt-2 text-xl font-semibold">No posts yet</h2>
              <p className="max-w-md text-sm leading-6 text-base-content/70">
                Once you share posts, they will show up here with quick controls
                for likes, sharing, archive state, and delete.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-5 xl:grid-cols-2">
              {myPosts.map((post) => (
                <div
                  key={post._id}
                  className="card border border-base-300 bg-base-100 shadow-sm"
                >
                  <div className="card-body gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="card-title text-lg">
                          {authUser.fullname}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-base-content/70">
                          <span className="badge badge-ghost gap-1">
                            <MapPin className="size-3.5" />
                            {post.location?.name || "No location"}
                          </span>
                          <span className="badge badge-outline">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="dropdown dropdown-end">
                        <button
                          type="button"
                          tabIndex={0}
                          className="btn btn-circle btn-ghost btn-sm"
                        >
                          <EllipsisVerticalIcon className="size-5" />
                        </button>

                        <div
                          tabIndex={0}
                          className="dropdown-content z-[1] mt-3 w-72 rounded-box border border-base-300 bg-base-100 p-3 shadow-xl"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-semibold">
                              Post settings
                            </p>
                            {updatingPostId === post._id && (
                              <span className="loading loading-spinner loading-xs"></span>
                            )}
                          </div>

                          <div className="space-y-2">
                            <label className="flex cursor-pointer items-center justify-between rounded-box bg-base-200/70 px-3 py-3">
                              <div>
                                <p className="text-sm font-medium">Hide like</p>
                                <p className="text-xs text-base-content/60">
                                  Hide like count on this post
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={post.hideLike}
                                disabled={updatingPostId === post._id}
                                onChange={(e) =>
                                  handlePostSettingChange(
                                    post._id,
                                    "hideLike",
                                    e.target.checked,
                                  )
                                }
                              />
                            </label>

                            <label className="flex cursor-pointer items-center justify-between rounded-box bg-base-200/70 px-3 py-3">
                              <div>
                                <p className="text-sm font-medium">
                                  Disable shared
                                </p>
                                <p className="text-xs text-base-content/60">
                                  Stop other users from sharing this post
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={post.disableShare}
                                disabled={updatingPostId === post._id}
                                onChange={(e) =>
                                  handlePostSettingChange(
                                    post._id,
                                    "disableShare",
                                    e.target.checked,
                                  )
                                }
                              />
                            </label>

                            <label className="flex cursor-pointer items-center justify-between rounded-box bg-base-200/70 px-3 py-3">
                              <div>
                                <p className="text-sm font-medium">
                                  isArchived
                                </p>
                                <p className="text-xs text-base-content/60">
                                  Keep the post but hide it from explore feed
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-sm"
                                checked={post.isArchived}
                                disabled={updatingPostId === post._id}
                                onChange={(e) =>
                                  handlePostSettingChange(
                                    post._id,
                                    "isArchived",
                                    e.target.checked,
                                  )
                                }
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setPostToDelete(post)}
                              className="btn btn-error btn-outline btn-sm mt-2 w-full"
                              disabled={updatingPostId === post._id}
                            >
                              <Trash2 className="size-4" />
                              Delete post
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[1.75rem] bg-base-200">
                      <img
                        src={post.image?.url}
                        alt={post.caption || "Post image"}
                        className="max-h-[28rem] w-full object-contain"
                        loading="lazy"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/50">
                        Caption
                      </p>
                      <p className="text-sm leading-6 text-base-content/80">
                        {post.caption || "No caption added for this post."}
                      </p>
                    </div>

                    <div className="stats stats-horizontal w-full border border-base-300 bg-base-100 shadow-none">
                      <div className="stat px-4 py-3">
                        <div className="stat-figure text-error">
                          <Heart className="size-5" />
                        </div>
                        <div className="stat-title">Like</div>
                        <div className="stat-value text-lg">
                          {post.likesCount ?? 0}
                        </div>
                      </div>

                      <div className="stat px-4 py-3">
                        <div className="stat-figure text-primary">
                          <Share2 className="size-5" />
                        </div>
                        <div className="stat-title">Shared</div>
                        <div className="stat-value text-lg">
                          {post.sharesCount ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {post.hideLike && (
                        <span className="badge badge-outline">
                          Hide like on
                        </span>
                      )}
                      {post.disableShare && (
                        <span className="badge badge-outline">
                          Shared disabled
                        </span>
                      )}
                      {post.isArchived && (
                        <span className="badge badge-neutral gap-1">
                          <Archive className="size-3.5" />
                          Archived
                        </span>
                      )}
                      {!post.hideLike &&
                        !post.disableShare &&
                        !post.isArchived && (
                          <span className="badge badge-success badge-outline">
                            Active post
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {hasMorePosts && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    loadMyPosts({ cursor: postCursor, reset: false })
                  }
                  disabled={isMorePostsLoading}
                  className="btn btn-outline"
                >
                  {isMorePostsLoading ? "Loading..." : "Load more posts"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </SectionShell>
  );

  const renderContent = () => {
    if (!activeItem) return null;

    switch (activeSection) {
      case "Account":
        return renderAccountSection();
      case "Help and feedback":
        return renderHelpSection();
      case "Chats":
        return renderChatsSection();
      case "Post":
        return renderPostSection();
      default:
        return renderGenericSection();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-base-100 pt-[72px] lg:grid lg:grid-cols-[390px_1fr]">
        <div
          className={`${activeSection === "all" ? "flex" : "hidden lg:flex"
            } flex-col border-r border-base-300`}
        >
          <div
            className="mx-3 mt-5 flex cursor-pointer items-center gap-4 rounded-3xl p-4 transition hover:bg-base-200/60"
            onClick={() => handleItemClick("Profile")}
          >
            <img
              src={authUser.profilePic.url}
              alt={authUser.fullname}
              className="h-14 w-14 rounded-full object-cover md:h-16 md:w-16"
            />

            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-semibold md:text-lg">
                {authUser.fullname}
              </div>
              <div className="truncate text-sm text-base-content/70">
                {authUser.bio}
              </div>
            </div>
          </div>

          <div className="divider mx-5 my-5"></div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {settingsItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.label;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemClick(item.label)}
                  className={`mb-2 flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left transition ${isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-base-200/70"
                    }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isActive
                        ? "bg-primary text-primary-content"
                        : "bg-base-200 text-base-content/75"
                      }`}
                  >
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-base-content">
                      {item.label}
                    </div>
                    <div className="truncate text-sm text-base-content/65">
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="divider mx-5 my-5"></div>

          <div className="px-3 pb-4">
            <button
              type="button"
              onClick={() => handleItemClick("Logout")}
              className="flex w-full items-center gap-4 rounded-3xl px-4 py-4 text-left text-error transition hover:bg-error/10"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-error/10">
                <ArrowRight className="size-5" />
              </div>
              <div className="font-medium">Log out</div>
            </button>
          </div>
        </div>

        {activeSection !== "all" && (
          <div className="lg:hidden">{renderContent()}</div>
        )}

        <div className="hidden bg-base-200/40 lg:flex lg:min-h-0 lg:flex-col">
          {activeSection === "all" ? (
            <div className="flex h-full items-center justify-center p-10">
              <div className="max-w-2xl text-center">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-primary/10 text-primary">
                  <Settings className="size-14" />
                </div>
                <h2 className="mt-8 text-4xl font-semibold">Settings</h2>
                <p className="mt-3 text-base leading-7 text-base-content/70">
                  Pick a section from the left to manage account preferences,
                  post controls, privacy, chat theme, and more.
                </p>
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {settingsItems.slice(0, 4).map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-base-300 bg-base-100 p-5 text-left shadow-sm"
                      >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold">
                          {item.label}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-base-content/70">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </div>

      {postToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-semibold">Delete this post?</h3>
            <p className="py-3 text-sm leading-6 text-base-content/70">
              This will permanently remove the post from your account. You
              cannot undo this action.
            </p>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleDeletePost}
                disabled={updatingPostId === postToDelete._id}
              >
                {updatingPostId === postToDelete._id && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                Delete post
              </button>
            </div>
          </div>

          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setPostToDelete(null)}
          >
            close
          </button>
        </div>
      )}

      {isDeleteAccountModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-semibold text-error">
              Delete account?
            </h3>
            <p className="py-3 text-sm leading-6 text-base-content/70">
              Enter your password to permanently remove this account. Your posts
              and direct conversations will be deleted as part of this action.
            </p>

            <label className="form-control">
              <span className="label-text mb-2 text-sm font-medium">
                Confirm password
              </span>
              <input
                type="password"
                className="input input-bordered w-full"
                value={deleteAccountPassword}
                onChange={(e) => setDeleteAccountPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
              />
            </label>

            <div className="modal-action">
              <button
                type="button"
                className="btn"
                onClick={closeDeleteAccountModal}
                disabled={isDeletingAccount}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount && (
                  <span className="loading loading-spinner loading-xs"></span>
                )}
                Delete account
              </button>
            </div>
          </div>

          <button
            type="button"
            className="modal-backdrop"
            onClick={closeDeleteAccountModal}
          >
            close
          </button>
        </div>
      )}
    </>
  );
}

export default Setting;
