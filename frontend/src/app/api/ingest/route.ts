import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; 
// @ts-ignore
import pdf from "pdf-parse/lib/pdf-parse.js";
const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

async function deleteExistingChunks(supabase: any, fileName: string): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("metadata->>source", fileName);

  if (error) {
    throw new Error(`Failed to delete existing chunks for "${fileName}": ${error.message}`);
  }
  console.log(`[ingest] Deleted existing chunks for: ${fileName}`);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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
      return NextResponse.json({ error: `Maximum ${MAX_FILES} files allowed.` }, { status: 400 });
    }

    for (const file of rawFiles) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: `File "${file.name}" exceeds 10MB limit.` }, { status: 400 });
      }
      if (file.type !== "application/pdf") {
        return NextResponse.json({ error: `File "${file.name}" is not a PDF.` }, { status: 400 });
      }
    }

    await Promise.all(rawFiles.map((file) => deleteExistingChunks(supabase, file.name)));

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

    // 👉 Standard fetch to our custom Render Express Backend!
    const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";
    const response = await fetch(`${apiUrl}/api/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: filePayloads,
        user_id: user.id
      })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Backend ingestion failed.");
    }
    const data = await response.json();

    return NextResponse.json({
      success: true,
      filesIngested: filePayloads.map((f) => f.name),
      result: data.result,
    });
  } catch (err) {
    console.error("[ingest] Error:", err);
    const message = err instanceof Error ? err.message : "Ingestion failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}