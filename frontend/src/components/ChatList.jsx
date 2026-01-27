import { FiSearch, FiSettings, FiUser } from "react-icons/fi";

const ChatList = ({
  chats,
  activeChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
}) => {
  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 border border-transparent 
                       text-muted-foreground text-sm
                       focus:outline-none focus:border-primary/30 focus:bg-background
                       transition-all duration-200"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
        {filteredChats.map((chat, index) => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`chat-item ${activeChat === chat.id ? "active" : ""}`}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden">
                <img
                  src={chat.avatar}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {chat.online && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-foreground truncate">
                  {chat.name}
                </h3>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">
                  {chat.time}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {chat.lastMessage}
              </p>
            </div>

            {/* Unread Badge */}
            {chat.unread && chat.unread > 0 && (
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                {chat.unread}
              </span>
            )}
          </div>
        ))}
      </div>
      <footer className="shrink-0 border-t border-border bg-card">
        <div className="flex">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-accent hover:bg-muted/30 transition-all duration-200">
            <FiSettings className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              Settings
            </span>
          </button>
          <div className="w-px bg-border" />
          <button className="flex-1 flex items-center justify-center gap-2 py-3 text-muted-foreground hover:text-accent hover:bg-muted/30 transition-all duration-200">
            <FiUser className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">
              Profile
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default ChatList;
