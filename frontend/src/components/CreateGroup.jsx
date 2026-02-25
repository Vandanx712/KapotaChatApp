import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { getAllUsers } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";

function CreateGroup({ onClose, type }) {
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
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto items-center gap-3">
      <div className={`${groupForm && "hidden"}`}>
        <div className=" flex space-x-5 items-center">
          <ArrowLeft onClick={onClose} className="size-5" />
          <h2 className="text-lg font-semibold">
            {type == "New group" && "Add group members"}
          </h2>
        </div>

        <div className="mt-5">
          <label className="flex items-center justify-center gap-2 input input-bordered input-md w-full">
            <Search className="size-5" />
            <input
              type="text"
              placeholder={`Search Name`}
              className=" w-full"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 px-2 py-2 flex-1 min-h-0 overflow-y-auto">
          {members.map((mem) => (
            <div
              key={mem._id}
              className="bg-base-300  px-3 py-1 rounded-full flex items-center gap-2 text-sm"
            >
              <span className="truncate min-w-0 max-w-20 flex-1">
                {mem.fullname}
              </span>
              <X
                onClick={() => removeMember(mem._id)}
                className="size-4 shrink-0 cursor-pointer"
              />
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-2 lg:p-0">
          {users.map((user) => (
            <div
              onClick={() => {
                if (!members.find((m) => m._id === user._id)) {
                  setMembers((prev) => [...prev, user]);
                }
              }}
              key={user._id}
              className={`flex items-center gap-3 p-3 lg:p-2 rounded-lg cursor-pointer transition hover:bg-base-200`}
            >
              <div className="avatar relative">
                <div className="w-12 rounded-full bg-base-300">
                  <img src={user?.profilePic.url} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-base md:text-lg font-medium truncate">
                  {user.fullname}
                </div>
                <div className="text-sm text-base-content/70 truncate">
                  {user.bio}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-2 flex justify-center">
          <button
            className="btn btn-primary btn-circle"
            disabled={members.length == 0}
            onClick={() => setGroupForm(true)}
          >
            <ArrowRight />
          </button>
        </div>
      </div>

      <div className={`${!groupForm && "hidden"}`}>
        <div className=" flex space-x-5 items-center">
          <ArrowLeft onClick={() => setGroupForm(false)} className="size-5" />
          <h2 className="text-lg font-semibold">Add group</h2>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-8">
          {/* Group Icon */}
          <div className="flex justify-center">
            <div className="">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-base-200 flex items-center justify-center">
                <span className="text-secondary text-sm text-center px-4">
                  Add group icon
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-primary">Group Name</label>
            <input
              type="text"
              value={groupname}
              onChange={(e)=>setGroupname(e.target.value)}
              className="w-full bg-transparent border-b border-base-300 focus:border-primary outline-none py-2 transition"
            />
          </div>

          <div>
            <p className="font-medium mb-2">Group permissions</p>

            <div className="space-y-2">
              {members.map((par) => (
                <div
                  key={par._id}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition hover:bg-base-200"
                >
                  <p className="text-sm sm:text-base font-medium truncate">
                    {par.fullname}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-base-200 flex justify-center">
          <button
            className="btn btn-primary btn-circle"
            disabled={participants.length === 0}
            onClick={() => {
              // submitGroup() or nextStep()
            }}
          >
            <ArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroup;
