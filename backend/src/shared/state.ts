import { Document } from "@langchain/core/documents";

/**
 * Represents a single retrieved source chunk shown in the UI.
 */
export interface SourceDocument {
  pageContent: string;
  metadata: Record<string, unknown>;
}

/**
 * Base message shape shared across graphs.
 */
export interface BaseMessage {
  role: "human" | "assistant" | "system";
  content: string;
}

/**
 * Utility: reduce an array of Documents into a SourceDocument array.
 * Used by the retrieval graph to accumulate retrieved chunks.
 */
export function reduceDocuments(
  current: Document[] | undefined,
  update: Document[] | Document
): Document[] {
  const incoming = Array.isArray(update) ? update : [update];
  return [...(current ?? []), ...incoming];
}