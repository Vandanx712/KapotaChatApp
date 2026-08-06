import React from "react";
import { useChatStore } from "../store/useChatStore";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import InfoDrawer from "../components/InfoDrawer";

function Home() {
  const { selectedConversation, showInfo, setShowInfo } = useChatStore();

  return (
    <main className="h-screen overflow-hidden bg-canvas pl-[72px]">
      <div className="mx-auto flex h-full max-w-[1920px] border-r border-line bg-surface shadow-panel">
        <Sidebar />
        {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}

        {showInfo && (
          <InfoDrawer
            conversation={selectedConversation}
            onClose={() => setShowInfo(false)}
          />
        )}
      </div>
    </main>
  );
}

export default Home;
