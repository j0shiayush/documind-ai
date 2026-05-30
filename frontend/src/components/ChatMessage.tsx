"use client";

import MarkdownContent from "./MarkdownContent";
import SourceCards, { Source } from "./SourceCards";

export interface Message {
  id: string;
  role: "human" | "assistant";
  content: string;
  isStreaming?: boolean;
  sources?: Source[];
}

export default function ChatMessage({ message }: { message: Message }) {
  const isHuman = message.role === "human";

  return (
    <div className={`flex w-full ${isHuman ? "justify-end" : "justify-start"} mb-6`}>
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[75%] 
          ${isHuman 
            ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 px-5 py-3.5 rounded-3xl rounded-br-sm shadow-sm" 
            : "bg-gray-100 dark:bg-transparent dark:border dark:border-gray-800 text-gray-900 dark:text-gray-100 px-5 py-4 rounded-3xl rounded-bl-sm"
          }`}
      >
        <MarkdownContent 
          content={message.content} 
          isAssistant={!isHuman} 
        />
        
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-800 pt-3">
            <SourceCards sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}