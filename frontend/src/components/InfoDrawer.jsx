import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleSlash2,
  Edit,
  Image,
  LucideArrowRightFromLine,
  MinusCircle,
  SmileIcon,
  Trash2Icon,
  User2Icon,
  UserPlusIcon,
  VideoIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { PhotoProvider, PhotoView } from "react-photo-view";
import "react-photo-view/dist/react-photo-view.css";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmDialog from "./common/ConfirmDialog";
import SectionLoader from "./common/SectionLoader";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  Input,
  Modal,
  Tooltip,
} from "./ui";
import { useThemeStore } from "../store/useThemeStore";
import { useCallStore } from "../store/useCallStore";

const cardClass = "border-t border-line p-5";

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold text-ink">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-xs leading-5 text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function ActionTile({ icon, label, onClick }) {
  const IconComponent = icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-control border border-danger/10 bg-danger-soft/50 px-3 py-2.5 text-danger transition hover:bg-danger-soft"
    >
      <IconComponent className="size-5" />
      <span className="min-w-0 text-sm font-medium">{label}</span>
    </button>
  );
}

function MediaSlider({ mediaFiles, getImgMessages = () => { } }) {
  const sliderRef = useRef(null);

  const handleScroll = (direction) => {
    sliderRef.current?.scrollBy({
      left: direction * 180,
      behavior: "smooth",
    });
  };

  return (
    <section className={cardClass}>
      <SectionTitle
        title="Media"
        subtitle={`${mediaFiles.length} shared ${mediaFiles.length === 1 ? "item" : "items"
          }`}
        action={
          <div className="flex items-center gap-1">
            <Button
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => {
                handleScroll(-1);
                getImgMessages();
              }}
              aria-label="Previous media"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              iconOnly
              size="xs"
              variant="ghost"
              onClick={() => handleScroll(1)}
              aria-label="Next media"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        }
      />
      {mediaFiles.length > 0 ? (
        <div
          ref={sliderRef}
          className="no-scrollbar mt-3 flex gap-2 overflow-x-auto scroll-smooth"
        >
          <PhotoProvider>
            {mediaFiles.map((file) => (
              <PhotoView key={file?.key || file?.url} src={file?.url}>
                <img
                  src={file?.url}
                  alt=""
                  className="size-20 shrink-0 cursor-pointer rounded-control border border-line object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </PhotoView>
            ))}
          </PhotoProvider>
        </div>
      ) : (
        <EmptyState
          icon={CircleSlash2}
          title="No shared media"
          description="Images from this conversation will appear here."
          className="py-7"
        />
      )}
    </section>
  );
}

