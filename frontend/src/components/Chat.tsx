"use client";

import Image from "next/image";
import {
  useState, useRef, useEffect, useCallback,
  ChangeEvent, KeyboardEvent,
} from "react";
import ChatMessage, { Message } from "./ChatMessage";
import { Source } from "./SourceCards";
import { ChatSession } from "@/hooks/useChatHistory";
import ThemeToggle from "./ThemeToggle";

interface ChatProps {
  session:           ChatSession | null;
  sidebarOpen:       boolean;
  onToggleSidebar:   () => void;
  onNewSession:      () => ChatSession;
  onUpdateMessages:  (id: string, messages: Message[]) => void;
  onUpdateFiles:     (id: string, files: string[]) => void;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

let messageCounter = 0;
function generateId() {
  return `msg_${Date.now()}_${++messageCounter}`;
}

function TypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div className="bg-white dark:bg-gray-800 border border-gray-200
                      dark:border-gray-700 rounded-2xl rounded-bl-sm
                      shadow-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              style={{ animationDelay: `${delay}ms` }}
              className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Chat({
  session,
  sidebarOpen,
  onToggleSidebar,
  onNewSession,
  onUpdateMessages,
  onUpdateFiles,
}: ChatProps) {
  const messages     = session?.messages ?? [];
  const uploadedFiles = session?.files ?? [];

  const [input, setInput]               = useState("");
  const [isStreaming, setIsStreaming]   = useState(false);
  const [isThinking, setIsThinking]     = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadError, setUploadError]   = useState<string | null>(null);
  const [activeFile, setActiveFile]     = useState<string | null>(null);

  const fileInputRef       = useRef<HTMLInputElement>(null);
  const messagesEndRef     = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const textareaRef        = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Reset active file when session changes
  useEffect(() => {
    setActiveFile(session?.files[0] ?? null);
    setInput("");
  }, [session?.id]);

