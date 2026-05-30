import { Document } from "@langchain/core/documents";

/**
 * Formats an array of LangChain Documents into a single context string
 * that is injected into the LLM prompt.
 *
 * Each chunk is separated by a divider so the model can clearly distinguish
 * between different source passages.
 */
export function formatDocumentsAsString(docs: Document[]): string {
  return docs
    .map(
      (doc, index) =>
        `<source index="${index + 1}">\n${doc.pageContent}\n</source>`
    )
    .join("\n\n");
}

/**
 * Safely parses a JSON string; returns a fallback value on failure.
 */
export function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Truncates a string to a max character length, appending "..." if cut.
 */
export function truncate(text: string, maxChars = 300): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}