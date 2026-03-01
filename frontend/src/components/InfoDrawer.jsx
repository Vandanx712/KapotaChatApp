import { LucideArrowRightFromLine, Trash2Icon, X } from "lucide-react";
import { useEffect } from "react";

export default function InfoDrawer({ conversation, onClose }) {
  const isGroup = conversation?.isgroup;

  // ESC key close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  function GroupInfo({ group, onClose }) {
    const membersId = Object.keys(group?.membersDetail);
    return (
      <>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Group Info</h2>
          <button onClick={onClose} className="btn btn-sm btn-ghost btn-circle">
            <X className="size-6"/>
          </button>
        </div>

        {/* Group Profile */}
        <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
          <div className="avatar">
            <div className="w-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={group?.groupIcon.url} alt="group" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold">{group?.groupname}</h3>
            {/* <p className="text-sm text-base-content/70">
              {membersId.length} members
            </p> */}
          </div>

          <button className="btn btn-sm btn-outline btn-primary">
            Edit Info
          </button>
        </div>

        {/* Description */}
        <div className="p-4">
          <p className="text-sm text-base-content/95">{membersId.length} members</p>
          {/* <p className="text-sm">
            {group?.description || "No description added."}
          </p> */}
        </div>

        {/* Members */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {membersId.map((member) => (
            <div
              key={member}
              className="flex items-center justify-between bg-base-200 p-3 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-10 rounded-full">
                    <img src={member.profilePic} alt="" />
                  </div>
                </div>

                <div>
                  <p className="font-medium">
                    {group?.membersDetail[member].fullname}
                  </p>
                  {group?.membersDetail[member].role === "admin" && (
                    <p className="text-xs text-primary">Admin</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="btn btn-xs btn-outline">
                  {group?.membersDetail[member].role === "admin"
                    ? "Remove Admin"
                    : "Make Admin"}
                </button>

                <button className="btn btn-xs btn-error btn-outline">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-2 flex border-t border-base-300 justify-evenly">
          <button className="flex rounded-lg px-7 py-3 hover:bg-warning/10 text-warning gap-3 items-center">
            <LucideArrowRightFromLine className="size-4" /> Exit Group
          </button>
          <button className="flex rounded-lg px-7 py-3 hover:bg-error/30 text-error gap-3 items-center">
            <Trash2Icon className="size-4" /> Delete Chat
          </button>
        </div>
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
            ✕
          </button>
        </div>

        {/* Profile */}
        <div className="flex flex-col items-center gap-3 p-6 border-b border-base-200">
          <div className="avatar">
            <div className="w-24 rounded-full ring ring-accent ring-offset-base-100 ring-offset-2">
              <img src={user?.profilePic} alt="profile" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-semibold">{user?.fullname}</h3>
            <p className="text-sm text-base-content/70">{user?.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div className="p-4 border-b border-base-200">
          <p className="text-sm text-base-content/70 mb-1">Bio</p>
          <p className="text-sm">{user?.bio || "No bio added."}</p>
        </div>

        {/* Posts */}
        <div className="p-4 border-b border-base-200">
          <p className="font-medium mb-2">Posts</p>

          <div className="grid grid-cols-3 gap-2">
            {user?.posts?.map((post) => (
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
        <div className="p-4 mt-auto border-t border-base-300">
          <button className="btn btn-error w-full">Delete Chat</button>
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
