import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import { SharedConfigurationSchema } from "../shared/configuration.js";

/**
 * Retrieval-graph-specific configuration.
 * Extends the shared base with generation and routing controls.
 */
export const RetrievalConfigurationSchema = SharedConfigurationSchema.extend({
  /**
   * Temperature for the chat completion model.
   * Lower = more deterministic; higher = more creative.
   * @default 0
   */
  temperature: z.number().min(0).max(2).default(0),

  /**
   * Maximum tokens the LLM may generate in its response.
   * @default 1024
   */
  maxTokens: z.number().int().positive().default(1024),

  /**
   * When true the graph ALWAYS retrieves documents regardless of
   * what the router node decides. Useful for debugging or when you
   * always want citation-backed answers.
   * @default false
   */
  forceRetrieval: z.boolean().default(false),

  /**
   * System prompt override. When set, replaces the default prompt
   * defined in prompts.ts. Useful for white-labelling or domain
   * customisation via the LangGraph config object.
   * @default undefined (falls back to default prompt)
   */
  systemPromptOverride: z.string().optional(),
});

export type RetrievalConfiguration = z.infer<typeof RetrievalConfigurationSchema>;

/**
 * Extracts and validates retrieval configuration from a LangGraph
 * RunnableConfig. Missing fields receive schema defaults.
 *
 * Usage inside a graph node:
 * const config = getRetrievalConfig(runnableConfig);
 */
export function getRetrievalConfig(
  runnableConfig?: RunnableConfig
): RetrievalConfiguration {
  const configurable = (runnableConfig?.configurable ?? {}) as Record<string, unknown>;
  return RetrievalConfigurationSchema.parse(configurable);
}