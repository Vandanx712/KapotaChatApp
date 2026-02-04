import React, { useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CircleQuestionMark,
  Key,
  Keyboard,
  Lock,
  MessageCircle,
  Monitor,
  Send,
  Settings,
  Video,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from 'react-router-dom'

const preview_message = [
  { id: 1, content: "Hey! How's it going", issent: false },
  {
    id: 2,
    content: "I'm doing great! just working on some new features",
    issent: true,
  },
];

function Setting() {
  const [activeSection, setActiveSection] = useState('all')
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();

  const navigate = useNavigate()

  const settingsItems = [
    {
      id: 1,
      icon: <Monitor />,
      label: "General",
      description: "Startup and close",
    },
    {
      id: 2,
      icon: <Key />,
      label: "Account",
      description: "Security notifications, account info",
    },
    {
      id: 3,
      icon: <Lock />,
      label: "Privacy",
      description: "Blocked contacts, disappearing messages",
    },
    {
      id: 4,
      icon: <MessageCircle />,
      label: "Chats",
      description: "Theme, wallpaper, chat settings",
    },
    {
      id: 5,
      icon: <Video />,
      label: "Video & voice",
      description: "Camera, microphone & speakers",
    },
    {
      id: 6,
      icon: <Bell />,
      label: "Notifications",
      description: "Message notifications",
    },
    {
      id: 7,
      icon: <Keyboard />,
      label: "Keyboard shortcuts",
      description: "Quick actions",
    },
    {
      id: 8,
      icon: <CircleQuestionMark />,
      label: "Help and feedback",
      description: "Help centre, contact us, privacy policy",
    },
  ];

  const handleItemClick = (label) => {
    if (label == 'Profile') navigate('/profile')
    if (label == 'Chats') setActiveSection('Chats')
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'Chats':
        return (
          <div className="flex flex-col overflow-hidden p-5">
            <div className=" flex items-center gap-5">
              <button className="text-secondary text-xl p-2 rounded-full hover:bg-secondary-content">
                <ArrowLeft />
              </button>
              <p className=" text-xl text-primary">{activeSection}</p>
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Theme</h2>
              <p className="text-sm text-base-content/70">Choose a theme for your chat interface</p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`
                group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                ${theme === t ? "bg-base-200" : "hover:bg-base-200/50"}
              `}
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium truncate w-full text-center">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>

            {/* Preview Section */}
            <h3 className="text-lg font-semibold mb-3">Preview</h3>
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
              <div className="p-4 bg-base-200">
                <div className="max-w-lg mx-auto">
                  {/* Mock Chat UI */}
                  <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                          J
                        </div>
                        <div>
                          <h3 className="font-medium text-sm">John Doe</h3>
                          <p className="text-xs text-base-content/70">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                      {preview_message.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.issent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.issent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p
                              className={`
                            text-[10px] mt-1.5
                            ${message.issent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                            >
                              12:00 PM
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-base-300 bg-base-100">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="input input-bordered flex-1 text-sm h-10"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="btn btn-primary h-10 min-h-0">
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        break;
    }
  }

  return (
    <div className="h-screen pt-16 max-w-[1600px] grid lg:grid-cols-[400px_1fr] bg-base-100">
      {/* Sidebar */}
      <div className={`${activeSection == 'all' ? 'flex' : 'hidden lg:flex'} flex-col border-r pr-3 border-base-300 overflow-hidden`}>
        {/* Profile Section */}
        <div
          className="flex items-center gap-3 md:gap-4 mt-5 mx-3 p-3 rounded-lg md:px-6 cursor-pointer hover:bg-secondary transition-colors active:bg-base-300"
          onClick={() => handleItemClick("Profile")}
        >
          <div className=" flex items-center justify-center">
            <img
              src={authUser.profilePic.url}
              className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base md:text-lg font-medium text-neutral truncate">
              {authUser.fullname}
            </div>
            <div className="text-sm text-neutral/60 truncate">
              {authUser.bio}
            </div>
          </div>
        </div>

        <div className="divider m-5"></div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto">
          {settingsItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 md:gap-5 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:bg-secondary hover:mx-3 hover:rounded-lg transition-colors animate-slideIn"
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => handleItemClick(item.label)}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-secondary flex items-center justify-center text-neutral/60 text-base md:text-xl flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-base text-neutral truncate">
                  {item.label}
                </div>
                <div className="text-xs md:text-sm text-neutral/60 truncate">
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div
          className="flex items-center gap-4 md:gap-5 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:bg-error/5 transition-colors active:bg-error/10 animate-slideIn"
          style={{ animationDelay: "0.4s" }}
          onClick={() => handleItemClick("Logout")}
        >
          <div className="divider"></div>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-error/10 flex items-center justify-center text-error text-base md:text-xl flex-shrink-0">
            <ArrowRight />
          </div>
          <div className="flex-1">
            <div className="text-sm md:text-base text-error font-medium">
              Log out
            </div>
          </div>
        </div>
      </div>

      {activeSection !== 'all' && (<div className="lg:hidden">{renderContent()}</div>)}

      {/* Main Content - Empty State (Hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-center bg-base-200">
        {activeSection == 'all' &&  (<div className="text-center">
          <Settings className="text-8xl md:text-9xl text-base-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light text-neutral/60">
            Settings
          </h2>
        </div>)}
        {renderContent()}
      </div>
    </div>
  );
}

export default Setting;
