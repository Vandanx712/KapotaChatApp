import {
  Check,
  Edit,
  Image,
  LucideArrowRightFromLine,
  SmileIcon,
  Trash2Icon,
  UserPlusIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import EmojiPicker from "emoji-picker-react";

export default function InfoDrawer({ conversation, onClose }) {
  const isGroup = conversation?.isgroup;
  const {
    setDeleteChat,
    getConversation,
    udGroupDetail,
    setOtherUsers,
    otherUsers,
    upGroupMember,
    ExitGroup,
  } = useChatStore();
  const { otherUser, contactDetail, authUser } = useAuthStore();

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  useEffect(() => {
    contactDetail(conversation.oruserId);
  }, []);

  useEffect(() => {
    setOtherUsers(conversation.conversationId);
  }, []);

  const handleDeleteChat = () => {
    setDeleteChat(conversation.conversationId);
    setTimeout(() => {
      getConversation();
    }, 3000);
  };

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
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    const handleExitGroup = () => {
      ExitGroup(conversation.conversationId);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    };

    return (
      <>
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Group Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-6" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
          <div className="avatar">
            <div className="w-20  rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={groupicon || group?.groupIcon.url} alt="group" />
            </div>
            {myrole !== "member" && (
              <button
                onClick={() => alert("Photo size almost 9mb")}
                className={`right-0 absolute -bottom-1`}
              >
                <label htmlFor="groupIcon-upload">
                  <Image className=" size-6" />
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
              <div className=" text-xl font-semibold">
                <div className=" flex items-center">
                  <input
                    type="text"
                    defaultValue={group.groupname}
                    ref={groupNameRef}
                    readOnly={!groupForm}
                    className={`w-full text-center bg-transparent ${groupForm && "border-b border-primary py-2 text-start"} outline-none`}
                  />
                  {groupForm && (
                    <SmileIcon onClick={() => setShowPicker((prev) => !prev)} />
                  )}
                </div>
              </div>
              <div className=" flex items-center gap-5">
                <button
                  onClick={() => setShowUser((prev) => !prev)}
                  className=" btn btn-md"
                >
                  <UserPlusIcon className="size-[22px]" />
                </button>
                <button
                  onClick={() => setGroupForm(!groupForm)}
                  className="btn btn-md"
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

        <div className="flex items-center justify-between p-3">
          <p className="text-sm text-base-content/95">
            {participants.length} members
          </p>
          {showSaveButton && (
            <button
              onClick={() => handleUpdate()}
              className="btn btn-primary btn-circle btn-sm"
            >
              <Check />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {participants.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between bg-base-200 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img
                      src={
                        group?.membersDetail[member.userId]?.profilePic.url ||
                        tempData[member.userId]?.profilePic.url
                      }
                      alt=""
                    />
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

              {group?.membersDetail[authUser._id].role === "admin" &&
                member.userId !== authUser._id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => changeRole(member.userId)}
                      className="btn btn-xs btn-outline"
                    >
                      {member.role === "admin" ? "Remove Admin" : "Make Admin"}
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
        </div>

        <div className="p-2 flex border-t border-base-300 justify-evenly">
          <button onClick={()=>handleExitGroup()} className="flex rounded-lg px-7 py-3 hover:bg-warning/10 text-warning gap-3 items-center">
            <LucideArrowRightFromLine className="size-4" /> Exit Group
          </button>
          {myrole !== "member" && (
            <button className="flex rounded-lg px-7 py-3 hover:bg-error/30 text-error gap-3 items-center">
              <Trash2Icon className="size-4" /> Delete Chat
            </button>
          )}
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
              {otherUsers.map((user) => (
                <div
                  onClick={() => {
                    if (!members.find((m) => m._id === user._id)) {
                      setMembers((prev) => [...prev, user]);
                    }
                  }}
                  key={user._id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-base-200`}
                >
                  <div className="avatar relative">
                    <div className="w-10  rounded-full bg-base-300">
                      <img src={user.profilePic.url} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-base md:text-lg font-medium truncate">
                      {user.fullname}
                    </div>
                  </div>
                </div>
              ))}
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
            {/* Dark Backdrop: Closes picker when clicking anywhere else */}
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
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Contact Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-6" />
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-accent ring-offset-base-100 ring-offset-2">
              <img src={otherUser?.profilePic.url} alt="profile" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold">{otherUser?.fullname}</h3>
            <p className="text-sm text-base-content/70">{otherUser?.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="p-4 border-b border-base-200">
          <p className="text-sm text-base-content/70 mb-1">Bio</p>
          <p className="text-sm">{otherUser?.bio || "No bio added."}</p>
        </div>

        {/* Posts */}
        <div className="p-4 border-b border-base-200">
          <p className="font-medium mb-2">Posts</p>

          <div className="grid grid-cols-3 gap-2">
            {otherUser?.posts?.map((post) => (
              <img
                key={post._id}
                src={post.image}
                alt=""
                className="rounded-lg object-cover h-20 w-full"
              />
            ))}
          </div>
        </div>

        {/* Delete Chat */}
        <div className="p-3 mt-auto border-t border-base-300">
          <button
            onClick={() => handleDeleteChat()}
            className="flex rounded-lg px-7 py-3 hover:bg-error/30 text-error gap-3 items-center"
          >
            <Trash2Icon className="size-4" /> Delete Chat
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="absolute inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Drawer */}
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
