"use client";

import { useState, useEffect } from "react";
import { useChatHistory } from "@/hooks/useChatHistory";
import Sidebar from "@/components/Sidebar";
import Chat from "@/components/Chat";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client"; // Added to check login state

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClient();

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

  // ── Check if a real user or Google Bot is viewing the page ──
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setAuthLoading(false);
    }
    checkUser();
  }, [supabase]);

  function handleNew() {
    createSession();
  }

  // Prevent layout flash before localStorage and auth check loads
  if (!hydrated || authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
      </div>
    );
  }

  // ── PUBLIC LANDING PAGE (What the Google Bot sees) ──
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <div className="max-w-xl text-center space-y-6">
          <h1 className="text-4xl font-bold tracking-tight">DocuMind AI</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            An intelligent document analysis platform. Upload PDF documents and interact with an AI assistant to summarize volumes of text, extract key metrics, and answer domain-specific questions instantly.
          </p>
          
          <div className="pt-4">
            <Link 
              href="/login" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow transition"
            >
              Sign In / Get Started
            </Link>
          </div>
        </div>

        <footer className="mt-16 text-sm text-gray-500 space-y-2 text-center max-w-lg">
          <p>
            <strong>Privacy & Data Usage Policy:</strong> We request basic profile information (Name and Email) through Google OAuth solely for account identification and securely separating your document chat history. Your records are never shared with third parties.
          </p>
        </footer>
      </div>
    );
  }

  // ── APP CONTAINER (What you see when logged in) ──
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