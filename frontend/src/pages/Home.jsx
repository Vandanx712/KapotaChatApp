import { useState } from "react";
import { FiMessageCircle, FiCompass, FiVideo, FiActivity, FiSettings, FiUser, FiArrowLeft } from "react-icons/fi";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import StatusTab from "../components/StatusTab";
import ExploreTab from "../components/ExploreTab";
import VideoCallTab from "../components/VideoCallTab";

const Tab = "status" | "explore" | "video" | "chats";

// Mock data
const mockChats = [
  { id: "1", name: "Sarah Johnson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah", lastMessage: "That sounds great! Let me know when you're free.", time: "2:30 PM", unread: 2, online: true },
  { id: "2", name: "Mike Chen", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike", lastMessage: "I'll send you the documents tomorrow.", time: "1:15 PM", online: false },
  { id: "3", name: "Emma Wilson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma", lastMessage: "Thanks for your help!", time: "Yesterday", online: true },
  { id: "4", name: "James Brown", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=james", lastMessage: "See you at the meeting.", time: "Yesterday", unread: 1, online: false },
  { id: "5", name: "Lisa Anderson", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=lisa", lastMessage: "Perfect, thank you!", time: "Monday", online: true },
];

const mockMessages= {
  "1": [
    { id: "1", text: "Hey! How are you doing today?", sent: false, time: "2:15 PM" },
    { id: "2", text: "I'm doing great, thanks for asking! How about you?", sent: true, time: "2:18 PM" },
    { id: "3", text: "Pretty good! I was wondering if you'd like to grab coffee sometime this week?", sent: false, time: "2:22 PM" },
    { id: "4", text: "That sounds great! Let me check my schedule.", sent: true, time: "2:25 PM" },
    { id: "5", text: "That sounds great! Let me know when you're free.", sent: false, time: "2:30 PM" },
  ],
  "2": [
    { id: "1", text: "Hi Mike, did you get a chance to review the proposal?", sent: true, time: "12:30 PM" },
    { id: "2", text: "Yes, I looked through it. Great work!", sent: false, time: "1:00 PM" },
    { id: "3", text: "I'll send you the documents tomorrow.", sent: false, time: "1:15 PM" },
  ],
};

const tabs = [
  { id: "status", label: "Status", icon: FiActivity },
  { id: "explore", label: "Explore", icon: FiCompass },
  { id: "video", label: "Video Call", icon: FiVideo },
  { id: "chats", label: "Chats", icon: FiMessageCircle },
];

const Home = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [activeChat, setActiveChat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState(mockMessages);

  const selectedChat = mockChats.find(chat => chat.id === activeChat) || null;

  const handleSendMessage = (text) => {
    if (!activeChat) return;
    
    const newMessage= {
      id: Date.now().toString(),
      text,
      sent: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMessage],
    }));
  };

  const handleBackToList = () => {
    setActiveChat(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "status":
        return <StatusTab />;
      case "explore":
        return <ExploreTab />;
      case "video":
        return <VideoCallTab />;
      case "chats":
        return (
          <div className="h-full flex">
            {/* Chat List - hidden on mobile when chat is selected */}
            <div className={`w-full md:w-80 lg:w-96 shrink-0 ${activeChat ? 'hidden md:block' : 'block'}`}>
              <ChatList
                chats={mockChats}
                activeChat={activeChat}
                onSelectChat={setActiveChat}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            </div>
            
            {/* Chat Window - full width on mobile when selected */}
            <div className={`flex-1 ${!activeChat ? 'hidden md:block' : 'block'}`}>
              <div className={activeChat ? 'h-[calc(100%-52px)] md:h-full' : 'h-full'}>
                <ChatWindow
                  chat={selectedChat}
                  messages={activeChat ? (messages[activeChat] || []) : []}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <header className=" flex shrink-0 border-b border-border justify-between bg-card">
        <div className="flex items-cente justify-center p-5">
          <h1 className="font-display text-2xl text-primary font-semibold hidden sm:block">KapotaChat</h1>
          <h1 className="font-display text-2xl text-primary font-semibold sm:hidden">🐦 Kapota</h1>
        </div>
        
        {/* Tabs */}
        <nav className="flex space-x-7 mr-5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-sm font-medium transition-all duration-200 relative
                ${activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              <tab.icon className="text-xl" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
              
              {/* Active indicator */}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 sm:w-16 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Home;