  // Focus textarea when input is set programmatically (e.g., from chips)
  useEffect(() => {
    if (input && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [input]);

  // ── Helpers that write through to the session store ──────────────────────

  function getOrCreateSession(): ChatSession {
    return session ?? onNewSession();
  }

  function setMessages(
    updater: Message[] | ((prev: Message[]) => Message[])
  ) {
    const sess = getOrCreateSession();
    const next = typeof updater === "function"
      ? updater(sess.messages)
      : updater;
    onUpdateMessages(sess.id, next);
  }

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploadStatus("uploading");
      setUploadError(null);

      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("files", f));

      try {
        const res  = await fetch("/api/ingest", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed.");

        const ingested = data.filesIngested as string[];
        const sess = getOrCreateSession();
        const merged = Array.from(new Set([...sess.files, ...ingested]));

        onUpdateFiles(sess.id, merged);
        setActiveFile((prev) => prev ?? ingested[0] ?? null);
        setUploadStatus("success");

        setMessages((prev) => [
          ...prev,
          {
            id:      generateId(),
            role:    "assistant",
            content: `✅ Ingested: ${ingested.join(", ")}. Ask me anything about it.`,
          },
        ]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed.";
        setUploadStatus("error");
        setUploadError(msg);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [session]
  );

  // ── Chat submit ──────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const humanMessage: Message = {
      id: generateId(), role: "human", content: trimmed,
    };
    const streamingId = generateId();

    // Track the running state of messages locally to avoid stale closures
    let currentMessages = [...(session?.messages ?? []), humanMessage];
    
    setMessages(currentMessages);
    setIsStreaming(true);
    setIsThinking(true);

    abortControllerRef.current = new AbortController();

    try {
      const history = currentMessages.map((m) => ({
        role: m.role, content: m.content,
      }));

      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ messages: history, activeFile }),
        signal:  abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Chat request failed.");
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let sources: Source[]  = [];
      let buffer             = "";
      let hasFirstToken      = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let parsed: Record<string, unknown>;
          try { parsed = JSON.parse(raw); } catch { continue; }

          if (parsed.type === "snapshot") {
            const content = parsed.content as string;
            
            // CRITICAL FIX: Push updates to our local currentMessages array 
            // instead of relying on the stale state wrapper.
            if (!hasFirstToken) {
              hasFirstToken = true;
              setIsThinking(false);
              currentMessages = [
                ...currentMessages,
                { id: streamingId, role: "assistant", content, isStreaming: true },
              ];
              setMessages(currentMessages);
            } else {
              currentMessages = currentMessages.map((m) =>
                m.id === streamingId ? { ...m, content } : m
              );
              setMessages(currentMessages);
            }
          }

          if (parsed.type === "sources") sources = parsed.sources as Source[];

          if (parsed.type === "error") throw new Error(parsed.message as string);

          if (parsed.type === "done") {
            currentMessages = currentMessages.map((m) =>
              m.id === streamingId
                ? { ...m, isStreaming: false, sources: sources.length > 0 ? sources : undefined }
                : m
            );
            setMessages(currentMessages);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "An error occurred.";
      setIsThinking(false);
      
      // Also fix error handling to use local array
      currentMessages = [
        ...currentMessages,
        { id: generateId(), role: "assistant", content: `❌ Error: ${msg}` },
      ];
      setMessages(currentMessages);
      
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, session, activeFile]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Determine the display title for the header tooltip
  const displayTitle = session?.title && session.title !== "New chat" ? session.title : "DocuMind AI";

  // Suggestion Chips Data
  const suggestionChips = [
    { icon: "📝", text: "Summarize this document" },
    { icon: "📊", text: "Extract key metrics" },
    { icon: "🎯", text: "List action items" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">

      {/* ── Top bar ───────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800
                         bg-white dark:bg-gray-900 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">

          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              className="w-9 h-9 flex items-center justify-center rounded-lg
                         text-gray-500 dark:text-gray-400
                         hover:bg-gray-100 dark:hover:bg-gray-800
                         active:scale-95 transition-all cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Added Logo & Updated Title Logic with Tooltip Hover */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 relative lg:hidden flex-shrink-0">
                <Image src="/logo.png" alt="DocuMind AI Logo" fill className="object-contain" />
              </div>
              <h1 
                className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px]"
                title={displayTitle}
              >
                {displayTitle}
              </h1>
            </div>

          </div>

          {/* Right: file selector + badge + theme toggle */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {uploadedFiles.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <label htmlFor="active-file-select"
                         className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    Searching:
                  </label>
                  <select
                    id="active-file-select"
                    value={activeFile ?? ""}
                    onChange={(e) =>
                      setActiveFile(e.target.value === "" ? null : e.target.value)
                    }
                    className="text-xs rounded-lg border border-gray-200
                               dark:border-gray-700 bg-white dark:bg-gray-800
                               text-gray-700 dark:text-gray-300 px-2 py-1.5
                               focus:outline-none focus:ring-1 focus:ring-gray-400
                               cursor-pointer max-w-[90px] sm:max-w-[140px] truncate
                               hover:border-gray-400 transition-colors"
                  >
                    <option value="">All documents</option>
                    {uploadedFiles.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div className="hidden sm:flex items-center gap-1 text-xs
                                text-gray-500 dark:text-gray-400
                                bg-gray-100 dark:bg-gray-800
                                px-2.5 py-1.5 rounded-full whitespace-nowrap">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
                       stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2
                             h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707
                             V19a2 2 0 01-2 2z" />
                  </svg>
                  {uploadedFiles.length} PDF{uploadedFiles.length > 1 ? "s" : ""}
                </div>
              </>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Messages ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">

          {messages.length === 0 && !isThinking && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center w-full">
              {/* Glowing Icon Wrapper */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500 dark:bg-blue-600 rounded-full blur-xl animate-slow-pulse"></div>
                <div className="relative w-20 h-20 rounded-3xl bg-white dark:bg-gray-800 
                                border border-gray-100 dark:border-gray-700 shadow-md
                                flex items-center justify-center z-10">
                  <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2
                             h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707
                             V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {session ? "What would you like to know?" : "Start a new chat"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Upload a PDF using the paperclip icon below, then ask anything about it. Or, try one of these suggestions to get started.
              </p>

              {/* Suggestion Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
                {suggestionChips.map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(chip.text)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                               bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                               text-gray-700 dark:text-gray-300 shadow-sm transition-all duration-200
                               hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900
                               active:scale-95 cursor-pointer"
                  >
                    <span>{chip.icon}</span>
                    {chip.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {isThinking && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ── Upload error ───────────────────────────────────────────────── */}
      {uploadError && (
        <div className="flex-shrink-0 max-w-3xl mx-auto w-full px-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-red-600
                          dark:text-red-400 bg-red-50 dark:bg-red-950/30
                          border border-red-200 dark:border-red-800
                          rounded-xl px-4 py-2.5">
            <span className="flex-1">{uploadError}</span>
            <button onClick={() => setUploadError(null)}
                    className="text-red-400 hover:text-red-600 cursor-pointer">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Input ─────────────────────────────────────────────────────── */}
      <footer className="flex-shrink-0 bg-transparent px-4 py-4 mb-2 relative">
        <div className="max-w-3xl mx-auto relative group">
          
          {/* Subtle Glow behind the input box */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur-md pointer-events-none"></div>
          
          <div className="relative flex items-end gap-3 bg-white dark:bg-gray-900
                          border border-gray-300 dark:border-gray-700 shadow-sm
                          rounded-3xl px-4 py-3 focus-within:border-gray-400
                          dark:focus-within:border-gray-500 transition-colors z-10">

            {/* Paperclip */}
            <div className="flex-shrink-0 relative mb-0.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                onChange={handleFileUpload}
                disabled={uploadStatus === "uploading" || isStreaming}
              />
              <button
                title="Upload PDF(s)"
                tabIndex={-1}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-full
                  transition-all duration-150 cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95
                  ${uploadStatus === "uploading"
                    ? "text-gray-300 dark:text-gray-600 pointer-events-none"
                    : uploadStatus === "success"
                    ? "text-green-500 hover:text-green-600"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }
                `}
              >
                {uploadStatus === "uploading" ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                )}
              </button>
            </div>

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={activeFile ? `Ask about ${activeFile}…` : "Send a message…"}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm py-1.5
                         text-gray-900 dark:text-white placeholder-gray-500
                         dark:placeholder-gray-400 focus:outline-none
                         leading-relaxed max-h-[120px] overflow-y-auto"
            />

            <div className="flex-shrink-0 mb-0.5">
              <button
                onClick={isStreaming ? () => abortControllerRef.current?.abort() : handleSubmit}
                disabled={!isStreaming && !input.trim()}
                title={isStreaming ? "Stop" : "Send"}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-150 active:scale-95
                  ${isStreaming
                    ? "bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                    : input.trim()
                    ? "bg-black dark:bg-white text-white dark:text-black hover:opacity-80 cursor-pointer shadow-md"
                    : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  }
                `}
              >
                {isStreaming ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="1" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <p className="hidden sm:block text-center text-xs text-gray-400 dark:text-gray-500 mt-3 font-medium">
            <kbd className="font-sans">Enter</kbd> to send &nbsp;·&nbsp;
            <kbd className="font-sans">Shift+Enter</kbd> for newline
          </p>
        </div>
      </footer>
    </div>
  );
}