import React, { useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { themes } from "../constants/index";
import {
  ArrowRight,
  Bell,
  CircleQuestionMark,
  Key,
  Keyboard,
  Lock,
  MessageCircle,
  Monitor,
  Settings,
  Video,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

const preview_message = [
  { id: 1, content: "Hey! How's it going", issent: false },
  {
    id: 2,
    content: "I'm doing great! just working on some new features",
    issent: true,
  },
];

function Setting() {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();

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
    console.log("Clicked:", label);
  };

  return (
    <div className="mx-auto h-screen pt-16 max-w-[1600px] grid lg:grid-cols-[400px_1fr] bg-base-100">
      {/* Sidebar */}
      <div className="flex flex-col border-r border-base-300 overflow-hidden">
        {/* Profile Section */}
        <div
          className="flex items-center gap-3 md:gap-4 mt-5 mx-5 p-3 rounded-lg md:px-6 cursor-pointer hover:bg-secondary transition-colors active:bg-base-300"
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

        <div className="divider"></div>

        {/* Settings List */}
        <div className="flex-1 overflow-y-auto">
          {settingsItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 md:gap-5 px-4 md:px-6 py-3 md:py-4 cursor-pointer hover:bg-secondary transition-colors border-b border-base-300 active:bg-base-300 animate-slideIn"
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

      {/* Main Content - Empty State (Hidden on mobile) */}
      <div className="hidden lg:flex items-center justify-center bg-base-200">
        <div className="text-center">
          <Settings className="text-8xl md:text-9xl text-base-300 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-light text-neutral/60">
            Settings
          </h2>
        </div>
      </div>
    </div>
  );
}

export default Setting;
