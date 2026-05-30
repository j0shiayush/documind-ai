import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { VectorStoreRetriever } from "@langchain/core/vectorstores";
import { Document } from "@langchain/core/documents";
import { SharedConfiguration } from "./configuration.js";

function getEmbeddings(config: SharedConfiguration): GoogleGenerativeAIEmbeddings {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_API_KEY environment variable.");
  }
  return new GoogleGenerativeAIEmbeddings({
    apiKey,
    modelName: config.embeddingModel,
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }
  return createClient(supabaseUrl, supabaseKey);
}

function buildSupabaseVectorStore(
  config: SharedConfiguration
): SupabaseVectorStore {
  return new SupabaseVectorStore(getEmbeddings(config), {
    client: getSupabaseClient(),
    tableName: "documents",
    queryName: "match_documents",
  });
}

/**
 * Returns a configured retriever for vector similarity search.
 */
export function makeRetriever(
  config: SharedConfiguration
): VectorStoreRetriever<SupabaseVectorStore> {
  switch (config.retrieverProvider) {
    case "supabase": {
      const vectorStore = buildSupabaseVectorStore(config);
      return vectorStore.asRetriever({
        k: config.kDocuments,
        filter:
          Object.keys(config.filterKwargs).length > 0
            ? config.filterKwargs
            : undefined,
      });
    }
    default: {
      const _exhaustive: never = config.retrieverProvider;
      throw new Error(`Unsupported retriever provider: ${_exhaustive}`);
    }
  }
}

/**
 * Ingests document chunks directly into Supabase.
 * We added userId to the signature to clear the TS error, but the actual user ID
 * is already safely embedded inside the docs' metadata from the ingestion graph!
 */
export async function addDocumentsToVectorStore(
  docs: Document[],
  config: SharedConfiguration,
  userId: string 
): Promise<void> {
  const vectorStore = new SupabaseVectorStore(getEmbeddings(config), {
    client: getSupabaseClient(),
    tableName: "documents",
    queryName: "match_documents",
  });
  
  await vectorStore.addDocuments(docs);
}