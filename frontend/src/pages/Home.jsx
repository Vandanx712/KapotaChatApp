import React from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import InfoDrawer from "../components/InfoDrawer";

function Home() {
  const { selectedConversation, showInfo, setShowInfo } = useChatStore();

  return (
    <div className="h-screen bg-base-200">
      <div className="pt-16 h-full">
        <div className="flex h-[calc(100vh-4rem)]">
          <Sidebar />
          {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}

          {showInfo && (
            <InfoDrawer
              conversation={selectedConversation}
              onClose={() => setShowInfo()}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
