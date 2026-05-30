"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

interface MarkdownContentProps {
  content: string;
  /** Pass true for AI bubbles (light bg), false for human bubbles (dark bg) */
  isAssistant?: boolean;
}

const assistantComponents: Components = {
  // Paragraphs
  p: ({ children }) => (
    <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
  ),
  // Headings
  h1: ({ children }) => (
    <h1 className="text-lg font-semibold mb-2 mt-4 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mb-1 mt-3 first:mt-0">{children}</h3>
  ),
  // Bold and italic
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900 dark:text-white">
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-700 dark:text-gray-300">{children}</em>
  ),
  // Inline code
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`${className} block text-xs leading-relaxed`}
        >
          {children}
        </code>
      );
    }
    return (
      <code
        className="px-1.5 py-0.5 rounded text-xs font-mono
                   bg-gray-100 dark:bg-gray-700
                   text-gray-800 dark:text-gray-200
                   border border-gray-200 dark:border-gray-600"
      >
        {children}
      </code>
    );
  },
  // Code blocks
  pre: ({ children }) => (
    <pre
      className="my-3 p-3 rounded-xl overflow-x-auto text-xs
                 bg-gray-900 dark:bg-gray-950 text-gray-100
                 border border-gray-700"
    >
      {children}
    </pre>
  ),
  // Unordered lists
  ul: ({ children }) => (
    <ul className="mb-3 pl-5 space-y-1 list-disc marker:text-gray-400">
      {children}
    </ul>
  ),
  // Ordered lists
  ol: ({ children }) => (
    <ol className="mb-3 pl-5 space-y-1 list-decimal marker:text-gray-400">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  // Blockquotes — used for citation-style blocks
  blockquote: ({ children }) => (
    <blockquote
      className="my-3 pl-3 border-l-2 border-gray-300 dark:border-gray-600
                 text-gray-600 dark:text-gray-400 italic"
    >
      {children}
    </blockquote>
  ),
  // Horizontal rule
  hr: () => (
    <hr className="my-4 border-gray-200 dark:border-gray-700" />
  ),
  // Tables (via remark-gfm)
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-gray-50 dark:bg-gray-800">{children}</thead>
  ),
  th: ({ children }) => (
    <th
      className="px-3 py-2 text-left font-semibold text-gray-700
                 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      className="px-3 py-2 text-gray-600 dark:text-gray-400
                 border-b border-gray-100 dark:border-gray-800 last:border-0"
    >
      {children}
    </td>
  ),
  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 underline
                 underline-offset-2 hover:opacity-80 transition-opacity"
    >
      {children}
    </a>
  ),
};

export default function MarkdownContent({
  content,
  isAssistant = true,
}: MarkdownContentProps) {
  return (
    <div
      className={`text-sm leading-relaxed ${
        isAssistant
          ? "text-gray-800 dark:text-gray-100"
          : "text-white dark:text-gray-900"
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={assistantComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}