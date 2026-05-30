import express from "express";
import cors from "cors";
import { ingestionGraph } from "./ingestion_graph/graph.js";
import { retrievalGraph } from "./retrieval_graph/graph.js";

const app = express();

app.use(cors());
// PDFs can be large, so we increase the JSON body limit
app.use(express.json({ limit: "50mb" }));

// Health check endpoint for Render to know it's awake
app.get("/", (req, res) => res.send("DocuMind AI Backend is alive!"));

// 1. Ingestion Endpoint
app.post("/api/ingest", async (req, res) => {
  try {
    const { files, user_id } = req.body;
    if (!user_id || !files) throw new Error("Missing files or user_id");
    
    console.log(`[ingest] Starting ingestion for user: ${user_id}`);
    const result = await ingestionGraph.invoke({ files, user_id });
    
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Ingestion failed" });
  }
});

// 2. Chat Endpoint (Server-Sent Events Streaming)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, activeFile, user_id } = req.body;
    
    // Set headers to keep the connection open for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    console.log(`[chat] Starting stream for user: ${user_id}`);

    const stream = await retrievalGraph.streamEvents(
      { messages, activeFile, user_id },
      { version: "v2" }
    );

    for await (const event of stream) {
      // Stream the text chunks from the LLM
      if (event.event === "on_chat_model_stream") {
         const chunk = event.data.chunk;
         if (chunk && chunk.content) {
            res.write(`data: ${JSON.stringify({ type: "snapshot", content: chunk.content })}\n\n`);
         }
      }
      // Grab the final sources when the generateAnswer node finishes
      if (event.event === "on_chain_end" && event.name === "generateAnswer") {
         const output = event.data.output;
         if (output && output.messages && output.messages.length > 0) {
             const lastMsg = output.messages[output.messages.length - 1];
             if (lastMsg.additional_kwargs && lastMsg.additional_kwargs.sources) {
                 res.write(`data: ${JSON.stringify({ type: "sources", sources: lastMsg.additional_kwargs.sources })}\n\n`);
             }
         }
      }
    }
    
    // Signal the frontend that the stream is finished
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : "Stream failed";
    res.write(`data: ${JSON.stringify({ type: "error", message: msg })}\n\n`);
    res.end();
  }
});

const PORT = process.env.PORT || 2024;
app.listen(PORT, () => {
  console.log(`🚀 Custom Express Backend running on port ${PORT}`);
});