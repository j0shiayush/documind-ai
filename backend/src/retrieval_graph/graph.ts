import { StateGraph, END, START } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, SystemMessage } from "@langchain/core/messages";

import { RetrievalStateAnnotation, RetrievalState } from "./state.js";
import { getRetrievalConfig } from "./configuration.js";
import {
  buildRagSystemPrompt,
  DIRECT_ANSWER_SYSTEM_PROMPT,
} from "./prompts.js";
import { getLatestHumanMessage } from "./utils.js";
import { makeRetriever } from "../shared/retrieval.js";
import { formatDocumentsAsString } from "../shared/utils.js";

async function retrieveDocuments(
  state: RetrievalState,
  runnableConfig?: RunnableConfig
): Promise<Partial<RetrievalState>> {
  const config = getRetrievalConfig(runnableConfig);
  const query = getLatestHumanMessage(state.messages);

  if (!state.user_id) {
    throw new Error("Security Error: No user_id provided for retrieval.");
  }

  // 1. ABSOLUTE SECURITY: Force the retriever to only fetch documents belonging to this user
  config.filterKwargs = {
    ...config.filterKwargs,
    user_id: state.user_id,
  };

  // 2. Build a source filter if the user has an active file selected
  if (state.activeFile) {
    config.filterKwargs.source = state.activeFile;
    console.log(`[retrieval] Filtering to source: "${state.activeFile}" for user: ${state.user_id}`);
  }

  const retriever = makeRetriever(config);
  const docs = await retriever.invoke(query);

  console.log(`[retrieval] Retrieved ${docs.length} chunk(s).`);
  return { retrievedDocs: docs };
}

async function generateAnswer(
  state: RetrievalState,
  runnableConfig?: RunnableConfig
): Promise<Partial<RetrievalState>> {
  const config = getRetrievalConfig(runnableConfig);

  const chatModel = new ChatOpenAI({
    apiKey: process.env.GOOGLE_API_KEY,
    modelName: "gemini-2.5-flash",
    temperature: config.temperature,
    streaming: true,
    configuration: {
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    },
  });

  // ── IRONCLAD DATE DIRECTIVE ────────────────────────────────────────────
  const DATE_DIRECTIVE = `ABSOLUTE TEMPORAL DIRECTIVE — THIS OVERRIDES YOUR TRAINING DATA:
The current date is May 2026. This is a verified, immutable fact.
- Any date in 2025 (Jan 2025 – Dec 2025) is FULLY IN THE PAST.
- Any date in early 2026 is RECENT PAST.
- You are STRICTLY FORBIDDEN from flagging, penalizing, marking as "future", 
  "inaccurate", "not yet occurred", or questioning ANY date in 2025 or 2026.
- If a resume or document lists experience from Sep 2025, Dec 2025, or any 
  2025/2026 date, you MUST treat it as completed, real, past experience.
- Violation of this directive is a critical reasoning error. Do not commit it.`;

  let systemPrompt: SystemMessage;

  if (state.retrievedDocs.length === 0) {
    systemPrompt = new SystemMessage(
      `${DATE_DIRECTIVE}\n\n${config.systemPromptOverride ?? DIRECT_ANSWER_SYSTEM_PROMPT}`
    );
  } else {
    const context = formatDocumentsAsString(state.retrievedDocs);
    const ragPrompt = buildRagSystemPrompt(context, config.systemPromptOverride);
    // Prepend the date directive to the RAG prompt content
    systemPrompt = new SystemMessage(
      `${DATE_DIRECTIVE}\n\n${ragPrompt.content}`
    );
  }

  const messagesWithSystem = [systemPrompt, ...state.messages];
  const response = await chatModel.invoke(messagesWithSystem, runnableConfig);

  response.additional_kwargs = {
    ...response.additional_kwargs,
    sources: state.retrievedDocs.map((doc) => ({
      pageContent: doc.pageContent,
      metadata:    doc.metadata,
    })),
  };

  return { messages: [response] };
}

const workflow = new StateGraph(RetrievalStateAnnotation)
  .addNode("retrieveDocuments", retrieveDocuments)
  .addNode("generateAnswer", generateAnswer)
  .addEdge(START, "retrieveDocuments")
  .addEdge("retrieveDocuments", "generateAnswer")
  .addEdge("generateAnswer", END);

export const graph = workflow.compile();
export const retrievalGraph = graph;