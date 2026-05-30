"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChatSession } from "@/hooks/useChatHistory";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onShare: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface SessionRowProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onShare: () => void;
}

// ── Individual session row ─────────────────────────────────────────────────

function SessionRow({
  session, isActive, onSelect, onRename, onDelete, onShare,
}: SessionRowProps) {
  const [hovering, setHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(session.title);
  const [shareToast, setShareToast] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const handleShare = useCallback(() => {
    onShare();
    setMenuOpen(false);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2000);
  }, [onShare]);

  const commitRename = useCallback(() => {
    const trimmed = draftTitle.trim();
    if (trimmed) onRename(trimmed);
    setRenaming(false);
  }, [draftTitle, onRename]);

  return (
    <div
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => { setHovering(false); setMenuOpen(false); }}
      className={`
        relative group flex items-center gap-2 w-full rounded-xl px-3 py-2.5
        cursor-pointer transition-all duration-150 text-sm
        ${isActive
          ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
        }
      `}
      onClick={() => { if (!renaming) onSelect(); }}
    >
      {isActive && (
        <span className="absolute left-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      <svg className={`w-4 h-4 flex-shrink-0 opacity-60 ${isActive ? 'ml-1' : ''}`} fill="none"
        viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03
             8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72
             C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9
             3.582 9 8z" />
      </svg>

      {renaming ? (
        <input
          ref={inputRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") { setDraftTitle(session.title); setRenaming(false); }
            e.stopPropagation();
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-b border-gray-400
                     dark:border-gray-500 outline-none text-sm py-0.5"
        />
      ) : (
        <span className="flex-1 min-w-0 truncate" title={session.title}>
  {session.title}
</span>
      )}

      {shareToast && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]
                         bg-gray-900 dark:bg-white text-white dark:text-gray-900
                         px-2 py-0.5 rounded-full pointer-events-none z-10 font-medium tracking-wide shadow-sm">
          COPIED
        </span>
      )}

      {hovering && !renaming && !shareToast && (
        <div ref={menuRef} className="relative flex-shrink-0"
          onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Session options"
            className="w-6 h-6 flex items-center justify-center rounded-md
                       hover:bg-gray-300 dark:hover:bg-gray-600
                       transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 w-36 rounded-xl
                            bg-white dark:bg-gray-800 border border-gray-200
                            dark:border-gray-700 shadow-lg overflow-hidden">
              {[
                {
                  label: "Rename",
                  icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
                  action: () => { setRenaming(true); setMenuOpen(false); },
                },
                {
                  label: "Share",
                  icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
                  action: handleShare,
                },
                {
                  label: "Delete",
                  icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
                  action: () => { onDelete(); setMenuOpen(false); },
                  danger: true,
                },
              ].map(({ label, icon, action, danger }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 text-sm
                    transition-colors cursor-pointer text-left
                    ${danger
                      ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────

export default function Sidebar({
  sessions, activeId, onNew, onSelect,
  onRename, onDelete, onShare, isOpen, onToggle,
}: SidebarProps) {
  const [search, setSearch] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Fetch logged-in user email dynamically
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    }
    getUser();
  }, [supabase]);

  // Handle outside click close for profile popup
  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const now = Date.now();
  const MS_DAY = 86_400_000;
  const todayStart = now - (now % MS_DAY);
  const yesterdayStart = todayStart - MS_DAY;

  const groups: { label: string; items: ChatSession[] }[] = [
    {
      label: "Today",
      items: filtered.filter((s) => s.updatedAt >= todayStart),
    },
    {
      label: "Yesterday",
      items: filtered.filter(
        (s) => s.updatedAt >= yesterdayStart && s.updatedAt < todayStart
      ),
    },
    {
      label: "Earlier",
      items: filtered.filter((s) => s.updatedAt < yesterdayStart),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-30 h-full flex flex-col
          w-72 bg-[#f9fafb] dark:bg-gray-900
          border-r border-gray-200 dark:border-gray-800
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
          ${!isOpen ? "lg:hidden" : ""}
        `}
      >
        {/* Top bar with new Logo */}
        <div className="flex items-center justify-between px-4 py-4
                        border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex-shrink-0 relative">
              <Image 
                src="/logo.png" 
                alt="DocuMind AI Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="font-bold text-gray-900 dark:text-white text-base tracking-tight">
              DocuMind AI
            </span>
          </div>
          <button
            onClick={onToggle}
            title="Close sidebar"
            className="w-8 h-8 flex items-center justify-center rounded-lg
                       text-gray-500 dark:text-gray-400
                       hover:bg-gray-200 dark:hover:bg-gray-800
                       active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* New Chat button */}
        <div className="px-3 pt-4 pb-3 flex-shrink-0">
          <button
            onClick={onNew}
            className="w-full flex items-center justify-center gap-2
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       border border-gray-200 dark:border-gray-700 shadow-sm
                       hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98]
                       transition-all duration-150 cursor-pointer
                       rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide"
          >
            <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800
                          border border-gray-200 dark:border-gray-700 shadow-sm
                          rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search chats…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-gray-700
                         dark:text-gray-300 placeholder-gray-400
                         dark:placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sessions list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {groups.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500
                          text-center pt-8 font-medium">
              No chats yet. Start a new one!
            </p>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500
                            px-3 pb-2 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((session) => (
                  <SessionRow
                    key={session.id}
                    session={session}
                    isActive={session.id === activeId}
                    onSelect={() => onSelect(session.id)}
                    onRename={(title) => onRename(session.id, title)}
                    onDelete={() => onDelete(session.id)}
                    onShare={() => onShare(session.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Premium User Profile Card Footer ───────────────────────────────── */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 relative" ref={profileMenuRef}>
          {profileMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 z-50 rounded-2xl
                            bg-white dark:bg-gray-800 border border-gray-200
                            dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium
                           text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          )}

          <div 
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2
                       hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer select-none transition-colors border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
          >
            {/* Dynamic Avatar Initials Generation */}
            <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-xs shadow-sm uppercase flex-shrink-0">
              {userEmail ? userEmail.charAt(0) : "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                Logged in as
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-medium">
                {userEmail ?? "Loading user..."}
              </p>
            </div>
            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </div>

      </aside>
    </>
  );
}