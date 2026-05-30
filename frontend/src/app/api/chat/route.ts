import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "human" | "assistant";
  content: string;
}

function toHumanAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    type: m.role === "human" ? "human" : "ai",
    content: m.content,
  }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const activeFile: string | undefined = body.activeFile;

    if (!messages.length) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    // 👉 Standard fetch to proxy the stream from our Render Express Backend!
    const apiUrl = process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";
    
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: toHumanAIMessages(messages),
        activeFile: activeFile ?? null,
        user_id: user.id
      })
    });

    // Pass Render's streaming response directly back to the client!
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[chat] Fatal error:", err);
    const message = err instanceof Error ? err.message : "Chat request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}