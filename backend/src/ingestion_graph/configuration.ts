import { z } from "zod";
import { RunnableConfig } from "@langchain/core/runnables";
import {
  SharedConfigurationSchema,
  parseSharedConfig,
} from "../shared/configuration.js";

/**
 * Ingestion-specific configuration, extending the shared base config.
 *
 * These values control how the PDF is split into chunks before embedding.
 */
export const IngestionConfigurationSchema = SharedConfigurationSchema.extend({
  /**
   * Maximum number of characters per document chunk.
   * Smaller values = more granular retrieval but more embeddings.
   * @default 1000
   */
  chunkSize: z.number().int().positive().default(1000),

  /**
   * Number of characters to overlap between consecutive chunks.
   * Overlap preserves context at chunk boundaries.
   * @default 200
   */
  chunkOverlap: z.number().int().nonnegative().default(200),

  /**
   * The text splitter strategy to use.
   * "recursive" uses RecursiveCharacterTextSplitter (recommended).
   * @default "recursive"
   */
  splitterType: z.enum(["recursive"]).default("recursive"),
});

export type IngestionConfiguration = z.infer<typeof IngestionConfigurationSchema>;

/**
 * Extracts and validates ingestion configuration from a LangGraph
 * RunnableConfig object. Any fields not supplied fall back to defaults.
 *
 * Usage inside a graph node:
 *   const config = getIngestionConfig(runnableConfig);
 */
export function getIngestionConfig(
    runnableConfig?: RunnableConfig
  ): IngestionConfiguration {
    const configurable = (runnableConfig?.configurable ?? {}) as Record<string, unknown>;
    return IngestionConfigurationSchema.parse(configurable);
  }