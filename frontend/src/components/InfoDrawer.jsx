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
import SectionLoader from "./common/SectionLoader";
import LoadableImage from "./common/LoadableImage";

const cardClass = "p-5 ";

function MediaSlider({ mediaFiles, getImgMessages }) {
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
        subtitle={`${mediaFiles.length} shared ${
          mediaFiles.length === 1 ? "item" : "items"
        }`}
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleScroll(-1);
                getImgMessages();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-base-200 bg-base-100 text-base-content/70 transition hover:border-base-300 hover:text-base-content"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll(1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-base-200 bg-base-100 text-base-content/70 transition hover:border-base-300 hover:text-base-content"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        }
      />
      {mediaFiles.length > 0 ? (
        <div
          ref={sliderRef}
          className="mt-3 flex space-x-5 overflow-x-auto scroll-smooth no-scrollbar"
        >
          <PhotoProvider>
            {mediaFiles.map((file) => (
<<<<<<< HEAD
              <PhotoView src={file?.url}>
                <img
                  src={file?.url}
                  alt=""
                  className="rounded-lg object-cover size-20 shrink-0 cursor-pointer"
                  loading="lazy"
                  decoding="async"
=======
              <PhotoView src={file.image.url}>
                <LoadableImage
                  src={file.image.url}
                  alt=""
                  className="rounded-lg object-cover size-20 shrink-0 cursor-pointer"
                  wrapperClassName="size-20 shrink-0 rounded-lg"
                  imgProps={{ loading: "lazy", decoding: "async" }}
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
                />
              </PhotoView>
            ))}
          </PhotoProvider>
        </div>
      ) : (
        <button className="btn btn-disabled btn-lg mt-3">
          <CircleSlash2 />
        </button>
      )}
    </section>
  );
}

function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-base-content/75">
          {title}
        </h3>
        {subtitle && (
          <p className="mt-1 text-sm text-base-content/55">{subtitle}</p>
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
      onClick={onClick}
      className="flex bg-error/5 space-x-3 rounded-2xl px-10 py-3 transition text-warning hover:bg-error/15"
    >
      <IconComponent className="size-5" />
      <span className="min-w-0 text-sm font-medium">{label}</span>
    </button>
  );
}

