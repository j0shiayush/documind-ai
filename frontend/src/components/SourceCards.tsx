"use client";

import { useState } from "react";

export interface Source {
  pageContent: string;
  metadata: {
    source?: string;
    page?: number;
    chunkIndex?: number;
    [key: string]: unknown;
  };
}

interface SourceCardsProps {
  sources: Source[];
}

export default function SourceCards({ sources }: SourceCardsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 w-full">
      {/* Accordion toggle */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700
                   dark:text-gray-400 dark:hover:text-gray-200 transition-colors
                   focus:outline-none"
        aria-expanded={isOpen}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span>
          View Sources ({sources.length})
        </span>
      </button>

      {/* Source cards grid */}
      {isOpen && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sources.map((source, index) => {
            const fileName = source.metadata?.source
              ? source.metadata.source.split("/").pop() ?? source.metadata.source
              : "Unknown source";
            const page = source.metadata?.page;

            return (
              <div
                key={index}
                className="rounded-lg border border-gray-200 dark:border-gray-700
                           bg-gray-50 dark:bg-gray-800/60 p-3
                           hover:border-gray-300 dark:hover:border-gray-600
                           transition-colors cursor-default"
              >
                {/* Filename */}
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300
                              truncate leading-snug">
                  ./{fileName}
                </p>
                {/* Page number */}
                {page !== undefined && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Page {page}
                  </p>
                )}
                {/* Snippet preview — hidden by default, visible on hover */}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400
                              line-clamp-2 leading-relaxed">
                  {source.pageContent}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}