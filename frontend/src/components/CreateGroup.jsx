import {
  ArrowLeft,
  ArrowRight,
  Check,
  Image,
  Search,
  SmileIcon,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { createGroup, getAllUsers } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";

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

  useEffect(() => {
    const loadusers = async () => {
      try {
        const resdata = await getAllUsers();
        setUsers(resdata.users);
      } catch (error) {
        console.log(error);
      }
    };
    loadusers();
  }, []);

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((member) => member._id !== id));
    setParticipants((prev) => prev.filter((member) => member.userId !== id));
  };

  const handleProfilePic = (e) => {
    e.preventDefault();
    const file = e.target.files[0];
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
      const resdata = await createGroup({
        groupname: groupname.trim(),
        groupIcon: groupicon,
        participants: participants,
      });
      toast.success(resdata.message);
      onClose();
    } catch (error) {
      console.log(error);
      toast.error();
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`${groupForm ? "hidden" : "flex flex-col h-full"}`}>
        <div className="shrink-0 flex items-center gap-5 p-4 border-b border-base-300">
          <ArrowLeft onClick={onClose} className="size-5 cursor-pointer" />
          <h2 className="text-lg font-semibold">Add group members</h2>
        </div>
        <div className="shrink-0 p-4">
          <label className="flex items-center gap-2 input input-bordered w-full">
            <Search className="size-5" />
            <input
              type="text"
              placeholder="Search Name"
              className="w-full bg-transparent outline-none"
            />
          </label>
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

        <div className="flex-1 max-h-56 overflow-y-auto p-4 space-y-2">
          {users.map((user) => (
            <div
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
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-base-200"
            >
              <div className="avatar">
                <div className="w-12 rounded-full bg-base-300">
                  <img src={user?.profilePic.url} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-base font-medium truncate">
                  {user.fullname}
                </div>
                <div className="text-sm text-base-content/70 truncate">
                  {user.bio}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 border-t border-base-300 flex justify-center">
          <button
            className="btn btn-primary btn-circle"
            disabled={members.length === 0}
            onClick={() => setGroupForm(true)}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <div className={`${!groupForm ? "hidden" : "flex flex-col h-full"}`}>
        <div className="shrink-0 flex items-center gap-5 p-4 border-b border-base-300">
          <ArrowLeft
            onClick={() => {
              setGroupForm(false);
              setGroupname("");
              setGroupIcon(null);
              setParticipants([]);
            }}
            className="size-5 cursor-pointer"
          />
          <h2 className="text-lg font-semibold">Add group</h2>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          <div className="flex justify-center">
            <div className="w-24 h-24 relative gap-1 text-xs rounded-full bg-base-100 flex flex-col items-center justify-center ">
              <>
                <span className={`${groupicon ? "hidden" : ""}`}>
                  Add group icon
                </span>
                <button
                  onClick={() => alert("Photo size almost 9mb")}
                  className={`${groupicon ? ' -right-1':' right-1'} absolute bottom-1`}
                >
                  <label htmlFor="avatar-upload">
                    <Image className=" size-6" />
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleProfilePic}
                      // disabled={isUpdateProfile}
                    />
                  </label>
                </button>
              </>
              
              {groupicon && (
                <img
                  src={groupicon}
                  className="size-24 object-cover rounded-full"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-primary">Group Name</label>
            <div className=" flex items-center justify-between">
              <input
                type="text"
                value={groupname}
                onChange={(e) => setGroupname(e.target.value)}
                className="w-full bg-transparent border-b border-base-300 focus:border-primary outline-none py-2"
              />
              <SmileIcon onClick={() => setShowPicker((prev) => !prev)} />
            </div>
          </div>

          <div>
            <p className="font-medium mb-2">Group members</p>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {members.map((par, index) => (
                <div
                  key={par._id}
                  className="p-2 flex items-center justify-between gap-2 rounded-lg bg-base-300"
                >
                  {par.fullname}
                  <label className="cursor-pointer flex items-center justify-center gap-2">
                    <input
                      type="checkbox"
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
                      className="checkbox checkbox-xs"
                    />
                    <span className="text-sm">isAdmin</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="shrink-0 p-4 border-t border-base-300 flex justify-center">
          <button
            onClick={handleSave}
            className="btn btn-primary btn-circle"
            disabled={members.length === 0}
          >
            <Check />
          </button>
        </div>
      </div>
      {showPicker && (
        <>
          {/* Dark Backdrop: Closes picker when clicking anywhere else */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={() => setShowPicker((prev)=>!prev)}
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
    </div>
  );
}

export default CreateGroup;
