import { useState } from "react";
import { FiSend, FiMoreVertical, FiPhone, FiVideo, FiArrowLeft } from "react-icons/fi";

const ChatWindow = ({ chat, messages, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🐦</span>
          </div>
          <h2 className="font-display text-xl text-foreground mb-2">
            Welcome to KapotaChat
          </h2>
          <p className="text-muted-foreground text-sm">
            Select a conversation to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between sm:px-6 px-1.5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button
            // onClick={handleBackToList}
            className=" text-xl hover:bg-muted transition-colors sm:hidden"
          >
            <FiArrowLeft className="text-foreground" />
          </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-full h-full object-cover"
              />
            </div>
            {chat.online && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-primary border-2 border-card rounded-full" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{chat.name}</h3>
            <p className="text-xs text-muted-foreground">
              {chat.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <FiPhone className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <FiVideo className="w-5 h-5 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <FiMoreVertical className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`message-enter flex ${message.sent ? "justify-end" : "justify-start"}`}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className={message.sent ? "message-sent" : "message-received"}>
              <p className="text-sm leading-relaxed">{message.text}</p>
              <p
                className={`text-[10px] mt-1 ${message.sent ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {message.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-card">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-transparent
                       text-muted-foreground text-sm
                       focus:outline-none focus:border-primary focus:bg-background
                       transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center
                       hover:opacity-90 disabled:opacity-50
                       transition-all duration-200 active:scale-95"
          >
            <FiSend className="text-xl"/>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
