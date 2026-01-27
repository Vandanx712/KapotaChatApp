import { FiTrendingUp, FiUsers, FiHash } from "react-icons/fi";

const ExploreTab = () => {
  const publicChats = [
    { id: "1", name: "Tech Enthusiasts", members: "2.5k", icon: "💻" },
    { id: "2", name: "Book Club", members: "890", icon: "📚" },
    { id: "3", name: "Fitness Goals", members: "1.2k", icon: "💪" },
  ];

  const trending = [
    { id: "1", topic: "#productivity", posts: "12.5k" },
    { id: "2", topic: "#wellness", posts: "8.3k" },
    { id: "3", topic: "#travel", posts: "15.1k" },
  ];

  const suggested = [
    {
      id: "1",
      name: "Alex Rivera",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      mutual: 5,
    },
    {
      id: "2",
      name: "Jordan Lee",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
      mutual: 3,
    },
    {
      id: "3",
      name: "Taylor Swift",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=taylor",
      mutual: 8,
    },
  ];

  return (
    <div className="h-full bg-background p-4 overflow-y-auto scrollbar-hide">
      {/* Public Chats */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiUsers className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Public Chats
          </h2>
        </div>
        <div className="space-y-2">
          {publicChats.map((chat, index) => (
            <div
              key={chat.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 
                         cursor-pointer transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="text-2xl">{chat.icon}</span>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">
                  {chat.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {chat.members} members
                </p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                Join
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Topics */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FiTrendingUp className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Trending Topics
          </h2>
        </div>
        <div className="space-y-2">
          {trending.map((topic, index) => (
            <div
              key={topic.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 
                         cursor-pointer transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50 + 150}ms` }}
            >
              <FiHash className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">
                  {topic.topic}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {topic.posts} posts
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Suggested Users */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Suggested for You
        </h2>
        <div className="space-y-2">
          {suggested.map((user, index) => (
            <div
              key={user.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 
                         cursor-pointer transition-all duration-200 animate-fade-in"
              style={{ animationDelay: `${index * 50 + 300}ms` }}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">
                  {user.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {user.mutual} mutual friends
                </p>
              </div>
              <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                Add
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ExploreTab;
