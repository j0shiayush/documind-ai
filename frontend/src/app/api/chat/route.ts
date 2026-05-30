import { NextRequest, NextResponse } from "next/server";
import { Client } from "@langchain/langgraph-sdk";
import { createClient } from "@/utils/supabase/server"; // <-- Secure SSR Client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessage {
  role: "human" | "assistant";
  content: string;
}

function getLangGraphClient(): Client {
  const apiUrl =
    process.env.NEXT_PUBLIC_LANGGRAPH_API_URL ?? "http://localhost:2024";
  return new Client({ apiUrl });
}

function toHumanAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => ({
    type: m.role === "human" ? "human" : "ai",
    content: m.content,
  }));
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate the User securely on the server
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await req.json();
    const messages: ChatMessage[] = body.messages ?? [];
    const activeFile: string | undefined = body.activeFile;

    if (!messages.length) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 }
      );
    }

    const client = getLangGraphClient();
    const assistantId =
      process.env.LANGGRAPH_RETRIEVAL_ASSISTANT_ID ?? "retrieval_graph";

    const thread = await client.threads.create();

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        function send(data: Record<string, unknown>) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        }

        try {
          const langGraphStream = client.runs.stream(
            thread.thread_id,
            assistantId,
            {
              input: {
                messages: toHumanAIMessages(messages),
                activeFile: activeFile ?? null,
                user_id: user.id // <-- Pass secure ID to Python backend
              },
              streamMode: ["messages", "values"],
            }
          );

          for await (const chunk of langGraphStream) {
            if (chunk.event === "messages/partial") {
              const payloads = Array.isArray(chunk.data)
                ? chunk.data
                : [chunk.data];

              for (const payload of payloads) {
                const isAI =
                  payload?.type === "ai" || payload?.role === "assistant";
                if (isAI && typeof payload?.content === "string" && payload.content) {
                  send({ type: "snapshot", content: payload.content });
                }
              }
            }

            if (chunk.event === "values") {
              const state = chunk.data as {
                messages?: Array<{
                  type?: string;
                  additional_kwargs?: {
                    sources?: Array<{
                      pageContent: string;
                      metadata: Record<string, unknown>;
                    }>;
                  };
                }>;
              };

              const lastMsg = state?.messages?.at(-1);
              if (
                lastMsg?.type === "ai" &&
                lastMsg?.additional_kwargs?.sources?.length
              ) {
                send({
                  type: "sources",
                  sources: lastMsg.additional_kwargs.sources,
                });
              }
            }
          }

          send({ type: "done" });
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Stream error occurred.";
          console.error("[chat] Stream error:", err);
          send({ type: "error", message: msg });
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[chat] Fatal error:", err);
    const message =
      err instanceof Error ? err.message : "Chat request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}