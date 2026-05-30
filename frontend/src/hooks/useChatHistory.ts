"use client";

import { useState, useEffect, useCallback } from "react";
import { Message } from "@/components/ChatMessage";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ChatSession {
  id:         string;
  title:      string;
  messages:   Message[];
  files:      string[];   // uploaded filenames associated with this session
  updatedAt:  number;     // Unix ms timestamp for sorting
}

const SESSIONS_KEY     = "pdf-chatbot-sessions";
const ACTIVE_ID_KEY    = "pdf-chatbot-active-id";

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Derives a readable title from the first human message in the session. */
function deriveTitleFromMessages(messages: Message[]): string {
  const first = messages.find((m) => m.role === "human");
  if (!first) return "New chat";
  const words = first.content.trim().split(" ").slice(0, 6).join(" ");
  return words.length < first.content.trim().length ? `${words}…` : words;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useChatHistory() {
  const [sessions, setSessions]       = useState<ChatSession[]>([]);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [hydrated, setHydrated]       = useState(false);

  // ── Load from localStorage on mount ─────────────────────────────────────
  useEffect(() => {
    try {
      const rawSessions = localStorage.getItem(SESSIONS_KEY);
      const rawId       = localStorage.getItem(ACTIVE_ID_KEY);
      const loaded: ChatSession[] = rawSessions ? JSON.parse(rawSessions) : [];
      const id = rawId ?? loaded[0]?.id ?? null;
      setSessions(loaded);
      setActiveId(id);
    } catch {
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(ACTIVE_ID_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  // ── Persist sessions whenever they change ────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch { /* quota exceeded */ }
  }, [sessions, hydrated]);

  // ── Persist active ID ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (activeId) localStorage.setItem(ACTIVE_ID_KEY, activeId);
      else          localStorage.removeItem(ACTIVE_ID_KEY);
    } catch { /* quota exceeded */ }
  }, [activeId, hydrated]);

  // ── Derived: current active session ─────────────────────────────────────
  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  // ── Create a new blank session ───────────────────────────────────────────
  const createSession = useCallback((): ChatSession => {
    const session: ChatSession = {
      id:        generateSessionId(),
      title:     "New chat",
      messages:  [],
      files:     [],
      updatedAt: Date.now(),
    };
    setSessions((prev) => [session, ...prev]);
    setActiveId(session.id);
    return session;
  }, []);

  // ── Select a session by id ───────────────────────────────────────────────
  const selectSession = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // ── Update messages for the active session ───────────────────────────────
  const updateMessages = useCallback(
    (id: string, messages: Message[]) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id !== id
            ? s
            : {
                ...s,
                messages,
                // Auto-update title from first human message
                title:     deriveTitleFromMessages(messages),
                updatedAt: Date.now(),
              }
        )
      );
    },
    []
  );

  // ── Update files list for a session ─────────────────────────────────────
  const updateFiles = useCallback((id: string, files: string[]) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id !== id ? s : { ...s, files, updatedAt: Date.now() }
      )
    );
  }, []);

  // ── Rename a session ─────────────────────────────────────────────────────
  const renameSession = useCallback((id: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id !== id ? s : { ...s, title }))
    );
  }, []);

  // ── Delete a session ─────────────────────────────────────────────────────
  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => {
        const next = prev.filter((s) => s.id !== id);
        // If we deleted the active session, activate the next available one
        if (id === activeId) {
          setActiveId(next[0]?.id ?? null);
        }
        return next;
      });
    },
    [activeId]
  );

  // ── Share: copies conversation text to clipboard ─────────────────────────
  const shareSession = useCallback((id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    const text = session.messages
      .map((m) => `${m.role === "human" ? "You" : "Assistant"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text).catch(() => {});
  }, [sessions]);

  // ── Delete all sessions ──────────────────────────────────────────────────
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveId(null);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(ACTIVE_ID_KEY);
  }, []);

  return {
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
    clearAllSessions,
  };
}