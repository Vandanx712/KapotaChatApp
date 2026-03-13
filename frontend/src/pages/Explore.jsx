import { Compass, Heart, MessageCircle, Search, Users } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";

const EXPLORE_POSTS = [
  {
    id: 1,
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=900&auto=format&fit=crop",
    span: "col-span-2 row-span-2",
    likes: "3.2k",
    comments: "180",
  },
  {
    id: 2,
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-1",
    likes: "1.1k",
    comments: "64",
  },
  {
    id: 3,
    src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-2",
    likes: "2.8k",
    comments: "142",
  },
  {
    id: 4,
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-1",
    likes: "980",
    comments: "41",
  },
  {
    id: 5,
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=900&auto=format&fit=crop",
    span: "col-span-2 row-span-1",
    likes: "1.7k",
    comments: "95",
  },
  {
    id: 6,
    src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-1",
    likes: "780",
    comments: "33",
  },
  {
    id: 7,
    src: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-2",
    likes: "2.1k",
    comments: "128",
  },
  {
    id: 8,
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=900&auto=format&fit=crop",
    span: "col-span-1 row-span-1",
    likes: "620",
    comments: "24",
  },
  {
    id: 9,
    src: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=900&auto=format&fit=crop",
    span: "col-span-2 row-span-2",
    likes: "3.9k",
    comments: "220",
  },
];

function Explore() {
  const { getSurroundingUsers, users, creteConversation } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    getSurroundingUsers();
  }, [getSurroundingUsers]);

  const onlineUsersSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);
  const onlineNearby = users.filter((user) => onlineUsersSet.has(user._id));

  const handleChatClick = (id) => {
    creteConversation(id);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-base-100 pt-20">
      <div className="container mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <main>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-primary">
                  <Compass className="size-4" />
                  <span className="text-sm font-semibold uppercase tracking-widest">
                    Explore
                  </span>
                </div>
                <h1 className="mt-2 text-2xl font-bold">
                  Discover fresh posts
                </h1>
                <p className="text-base-content/60">
                  A curated grid inspired by Instagram explore.
                </p>
              </div>
              <label className="input input-bordered flex items-center gap-2 sm:w-72">
                <Search className="size-4" />
                <input
                  type="text"
                  placeholder="Search posts"
                  className="w-full bg-transparent"
                />
              </label>
            </div>

            <div className="mt-6 grid grid-cols-3 auto-rows-[110px] gap-2 sm:auto-rows-[140px] sm:gap-3 md:auto-rows-[170px] lg:auto-rows-[190px]">
              {EXPLORE_POSTS.map((post) => (
                <div
                  key={post.id}
                  className={`group relative overflow-hidden rounded-xl bg-base-200 ${post.span}`}
                >
                  <img
                    src={post.src}
                    alt="Explore post"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100">
                    <div className="flex items-center gap-4 text-sm font-semibold text-white">
                      <div className="flex items-center gap-1">
                        <Heart className="size-4" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="size-4" />
                        {post.comments}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </main>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="card border border-base-300 bg-base-200/40">
              <div className="card-body gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-primary" />
                    <h2 className="font-semibold">Surrounding Users</h2>
                  </div>
                  <div className="badge badge-primary">
                    {onlineNearby.length} online
                  </div>
                </div>

                {onlineNearby.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                    {onlineNearby.map((user) => (
                      <div
                        key={`online-${user._id}`}
                        className="flex min-w-[220px] items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-2 lg:min-w-0"
                      >
                        <div className="avatar relative">
                          <div className="w-10 rounded-full bg-base-300">
                            <img src={user.profilePic?.url} alt={user.fullname} />
                          </div>
                          <span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {user.fullname}
                          </p>
                          <p className="text-xs text-base-content/60">Online</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-3 rounded-lg border border-base-300 bg-base-100 p-3"
                    >
                      <div className="avatar relative">
                        <div className="w-11 rounded-full bg-base-300">
                          <img src={user.profilePic?.url} alt={user.fullname} />
                        </div>
                        {onlineUsersSet.has(user._id) && (
                          <span className="absolute bottom-0 right-0 size-2 rounded-full bg-green-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {user.fullname}
                        </p>
                        <p className="truncate text-xs text-base-content/60">
                          {user.bio || "Available to connect"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleChatClick(user._id)}
                        className="btn btn-xs btn-primary btn-outline"
                      >
                        Chat
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Explore;
