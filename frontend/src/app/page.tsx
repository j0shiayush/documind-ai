"use client";

import { useState } from "react";
import { useChatHistory } from "@/hooks/useChatHistory";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    sessions,
    activeId,
    activeSession,
    hydrated,
    createSession,
    selectSession,
    updateMessages,
    updateFiles,
    renameSession,
    deleteSession,
    shareSession,
  } = useChatHistory();

  function handleNew() {
    createSession();
  }

  if (!hydrated) {
    // Prevent layout flash before localStorage loads
    return (
      <div className="flex h-screen items-center justify-center
                      bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 rounded-full border-2 border-gray-300
                        border-t-gray-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        sessions={sessions}
        activeId={activeId}
        onNew={handleNew}
        onSelect={selectSession}
        onRename={renameSession}
        onDelete={deleteSession}
        onShare={shareSession}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Chat
          session={activeSession}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onNewSession={createSession}
          onUpdateMessages={updateMessages}
          onUpdateFiles={updateFiles}
        />
      </div>
    </div>
  );
}