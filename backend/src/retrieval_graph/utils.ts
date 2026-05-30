import { BaseMessage, HumanMessage } from "@langchain/core/messages";

/**
 * Extracts the text content of the most recent human message in the
 * conversation history. Used by the router and retrieval nodes to
 * determine what the user is currently asking.
 *
 * @throws if no HumanMessage is found in the history
 */
export function getLatestHumanMessage(messages: BaseMessage[]): string {
  // Walk backwards — the latest human turn is usually near the end
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg instanceof HumanMessage || msg.getType() === "human") {
      const content = msg.content;
      if (typeof content === "string") return content;
      // Handle multi-part content arrays (vision models, etc.)
      if (Array.isArray(content)) {
        return content
          .filter((part) => typeof part === "object" && "text" in part)
          .map((part) => (part as { text: string }).text)
          .join(" ");
      }
    }
  }
  throw new Error(
    "[retrieval] No HumanMessage found in conversation history. " +
      "Ensure the graph receives at least one human turn before invocation."
  );
}

/**
 * Parses the raw string output of the router LLM call into the
 * typed route value expected by the state annotation.
 *
 * Defaults to "retrieve" when the model response is ambiguous —
 * it is always safer to retrieve than to skip retrieval.
 */
export function parseRouterOutput(
  raw: string
): "retrieve" | "direct_answer" {
  const cleaned = raw.trim().toLowerCase();
  if (cleaned.includes("direct_answer")) return "direct_answer";
  return "retrieve"; // safe default
}

/**
 * Formats retrieved Document metadata into a compact string shown
 * alongside each source card in the frontend UI.
 *
 * Example output: "report-2024.pdf — Page 3"
 */
export function formatSourceLabel(metadata: Record<string, unknown>): string {
  const source =
    typeof metadata.source === "string"
      ? metadata.source
      : "Unknown source";
  const page =
    typeof metadata.page === "number" ? ` — Page ${metadata.page}` : "";
  return `${source}${page}`;
}