function InfoDrawer({ conversation, onClose }) {
  const isGroup = conversation?.isgroup;
  const [confirmation, setConfirmation] = useState(null);
  const navigate = useNavigate();
  const {
    setDeleteChat,
    clearAllMsg,
    udGroupDetail,
    setOtherUsers,
    loadMoreOtherUsers,
    otherUsers,
    isOtherUsersLoading,
    isMoreOtherUsersLoading,
    hasMoreOtherUsers,
    upGroupMember,
    ExitGroup,
    mediaImgs,
    getImgMessages,
    resetImgMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const startOutgoingCall = useCallStore((state) => state.startOutgoingCall);

  const mediaFiles = mediaImgs;

  useEffect(() => {
    if (!conversation.isgroup) return;
    setOtherUsers(conversation.conversationId);
  }, [conversation.conversationId, conversation.isgroup, setOtherUsers]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleDeleteChat = async () => {
    const deleted = await setDeleteChat(conversation.conversationId);
    if (deleted) onClose();
  };

  useEffect(() => {
    if (!conversation?.conversationId) return;
    resetImgMessages();
    getImgMessages();
  }, [
    conversation?.conversationId,
    getImgMessages,
    resetImgMessages,
  ]);

  function GroupInfo({ group, onClose, requestConfirmation }) {
    const [groupForm, setGroupForm] = useState(false);
    const [groupicon, setGroupIcon] = useState("");
    const [showPicker, setShowPicker] = useState(false);
    const [showUser, setShowUser] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [members, setMembers] = useState([]);
    const [tempData, setTempData] = useState({});

    const groupNameRef = useRef();
    const myrole = group?.membersDetail?.[authUser._id]?.role || "member";

    useEffect(() => {
      if (!group?.membersDetail) return;

      const participantsArray = Object.entries(group.membersDetail)
        .map(([id, data]) => ({
          userId: id,
          role: data.role,
        }))
        .sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (a.role !== "admin" && b.role === "admin") return 1;
          return 0;
        });

      setParticipants(participantsArray);
    }, [group]);

    const onEmojiClick = (emojiData) => {
      groupNameRef.current.value += emojiData.emoji;
      setShowPicker(!showPicker);
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

      setGroupForm(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result;
        setGroupIcon(base64Image);
      };
    };

    const handleRemove = (id) => {
      setParticipants((prev) => prev.filter((mem) => mem.userId !== id));
    };

    const changeRole = (id) => {
      setParticipants((prev) =>
        prev.map((mem) =>
          mem.userId === id
            ? { ...mem, role: mem.role === "member" ? "admin" : "member" }
            : mem,
        ),
      );
    };

    const handleSave = () => {
      if (
        groupNameRef.current.value == group.groupname &&
        groupicon.length == 0
      ) {
        setGroupForm((prev) => !prev);
        return;
      }
      udGroupDetail({
        conversationId: conversation.conversationId,
        groupname: groupNameRef.current.value,
        groupIcon: groupicon,
        oldkey: groupicon.length > 0 ? group.groupIcon?.key : "",
      });
      onClose();
    };

    const removeMember = (id) => {
      setMembers((prev) => prev.filter((member) => member._id !== id));
    };

    const addMember = () => {
      setParticipants((prev) => [
        ...prev,
        ...members.map((mem) => ({
          userId: mem._id,
          role: "member",
        })),
      ]);

      setTempData((prev) => {
        const updated = { ...prev };
        members.forEach((mem) => {
          updated[mem._id] = mem;
        });
        return updated;
      });

      setMembers([]);
      setShowUser(false);
    };

    const showSaveButton =
      participants.some(
        (p) =>
          !group.membersDetail[p.userId] ||
          group.membersDetail[p.userId].role !== p.role,
      ) ||
      Object.keys(group.membersDetail).some(
        (id) => !participants.find((p) => p.userId === id),
      );

    const handleUpdate = () => {
      upGroupMember({ id: conversation.conversationId, participants });
      onClose();
    };

    const handleExitGroup = () => {
      ExitGroup(conversation.conversationId);
      onClose();
    };

    return (
      <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Group info</h2>
            <p className="mt-0.5 text-xs text-muted">Details and shared media</p>
          </div>
          <Button iconOnly size="sm" variant="ghost" onClick={onClose} aria-label="Close group info">
            <X className="size-5" />
          </Button>
        </header>

        <div className="ui-scrollbar min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <div className="flex flex-col">
            <div className="flex flex-col items-center gap-3 p-6">
              <div className="relative">
                <PhotoProvider>
                  <PhotoView src={groupicon || group?.groupIcon?.url}>
                    <Avatar
                      src={groupicon || group?.groupIcon?.url}
                      alt={group?.groupname || "Group"}
                      size="xl"
                      className="ring-2 ring-brand/30 ring-offset-2 ring-offset-surface"
                    />
                  </PhotoView>
                </PhotoProvider>
                {myrole !== "member" && (
                  <Button
                    iconOnly
                    size="sm"
                    variant="primary"
                    className="absolute -bottom-1 -right-1 rounded-full"
                    aria-label="Change group photo"
                    onClick={() => document.getElementById("groupIcon-upload")?.click()}
                  >
                    <Image className="size-4" />
                  </Button>
                )}
              </div>
              <input
                type="file"
                id="groupIcon-upload"
                className="hidden"
                accept="image/*"
                onChange={handleProfilePic}
              />

              {myrole == "member" && (
                <div className="text-center text-lg font-semibold text-ink">
                  <h1>{group.groupname}</h1>
                </div>
              )}

              {myrole !== "member" && (
                <div className="w-full">
                  <div className="flex items-center justify-center">
                      <Input
                        type="text"
                        defaultValue={group.groupname}
                        ref={groupNameRef}
                        readOnly={!groupForm}
                        className={groupForm ? "mx-auto max-w-64" : "mx-auto max-w-64 border-transparent bg-transparent shadow-none"}
                        inputClassName="text-center text-base font-semibold"
                        trailing={groupForm ? (
                          <Button iconOnly size="xs" variant="ghost" onClick={() => setShowPicker(true)} aria-label="Add emoji">
                            <SmileIcon className="size-4" />
                          </Button>
                        ) : null}
                      />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-1">
                    <Tooltip label="Add members" side="bottom">
                    <Button
                      iconOnly
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowUser((prev) => !prev)}
                      aria-label="Add members"
                    >
                      <UserPlusIcon className="size-[22px]" />
                    </Button>
                    </Tooltip>
                    <Tooltip label="Edit group" side="bottom">
                    <Button
                      iconOnly
                      size="sm"
                      variant="ghost"
                      onClick={() => setGroupForm(!groupForm)}
                      aria-label="Edit group"
                    >
                      <Edit className="size-[22px]" />
                    </Button>
                    </Tooltip>
                    {groupForm && (
                      <Button
                        iconOnly
                        size="sm"
                        variant="primary"
                        onClick={handleSave}
                        aria-label="Save group details"
                      >
                        <Check className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <MediaSlider
              mediaFiles={mediaFiles}
              getImgMessages={getImgMessages}
            />

            <section className={cardClass}>
              <SectionTitle
                title="Members"
                subtitle="Roles and permissions for everyone in the group"
                action={
                  showSaveButton ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleUpdate}
                    >
                      <Check className="size-4" />
                      Update
                    </Button>
                  ) : null
                }
              />
              <div
                className="ui-scrollbar mt-4 max-h-[26rem] space-y-1 overflow-y-auto pr-1"
              >
                {participants.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between gap-3 rounded-control p-2.5 transition hover:bg-surface-hover"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar
                        src={group?.membersDetail[member.userId]?.profilePic?.url || tempData[member.userId]?.profilePic?.url}
                        alt={group?.membersDetail[member.userId]?.fullname || tempData[member.userId]?.fullname || "Member"}
                        size="md"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {group?.membersDetail[member.userId]?.fullname ||
                            tempData[member.userId]?.fullname}
                        </p>
                        {member.role === "admin" && (
                          <p className="text-xs text-brand-strong">Admin</p>
                        )}
                      </div>
                    </div>

                    {group?.membersDetail?.[authUser._id]?.role === "admin" &&
                      member.userId !== authUser._id && (
                        <div className="flex gap-2">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => changeRole(member.userId)}
                          >
                            {member.role === "admin"
                              ? "Remove Admin"
                              : "Make Admin"}
                          </Button>

                          <Button
                            size="xs"
                            variant="dangerGhost"
                            onClick={() => handleRemove(member.userId)}
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>{" "}
            </section>

            <section className={cardClass}>
              <SectionTitle
                title="Chat Actions"
                subtitle="Quick actions for this group conversation"
              />
              <div className="mt-4 space-y-3">
                <ActionTile
                  icon={LucideArrowRightFromLine}
                  label="Exit group"
                  onClick={() =>
                    requestConfirmation({
                      title: "Exit group?",
                      description:
                        "You will stop receiving messages from this group.",
                      confirmLabel: "Exit",
                      action: handleExitGroup,
                    })
                  }
                />
                {myrole !== "member" && (
                  <ActionTile
                    icon={Trash2Icon}
                    label="Delete chat"
                    onClick={() =>
                      requestConfirmation({
                        title: "Delete conversation?",
                        description:
                          "This removes the group conversation from your chat list.",
                        confirmLabel: "Delete",
                        action: handleDeleteChat,
                      })
                    }
                  />
                )}
              </div>
            </section>
          </div>
        </div>

        <Modal
          open={showUser}
          onClose={() => setShowUser(false)}
          title="Add members"
          description="Select people to add to this group."
          size="sm"
          footer={
            <>
              <Button onClick={() => setShowUser(false)}>Cancel</Button>
              <Button variant="primary" onClick={addMember} disabled={members.length === 0}>
                Add {members.length || ""} member{members.length === 1 ? "" : "s"}
              </Button>
            </>
          }
        >
            {members.length > 0 && (
              <div className="ui-scrollbar mb-3 flex max-h-20 shrink-0 flex-wrap gap-1.5 overflow-y-auto rounded-control bg-surface-muted p-2">
                {members.map((mem) => (
                  <Badge
                    key={mem._id}
                    variant="brand"
                    className="h-7 gap-1.5 pr-1"
                  >
                    <span className="max-w-24 truncate">{mem.fullname}</span>
                    <button type="button" onClick={() => removeMember(mem._id)} className="flex size-5 items-center justify-center rounded-full hover:bg-brand/15" aria-label={`Remove ${mem.fullname}`}>
                      <X className="size-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="ui-scrollbar max-h-72 overflow-y-auto">
              <SectionLoader
                loading={isOtherUsersLoading}
                label="Loading users..."
                minHeight={160}
              >
                <>
                  {otherUsers.map((user) => (
                    <button
                      type="button"
                      onClick={() => {
                        if (!members.find((m) => m._id === user._id)) {
                          setMembers((prev) => [...prev, user]);
                        }
                      }}
                      key={user._id}
                      className="flex w-full items-center gap-3 rounded-control p-2.5 text-left transition hover:bg-surface-hover"
                    >
                      <Avatar src={user.profilePic?.url} alt={user.fullname} size="md" />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {user.fullname}
                        </div>
                      </div>
                      {members.some((member) => member._id === user._id) && <Check className="size-4 text-brand-strong" />}
                    </button>
                  ))}
                  {hasMoreOtherUsers && (
                    <div className="flex justify-center px-2 py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          loadMoreOtherUsers(conversation.conversationId)
                        }
                        loading={isMoreOtherUsersLoading}
                      >
                        Load more people
                      </Button>
                    </div>
                  )}
                </>
              </SectionLoader>
            </div>
        </Modal>
        <Modal open={showPicker} onClose={() => setShowPicker(false)} title="Add an emoji" size="sm" className="w-auto">
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
      </>
    );
  }

  function ContactInfo({ user, onClose, requestConfirmation }) {
    const handleClearChat = () => {
      clearAllMsg(user.conversationId);
    };
    const handleOpenProfile = () => {
      if (!user?.oruserId) return;
      onClose();
      navigate(`/profile/${user.oruserId}`);
    };
    return (
      <>
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Contact info</h2>
            <p className="mt-0.5 text-xs text-muted">Profile and shared media</p>
          </div>
          <Button iconOnly size="sm" variant="ghost" onClick={onClose} aria-label="Close contact info">
            <X className="size-5" />
          </Button>
        </header>

        <div className="ui-scrollbar min-h-0 flex-1 overflow-y-auto scroll-smooth">
          <div className="flex flex-col">
            <div className="flex flex-col items-center gap-3 p-6">
              <PhotoProvider>
                <PhotoView src={user?.profilePic?.url}>
                  <Avatar
                    src={user?.profilePic?.url}
                    alt={user?.name || "Contact"}
                    size="xl"
                    className="ring-2 ring-brand/30 ring-offset-2 ring-offset-surface"
                  />
                </PhotoView>
              </PhotoProvider>

              <div className="text-center">
                <h3 className="text-lg font-semibold text-ink">{user?.name}</h3>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <div className="flex flex-col items-center gap-1 text-xs text-muted">
                  <Button
                    iconOnly
                    size="md"
                    variant="outline"
                    type="button"
                    onClick={handleOpenProfile}
                    aria-label="Open profile"
                  >
                    <User2Icon className="size-5" />
                  </Button>
                  Profile
                </div>
                <div className="flex flex-col items-center gap-1 text-xs text-muted">
                  <Button
                    iconOnly
                    size="md"
                    variant="outline"
                    onClick={() => startOutgoingCall(conversation)}
                    aria-label="Start video call"
                  >
                    <VideoIcon className="size-5" />
                  </Button>
                  Video call
                </div>
              </div>
            </div>

            <MediaSlider mediaFiles={mediaFiles} getImgMessages={getImgMessages} />

            <section className={cardClass}>
              <SectionTitle
                title="Chat Actions"
                subtitle="Clean up or remove this conversation"
              />
              <div className="mt-4 space-y-3">
                <ActionTile
                  icon={MinusCircle}
                  label="Clear chat"
                  onClick={() =>
                    requestConfirmation({
                      title: "Clear chat?",
                      description:
                        "This removes all messages in this conversation for you.",
                      confirmLabel: "Clear",
                      action: handleClearChat,
                    })
                  }
                />
                <ActionTile
                  icon={Trash2Icon}
                  label="Delete chat"
                  onClick={() =>
                    requestConfirmation({
                      title: "Delete conversation?",
                      description:
                        "This removes the conversation from your chat list.",
                      confirmLabel: "Delete",
                      action: handleDeleteChat,
                    })
                  }
                />
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 2xl:hidden" onClick={onClose} aria-hidden="true" />
      <aside className="fixed bottom-0 right-0 top-0 z-50 flex h-full w-[380px] flex-col border-l border-line bg-surface shadow-overlay animate-slide-in-right 2xl:relative 2xl:z-auto 2xl:w-[360px] 2xl:shrink-0 2xl:shadow-none">
          {isGroup ? (
            <GroupInfo
              group={conversation.groupdetail}
              onClose={onClose}
              requestConfirmation={setConfirmation}
            />
          ) : (
            <ContactInfo
              user={conversation}
              onClose={onClose}
              requestConfirmation={setConfirmation}
            />
          )}
      </aside>
      <ConfirmDialog
        open={Boolean(confirmation)}
        title={confirmation?.title}
        description={confirmation?.description}
        confirmLabel={confirmation?.confirmLabel}
        onCancel={() => setConfirmation(null)}
        onConfirm={() => {
          const action = confirmation?.action;
          setConfirmation(null);
          action?.();
        }}
      />
    </>
  );
}

export default InfoDrawer;