export default function InfoDrawer({ conversation, onClose }) {
  const isGroup = conversation?.isgroup;
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
    message,
    mediaImgs,
    getImgMessages,
    resetImgMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();

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

  const handleDeleteChat = () => {
    setDeleteChat(conversation.conversationId);
  };

  useEffect(() => {
    resetImgMessages();
    getImgMessages();
  }, [conversation.conversationId]);

  function GroupInfo({ group, onClose }) {
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
      setGroupForm((prev) => !prev);
      const file = e.target.files[0];
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
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Group Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
          <div className="flex flex-col">
            <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
              <div className="avatar">
                <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <PhotoProvider>
                    <PhotoView src={groupicon || group?.groupIcon.url}>
                      <LoadableImage
                        src={groupicon || group?.groupIcon.url}
                        alt="group"
                        className="object-cover"
                        wrapperClassName="w-20 h-20"
                        imgProps={{ loading: "eager", decoding: "async" }}
                      />
                    </PhotoView>
                  </PhotoProvider>
                </div>
                {myrole !== "member" && (
                  <button
                    onClick={() => alert("Photo size almost 9mb")}
                    className="right-0 absolute -bottom-1"
                  >
                    <label htmlFor="groupIcon-upload">
                      <Image className="size-6" />
                      <input
                        type="file"
                        id="groupIcon-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleProfilePic}
                      />
                    </label>
                  </button>
                )}
              </div>

              {myrole == "member" && (
                <div className="text-center text-xl font-semibold">
                  <h1>{group.groupname}</h1>
                </div>
              )}

              {myrole !== "member" && (
                <>
                  <div className="text-xl font-semibold">
                    <div className="flex items-center">
                      <input
                        type="text"
                        defaultValue={group.groupname}
                        ref={groupNameRef}
                        readOnly={!groupForm}
                        className={`w-full text-center bg-transparent ${groupForm && "border-b border-primary py-2 text-start"} outline-none`}
                      />
                      {groupForm && (
                        <SmileIcon
                          onClick={() => setShowPicker((prev) => !prev)}
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => setShowUser((prev) => !prev)}
                      className="btn btn-md btn-ghost btn-circle"
                    >
                      <UserPlusIcon className="size-[22px]" />
                    </button>
                    <button
                      onClick={() => setGroupForm(!groupForm)}
                      className="btn btn-md btn-ghost btn-circle"
                    >
                      <Edit className="size-[22px]" />
                    </button>
                    {groupForm && (
                      <button
                        onClick={handleSave}
                        className="btn btn-primary btn-circle"
                      >
                        <Check />
                      </button>
                    )}
                  </div>
                </>
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
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-content transition hover:opacity-90"
                    >
                      <Check className="size-4" />
                      Update
                    </button>
                  ) : null
                }
              />
              <div
                className={`mt-4 space-y-3 max-h-[26rem] overflow-y-auto pr-1 no-scrollbar}`}
              >
                {participants.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between bg-base-200 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          <PhotoProvider>
                            <PhotoView
                              src={
                                group?.membersDetail[member.userId]?.profilePic
                                  .url ||
                                tempData[member.userId]?.profilePic.url
                              }
                            >
                              <LoadableImage
                                src={
                                  group?.membersDetail[member.userId]
                                    ?.profilePic.url ||
                                  tempData[member.userId]?.profilePic.url
                                }
                                alt=""
                                className="object-cover"
                                wrapperClassName="w-10 h-10 rounded-full"
<<<<<<< HEAD
                                imgProps={{
                                  loading: "lazy",
                                  decoding: "async",
                                }}
=======
                                imgProps={{ loading: "lazy", decoding: "async" }}
>>>>>>> 3aa031e25d735eef808f0228ce5a4ba8aa90eaab
                              />
                            </PhotoView>
                          </PhotoProvider>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium">
                          {group?.membersDetail[member.userId]?.fullname ||
                            tempData[member.userId]?.fullname}
                        </p>
                        {member.role === "admin" && (
                          <p className="text-xs text-primary">Admin</p>
                        )}
                      </div>
                    </div>

                    {group?.membersDetail?.[authUser._id]?.role === "admin" &&
                      member.userId !== authUser._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => changeRole(member.userId)}
                            className="btn btn-xs btn-outline"
                          >
                            {member.role === "admin"
                              ? "Remove Admin"
                              : "Make Admin"}
                          </button>

                          <button
                            onClick={() => handleRemove(member.userId)}
                            className="btn btn-xs btn-error btn-outline"
                          >
                            Remove
                          </button>
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
                  onClick={handleExitGroup}
                />
                {myrole !== "member" && (
                  <ActionTile
                    icon={Trash2Icon}
                    label="Delete chat"
                    onClick={handleDeleteChat}
                  />
                )}
              </div>
            </section>
          </div>
        </div>

        {showUser && (
          <div className="fixed min-w-[350px] rounded-xl p-5 bg-black/50 backdrop-blur-[2px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]">
            <div className="flex items-center justify-between mb-3">
              <h2>Add Members</h2>
              <X onClick={() => setShowUser((prev) => !prev)} />
            </div>
            {members.length > 0 && (
              <div className="shrink-0 flex flex-wrap gap-2 px-4 pb-2 max-h-16 overflow-y-auto">
                {members.map((mem) => (
                  <div
                    key={mem._id}
                    className="bg-base-300 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
                  >
                    <span className="truncate max-w-20">{mem.fullname}</span>
                    <X
                      onClick={() => removeMember(mem._id)}
                      className="size-4 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="max-h-52 overflow-y-auto">
              <SectionLoader
                loading={isOtherUsersLoading}
                label="Loading users..."
                minHeight={160}
              >
                <>
                  {otherUsers.map((user) => (
                    <div
                      onClick={() => {
                        if (!members.find((m) => m._id === user._id)) {
                          setMembers((prev) => [...prev, user]);
                        }
                      }}
                      key={user._id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-base-200"
                    >
                      <div className="avatar relative">
                        <div className="w-10 rounded-full bg-base-300">
                          <LoadableImage
                            src={user.profilePic.url}
                            alt={user.fullname}
                            className="rounded-full object-cover"
                            wrapperClassName="w-10 h-10 rounded-full"
                            imgProps={{ loading: "lazy", decoding: "async" }}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-base md:text-lg font-medium truncate">
                          {user.fullname}
                        </div>
                      </div>
                    </div>
                  ))}
                  {hasMoreOtherUsers && (
                    <div className="flex justify-center px-2 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          loadMoreOtherUsers(conversation.conversationId)
                        }
                        disabled={isMoreOtherUsersLoading}
                        className="btn btn-sm btn-outline"
                      >
                        {isMoreOtherUsersLoading
                          ? "Loading..."
                          : "Load more users"}
                      </button>
                    </div>
                  )}
                </>
              </SectionLoader>
            </div>
            <div className="flex m-5 items-center justify-center">
              <button
                onClick={() => addMember()}
                disabled={members.length == 0}
                className="btn btn-primary btn-circle"
              >
                <Check />
              </button>
            </div>
          </div>
        )}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
              onClick={() => setShowPicker((prev) => !prev)}
            />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70]">
              <div className="shadow-2xl border border-base-300 rounded-xl overflow-hidden scale-95 md:scale-100 animate-in zoom-in duration-200">
                <EmojiPicker
                  onEmojiClick={(emojiData, event) => {
                    onEmojiClick(emojiData, event);
                  }}
                  theme="dark"
                  autoFocusSearch={true}
                  width={window.innerWidth < 450 ? 280 : 350}
                  height={400}
                  lazyLoadEmojis={true}
                />
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  function ContactInfo({ user, onClose }) {
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
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Contact Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-smooth no-scrollbar">
          <div className="flex flex-col">
            <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
              <div className="avatar">
                <div className="w-24 rounded-full ring ring-accent ring-offset-base-100 ring-offset-2">
                  <PhotoProvider>
                    <PhotoView src={user?.profilePic.url}>
                      <LoadableImage
                        src={user?.profilePic.url}
                        alt="profile"
                        className="object-cover"
                        wrapperClassName="w-24 h-24 rounded-full"
                        imgProps={{ loading: "eager", decoding: "async" }}
                      />
                    </PhotoView>
                  </PhotoProvider>
                </div>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold">{user?.name}</h3>
              </div>

              <div className="p-3 space-x-3 flex items-center justify-center">
                <div className="flex text-sm flex-col items-center">
                  <button
                    type="button"
                    onClick={handleOpenProfile}
                    className="btn btn-circle btn-ghost"
                  >
                    <User2Icon className="size-5" />
                  </button>
                  Profile
                </div>
                <div className="flex text-sm flex-col items-center">
                  <button className="btn btn-circle btn-ghost">
                    <VideoIcon className="size-5" />
                  </button>
                  Video Call
                </div>
              </div>
            </div>

            <MediaSlider mediaFiles={mediaFiles} />

            <section className={cardClass}>
              <SectionTitle
                title="Chat Actions"
                subtitle="Clean up or remove this conversation"
              />
              <div className="mt-4 space-y-3">
                <ActionTile
                  icon={MinusCircle}
                  label="Clear chat"
                  onClick={handleClearChat}
                />
                <ActionTile
                  icon={Trash2Icon}
                  label="Delete chat"
                  onClick={handleDeleteChat}
                />
              </div>
            </section>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex justify-end">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      />
      <div className="relative w-full md:w-[450px] h-full bg-base-100 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {isGroup ? (
          <GroupInfo group={conversation.groupdetail} onClose={onClose} />
        ) : (
          <ContactInfo user={conversation} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
