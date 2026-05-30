import { StateGraph, END, START } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

import { IngestionStateAnnotation, IngestionState } from "./state.js";
import { getIngestionConfig } from "./configuration.js";
import { addDocumentsToVectorStore } from "../shared/retrieval.js";

// ---------------------------------------------------------------------------
// Node 1 — parseAndSplitDocuments
// ---------------------------------------------------------------------------
async function parseAndSplitDocuments(
  state: IngestionState,
  runnableConfig?: RunnableConfig
): Promise<Partial<IngestionState>> {
  const { files, user_id } = state;
  const config = getIngestionConfig(runnableConfig);

  if (!files || files.length === 0) {
    return {
      messages: [new AIMessage("No files provided for ingestion. Aborting.")],
      docs: [],
    };
  }

  if (!user_id) {
    throw new Error("Security Error: No user_id provided to the ingestion graph.");
  }

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ["\n\n", "\n", " ", ""],
  });

  const allDocs: Document[] = [];

  for (const file of files) {
    if (!file.content || file.content.trim().length === 0) {
      console.warn(`[ingestion] Skipping empty file: ${file.name}`);
      continue;
    }

    const chunks = await splitter.splitText(file.content);

    // Attach the user_id directly into the metadata of every chunk
    const docs: Document[] = chunks.map((chunk, index) => ({
      pageContent: chunk,
      metadata: {
        source: file.name,
        mimeType: file.mimeType,
        chunkIndex: index,
        totalChunks: chunks.length,
        page: Math.floor(index / 4) + 1,
        user_id: user_id, // Secure metadata tag
      },
    }));

    allDocs.push(...docs);
    console.log(
      `[ingestion] Split "${file.name}" into ${docs.length} chunks ` +
        `(chunkSize=${config.chunkSize}, overlap=${config.chunkOverlap})`
    );
  }

  return {
    docs: allDocs,
    messages: [
      new HumanMessage(`Ingestion started for ${files.map((f) => f.name).join(", ")}`),
      new AIMessage(`Successfully parsed and split ${files.length} file(s) into ${allDocs.length} total chunks. Ready for embedding.`),
    ],
  };
}

// ---------------------------------------------------------------------------
// Node 2 — storeEmbeddings
// ---------------------------------------------------------------------------
async function storeEmbeddings(
  state: IngestionState,
  runnableConfig?: RunnableConfig
): Promise<Partial<IngestionState>> {
  const { docs, user_id } = state;
  const config = getIngestionConfig(runnableConfig);

  if (!docs || docs.length === 0) {
    return {
      isIngestionComplete: false,
      messages: [new AIMessage("No document chunks to embed. Ingestion did not complete.")],
    };
  }

  try {
    console.log(`[ingestion] Generating embeddings and storing ${docs.length} chunks...`);

    const BATCH_SIZE = 50;
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      
      // Pass the user_id down to the database insertion helper
      await addDocumentsToVectorStore(batch, config, user_id!);
      
      console.log(`[ingestion] Stored batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(docs.length / BATCH_SIZE)}`);
    }

    return {
      isIngestionComplete: true,
      messages: [new AIMessage(`✅ Ingestion complete. ${docs.length} chunks have been secured and stored.`)],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error during embedding";
    console.error("[ingestion] Embedding failed:", error);

    return {
      isIngestionComplete: false,
      messages: [new AIMessage(`❌ Ingestion failed during embedding: ${message}`)],
    };
  }
}

// ---------------------------------------------------------------------------
// Conditional edge & Graph assembly
// ---------------------------------------------------------------------------
function shouldStoreEmbeddings(state: IngestionState): "storeEmbeddings" | typeof END {
  if (!state.docs || state.docs.length === 0) return END;
  return "storeEmbeddings";
}

const workflow = new StateGraph(IngestionStateAnnotation)
  .addNode("parseAndSplitDocuments", parseAndSplitDocuments)
  .addNode("storeEmbeddings", storeEmbeddings)
  .addEdge(START, "parseAndSplitDocuments")
  .addConditionalEdges("parseAndSplitDocuments", shouldStoreEmbeddings, {
    storeEmbeddings: "storeEmbeddings",
    [END]: END,
  })
  .addEdge("storeEmbeddings", END);

export const graph = workflow.compile();
export const ingestionGraph = graph;