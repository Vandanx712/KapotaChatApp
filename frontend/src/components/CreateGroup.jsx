import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image,
  Search,
  SmileIcon,
  X,
} from "lucide-react";
import { useEffect, useCallback, useState } from "react";
import { createGroup, getAllUsers } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import SectionLoader from "./common/SectionLoader";
import BusyOverlay from "./common/BusyOverlay";
import { mergeUniqueById } from "../lib/utils";
import { Avatar, Badge, Button, Checkbox, Input, Modal } from "./ui";
import { useThemeStore } from "../store/useThemeStore";

function CreateGroup({ onClose }) {
  const { authUser } = useAuthStore();
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [groupForm, setGroupForm] = useState(false);
  const [participants, setParticipants] = useState([
    {
      userId: authUser._id,
      role: "admin",
    },
  ]);
  const [groupname, setGroupname] = useState("");
  const [groupicon, setGroupIcon] = useState(null);
  const [showPicker, setShowPicker] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [isMoreUsersLoading, setIsMoreUsersLoading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [usersCursor, setUsersCursor] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const theme = useThemeStore((state) => state.theme);

  const loadusers = useCallback(async ({ reset = false, cursor = null } = {}) => {
    try {
      if (reset) {
        setIsUsersLoading(true);
      } else {
        setIsMoreUsersLoading(true);
      }

      const resdata = await getAllUsers({
        cursor,
        limit: 30,
      });

      const nextUsers = resdata.users || [];
      setUsers((prev) => (reset ? nextUsers : mergeUniqueById(prev, nextUsers)));
      setUsersCursor(resdata.nextCursor ?? null);
      setHasMoreUsers(Boolean(resdata.hasMore));
    } catch (error) {
      console.log(error);
    } finally {
      setIsUsersLoading(false);
      setIsMoreUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    loadusers({ reset: true });
  }, [loadusers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const filteredUsers = users.filter((user) => {
    return (user.fullname || "")
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
  });

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((member) => member._id !== id));
    setParticipants((prev) => prev.filter((member) => member.userId !== id));
  };

  const handleProfilePic = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      e.target.value = "";
      return;
    }
    if (file.size > 9 * 1024 * 1024) {
      toast.error("Image must be smaller than 9 MB");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setGroupIcon(base64Image);
    };
  };

  const onEmojiClick = (emojiData) => {
    setGroupname((prev) => prev + emojiData.emoji);
  };

  const handleSave = async () => {
    if (!groupicon) return toast.error("Group icon must be required");
    if (!groupname) return toast.error("Group name must be required");
    const mistake = participants.filter((par) => !par.userId || !par.role);
    if (mistake.length > 0) return toast.error("Some miss in member");
    try {
      setIsCreatingGroup(true);
      const resdata = await createGroup({
        groupname: groupname.trim(),
        groupIcon: groupicon,
        participants: participants,
      });
      toast.success(resdata.message);
      onClose();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  return (
    <div className="relative flex h-full flex-col bg-surface">
      <BusyOverlay
        show={isCreatingGroup}
        label="Creating group..."
      />
      <div className={`${groupForm ? "hidden" : "flex h-full flex-col"}`}>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
          <Button iconOnly size="sm" variant="ghost" onClick={onClose} aria-label="Back">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-ink">Add group members</h2>
            <p className="mt-0.5 text-xs text-muted">{members.length} selected</p>
          </div>
        </header>
        <div className="shrink-0 px-4 py-3">
          <Input
            icon={Search}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search people"
          />
        </div>
        {members.length > 0 && (
          <div className="ui-scrollbar flex max-h-20 shrink-0 flex-wrap gap-1.5 overflow-y-auto border-y border-line bg-surface-muted px-4 py-2">
            {members.map((mem) => (
              <Badge
                key={mem._id}
                variant="brand"
                className="h-7 gap-1.5 pr-1"
              >
                <span className="max-w-24 truncate">{mem.fullname}</span>
                <button
                  type="button"
                  onClick={() => removeMember(mem._id)}
                  className="flex size-5 items-center justify-center rounded-full hover:bg-brand/15"
                  aria-label={`Remove ${mem.fullname}`}
                >
                  <X className="size-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="ui-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
          <SectionLoader
            loading={isUsersLoading}
            label="Loading users..."
            minHeight={180}
          >
            <>
              {filteredUsers.map((user) => (
                <button
                  type="button"
                  key={user._id}
                  onClick={() => {
                    if (!members.find((m) => m._id === user._id)) {
                      setMembers((prev) => [...prev, user]);
                      setParticipants((prev) => [
                        ...prev,
                        { userId: user._id, role: "member" },
                      ]);
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-control p-3 text-left transition hover:bg-surface-hover"
                >
                  <Avatar src={user?.profilePic?.url} alt={user.fullname} size="lg" />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-ink">
                      {user.fullname}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">
                      {user.bio}
                    </div>
                  </div>
                  {members.some((member) => member._id === user._id) && <Check className="size-4 text-brand-strong" />}
                </button>
              ))}
              {hasMoreUsers && (
                <div className="flex justify-center px-2 py-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      loadusers({ cursor: usersCursor, reset: false })
                    }
                    loading={isMoreUsersLoading}
                  >
                    Load more people
                  </Button>
                </div>
              )}
            </>
          </SectionLoader>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-line p-4">
          <Button
            variant="primary"
            disabled={members.length === 0}
            onClick={() => setGroupForm(true)}
          >
            Continue <ArrowRight className="size-4" />
          </Button>
        </footer>
      </div>

      <div className={`${!groupForm ? "hidden" : "flex h-full flex-col"}`}>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-4">
          <Button
            iconOnly
            size="sm"
            variant="ghost"
            onClick={() => {
              setGroupForm(false);
              setGroupname("");
              setGroupIcon(null);
              setParticipants([]);
            }}
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold text-ink">Group details</h2>
            <p className="mt-0.5 text-xs text-muted">Name your new conversation</p>
          </div>
        </header>

        <div className="ui-scrollbar min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar src={groupicon} alt="Group" size="xl" />
              <Button
                iconOnly
                size="sm"
                variant="primary"
                className="absolute -bottom-1 -right-1 rounded-full"
                onClick={() => document.getElementById("create-group-icon-upload")?.click()}
                aria-label="Choose group icon"
              >
                <Image className="size-4" />
              </Button>
              <input
                type="file"
                id="create-group-icon-upload"
                className="hidden"
                accept="image/*"
                onChange={handleProfilePic}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-ink">Group name</label>
            <Input
                type="text"
                value={groupname}
                onChange={(e) => setGroupname(e.target.value)}
                placeholder="Enter a group name"
                trailing={
                  <Button iconOnly size="xs" variant="ghost" onClick={() => setShowPicker(true)} aria-label="Add emoji">
                    <SmileIcon className="size-4" />
                  </Button>
                }
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">Group members</p>
            <div className="ui-scrollbar max-h-52 space-y-1 overflow-y-auto">
              {members.map((par) => (
                <div
                  key={par._id}
                  className="flex items-center justify-between gap-2 rounded-control bg-surface-muted p-2.5"
                >
                  <span className="truncate text-sm font-medium">{par.fullname}</span>
                  <Checkbox
                      label="Admin"
                      checked={
                        participants.find((p) => p.userId === par._id)?.role ==
                        "admin"
                      }
                      onChange={(e) => {
                        setParticipants((prev) =>
                          prev.map((p) =>
                            p.userId === par._id
                              ? {
                                ...p,
                                role: e.target.checked ? "admin" : "member",
                              }
                              : p,
                          ),
                        );
                      }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 justify-end border-t border-line p-4">
          <Button
            onClick={handleSave}
            variant="primary"
            loading={isCreatingGroup}
            disabled={members.length === 0 || isCreatingGroup}
          >
            <Check className="size-4" /> Create group
          </Button>
        </footer>
      </div>
      <Modal open={Boolean(showPicker)} onClose={() => setShowPicker("")} title="Add an emoji" size="sm" className="w-auto">
            <div className="overflow-hidden rounded-control border border-line">
              <EmojiPicker
                onEmojiClick={(emojiData) => onEmojiClick(emojiData)}
                theme={theme}
                autoFocusSearch={true}
                width={350}
                height={400}
                lazyLoadEmojis={true}
              />
            </div>
      </Modal>
    </div>
  );
}

export default CreateGroup;
