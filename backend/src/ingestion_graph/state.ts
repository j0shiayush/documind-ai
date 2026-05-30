import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { Document } from "@langchain/core/documents";

/**
 * Represents a raw file payload passed into the ingestion graph.
 * `content` is the base64-encoded or raw text content of the PDF.
 */
export interface FilePayload {
  name: string;
  content: string;
  mimeType: string;
}

/**
 * Ingestion graph state annotation.
 */
export const IngestionStateAnnotation = Annotation.Root({
  files: Annotation<FilePayload[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  // NEW: Store the authenticated user's ID
  user_id: Annotation<string | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  docs: Annotation<Document[]>({
    reducer: (current, update) => [...(current ?? []), ...update],
    default: () => [],
  }),

  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  isIngestionComplete: Annotation<boolean>({
    reducer: (_current, update) => update,
    default: () => false,
  }),
});

export type IngestionState = typeof IngestionStateAnnotation.State;