import { z } from "zod";

export const ModelProviderSchema = z.enum(["google"]);
export type ModelProvider = z.infer<typeof ModelProviderSchema>;

export const RetrieverProviderSchema = z.enum(["supabase"]);
export type RetrieverProvider = z.infer<typeof RetrieverProviderSchema>;

export const SharedConfigurationSchema = z.object({
  modelProvider: ModelProviderSchema.default("google"),

  /**
   * @default "gemini-2.5-flash"
   */
  modelName: z.string().default("gemini-2.5-flash"),

  /**
   * @default "gemini-embedding-001"
   */
  embeddingModel: z.string().default("gemini-embedding-001"),

  retrieverProvider: RetrieverProviderSchema.default("supabase"),

  kDocuments: z.number().int().positive().default(5),

  filterKwargs: z.record(z.unknown()).default({}),
});

export type SharedConfiguration = z.infer<typeof SharedConfigurationSchema>;

export function parseSharedConfig(
  configurable?: Record<string, unknown>
): SharedConfiguration {
  return SharedConfigurationSchema.parse(configurable ?? {});
}