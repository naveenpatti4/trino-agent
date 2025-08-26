import "server-only";
import { NextRequest } from "next/server";
import { buildAgent } from "@/lib/agent";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatBody = { messages: ChatMessage[]; input?: string };

function sse<T>(data: T) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// (intentionally left blank - legacy helpers removed)

export async function POST(req: NextRequest) {
  const { messages = [], input = "" } = (await req.json()) as ChatBody;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === "") {
          controller.enqueue(
            encoder.encode(
              sse({ type: "error", message: "Missing OPENAI_API_KEY. Set it in .env.local or export it before starting the dev server." })
            )
          );
          controller.enqueue(encoder.encode(sse({ type: "done" })));
          controller.close();
          return;
        }
        const { agent } = buildAgent();
        const history = messages;
        const stream = agent.stream(input ? [...history, { role: "user", content: input }] : history);
        for await (const evt of stream as AsyncIterable<
          | { type: "token"; chunk: string }
          | { type: "tool_call"; name?: string; input?: unknown }
          | { type: "tool_result"; name?: string; output?: unknown }
          | { type: "done" }
        >) {
          controller.enqueue(encoder.encode(sse(evt)));
        }
        controller.enqueue(encoder.encode(sse({ type: "done" })));
        controller.close();
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(sse({ type: "error", message })));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
