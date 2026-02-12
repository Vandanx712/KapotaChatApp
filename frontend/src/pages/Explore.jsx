import { UserCheck2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

function Explore() {
  const { getSurroundingUsers, users,creteConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [active, setActive] = useState("");
  const navigate = useNavigate()

  useEffect(() => {
    getSurroundingUsers();
  }, [getSurroundingUsers]);

  const handleChatClick = (id)=>{
    creteConversation(id)
    navigate('/')
  }
  return (
    <div className="h-screen w-full bg-base-100 pt-16">
      {/* DESKTOP + MOBILE WRAPPER */}
      <div className="h-full grid grid-cols-1 md:grid-cols-[360px_1fr]">
        <aside className="border-r border-base-300 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-base-300">
            <h2 className="text-lg font-semibold">Channels</h2>
            <input
              type="text"
              placeholder="Search channels"
              className="input input-bordered w-full mt-3"
            />
          </div>

          {/* Channel List */}
          <div className="flex-1 space-y-2 overflow-y-auto p-2">
            <div className="flex gap-2 p-4">
              <Users />
              Chat with surrounding users
            </div>
            {users.map((user) => (
              <div
                // onClick={() => setSelectedChannel(UserCheck2)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition
        ${active ? "bg-base-200" : "hover:bg-base-200"}
      `}
              >
                <div className="avatar relative">
                  <div className="w-12  rounded-full bg-base-300">
                    <img src={user.profilePic.url} />
                  </div>
                    {onlineUsers.includes(user._id) && (
                      <span
                        className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full"
                      />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-base md:text-lg font-medium truncate">
                    {user.fullname}
                  </div>
                  <div className="text-sm text-base-content/70 truncate">
                    {user.bio}
                  </div>
                </div>

                <button
                  onClick={() => handleChatClick(user._id)}
                  className="btn btn-sm btn-primary btn-outline"
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="hidden md:flex flex-col">
          {!selectedChannel ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-10 text-neutral">
              <div className="text-5xl mb-4">🧭</div>
              <h3 className="text-xl font-semibold text-base-content">
                Discover channels
              </h3>
              <p className="mt-2 max-w-md">
                Follow channels to stay updated with news, entertainment, sports
                and more.
              </p>
            </div>
          ) : (
            <div className="flex-1 p-6">
              <h2 className="text-xl font-semibold">name</h2>
              <p className="text-neutral mt-1">
                Latest updates from this channel
              </p>

              <div className="mt-6 space-y-4">
                <div className="p-4 rounded-lg bg-base-200">
                  This is a sample channel post.
                </div>
                <div className="p-4 rounded-lg bg-base-200">
                  Another update from the channel.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MOBILE CHANNEL VIEW */}
      {selectedChannel && (
        <div className="fixed inset-0 z-50 bg-base-100 md:hidden">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-base-300 flex items-center gap-3">
              <button className="btn btn-ghost btn-sm">←</button>
              <h2 className="font-semibold">name</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="p-4 rounded-lg bg-base-200">
                This is a channel update.
              </div>
              <div className="p-4 rounded-lg bg-base-200">
                Another mobile-friendly post.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explore;
