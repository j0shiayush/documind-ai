import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/server"; // <-- Switched to secure SSR client
import pdf from "pdf-parse/lib/pdf-parse.js";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function getLangGraphClient(): Client {
  const apiUrl =
    process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";
  return new Client({ apiUrl });
}

/**
 * Deletes all existing chunks for a given source filename.
 * RLS ensures the user can ONLY delete their own chunks.
 */
async function deleteExistingChunks(supabase: any, fileName: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", fileName);

  if (error) {
    throw new Error(
      `Failed to delete existing chunks for "${fileName}": ${error.message}`
    );
  }

  console.log(`[ingest] Deleted existing chunks for: ${fileName}`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate the User securely on the server
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const formData = await req.formData();
    const rawFiles = formData.getAll("files") as File[];

    if (!rawFiles || rawFiles.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }
    if (rawFiles.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed per upload.` },
        { status: 400 }
      );
    }

    for (const file of rawFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 10MB limit.` },
          { status: 400 }
        );
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: `File "${file.name}" is not a PDF.` },
          { status: 400 }
        );
      }
    }

    // Step 1: Delete old chunks (Protected by RLS)
    await Promise.all(rawFiles.map((file) => deleteExistingChunks(supabase, file.name)));

    // Step 2: Extract text from each PDF
    const filePayloads = await Promise.all(
      rawFiles.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const parsed = await pdf(buffer);
        return {
          name: file.name,
          content: parsed.text,
          mimeType: file.type,
        };
      })
    );

    // Step 3: Run the ingestion graph and pass the user_id securely
    const client = getLangGraphClient();
    const assistantId =
      process.env.LANGGRAPH_INGESTION_ASSISTANT_ID ?? "ingestion_graph";

    const thread = await client.threads.create();
    const run = await client.runs.wait(thread.thread_id, assistantId, {
      input: { 
        files: filePayloads,
        user_id: user.id // <-- Giving LangGraph the user's ID
      },
    });

    return NextResponse.json({
      success: true,
      threadId: thread.thread_id,
      filesIngested: filePayloads.map((f) => f.name),
      result: run,
    });
  } catch (err) {
    console.error("[ingest] Error:", err);
    const message =
      err instanceof Error ? err.message : "Ingestion failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}