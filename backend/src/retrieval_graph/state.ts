import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { Document } from "@langchain/core/documents";

export const RetrievalStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  // NEW: Securely track the authenticated user's ID
  user_id: Annotation<string | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),

  retrievedDocs: Annotation<Document[]>({
    reducer: (_current, update) => update,
    default: () => [],
  }),

  route: Annotation<"retrieve" | "direct_answer">({
    reducer: (_current, update) => update,
    default: () => "retrieve",
  }),

  activeFile: Annotation<string | null>({
    reducer: (_current, update) => update,
    default: () => null,
  }),
});

export type RetrievalState = typeof RetrievalStateAnnotation.State;

export interface SourceReference {
  pageContent: string;
  metadata: {
    source?: string;
    page?: number;
    chunkIndex?: number;
    user_id?: string;
    [key: string]: unknown;
  };
}

export function docsToSourceReferences(docs: Document[]): SourceReference[] {
  return docs.map((doc) => ({
    pageContent: doc.pageContent,
    metadata: doc.metadata as SourceReference["metadata"],
  }));
}