import { SystemMessage } from "@langchain/core/messages";

/**
 * The primary RAG system prompt.
 *
 * Design decisions:
 * 1. Instructs the model to answer ONLY from the provided <source> blocks,
 *    preventing hallucination of unsupported claims.
 * 2. Requires explicit source citations by index so the UI can highlight
 *    which chunks were used.
 * 3. Tells the model to admit when the context is insufficient rather than
 *    guessing — critical for document Q&A trust.
 * 4. Uses XML-style <source> tags that mirror what formatDocumentsAsString()
 *    in shared/utils.ts produces, so tag names are consistent end-to-end.
 *
 * @param context - Pre-formatted source blocks produced by formatDocumentsAsString()
 * @param customInstruction - Optional extra instruction appended at the end
 */
export function buildRagSystemPrompt(
  context: string,
  customInstruction?: string
): SystemMessage {
  const base = `You are an expert AI assistant that answers questions about documents \
with precision and clarity.

## Instructions
- Answer the user's question using ONLY the information contained in the \
<sources> block below.
- Do not include any source citations, reference numbers, or brackets (e.g., [1], [2]) in your final response. \
Provide a clean, natural text output.
- If the provided sources do not contain enough information to answer the \
question fully, say: "I don't have enough information in the provided \
documents to answer that question fully." Do NOT invent or infer facts \
beyond what is explicitly stated.
- Keep your answer concise and well-structured. Use bullet points or numbered \
lists only when it genuinely aids clarity.
- When quoting directly from a source, wrap the quote in quotation marks and \
include its citation.

## Sources
<sources>
${context}
</sources>
${customInstruction ? `\n## Additional Instructions\n${customInstruction}` : ""}`;

  return new SystemMessage(base);
}

/**
 * Router system prompt.
 *
 * Used by the router node to classify whether the user's question
 * requires document retrieval or can be answered directly from the
 * model's general knowledge (e.g. greetings, meta-questions).
 */
export const ROUTER_SYSTEM_PROMPT = `You are a query router for a document Q&A system.

Your only job is to classify the user's latest message into one of two categories:

1. "retrieve"       — The question is about the content of uploaded documents \
and requires searching the knowledge base to answer accurately.
2. "direct_answer"  — The question is conversational, a greeting, a meta-question \
about the system itself, or can be answered from general knowledge without \
consulting any documents.

Respond with ONLY one of these two strings and nothing else:
retrieve
direct_answer`;

/**
 * Fallback prompt used when the router selects "direct_answer".
 * The model answers from its parametric knowledge without any source context.
 */
export const DIRECT_ANSWER_SYSTEM_PROMPT = `You are a helpful AI assistant. \
Answer the user's question clearly and concisely based on your general knowledge. \
If the question seems to require specific document content, let the user know \
they can upload a PDF and ask again.`;