"use client";

import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";
import ToolActivity from "./ToolActivity";
import ConnectionStatus from "./ConnectionStatus";
import dynamic from "next/dynamic";

// Load voice input only on the client to avoid SSR hydration mismatches
const VoiceInput = dynamic(() => import("./VoiceInput"), { ssr: false });

type Msg = { role: "user" | "assistant"; content: string };
type ToolEvent =
  | { type: "tool_call"; name?: string; input?: Record<string, unknown> }
  | { type: "tool_result"; name?: string; output?: string };

type ConnectionStatusData = {
  mode: string;
  status: string;
  message: string;
  endpoint: string | null;
  features: string[];
};

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi! I can explore your Trino catalogs and run SQL. Try asking: What catalogs are available?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusData | null>(null);
  // Removed unused currentTool state

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, toolEvents]);

  // Fetch connection status on component mount
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/health/trino");
        const data = await res.json();
        if (data.ok && data.connection) {
          setConnectionStatus(data.connection);
        }
      } catch (error) {
        console.error("Failed to fetch connection status:", error);
      }
    }
    fetchStatus();
  }, []);

  async function sendMessage() {
    if (!input.trim() || streaming) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    setToolEvents([]);

    const history = [...messages, userMsg].filter((m) => m.content.length > 0);

    const res = await fetch("/api/chat/stream", {
      method: "POST",
      body: JSON.stringify({ messages: history, input: "" }),
      headers: { "Content-Type": "application/json" },
    });

    const reader = res.body?.getReader();
    if (!reader) {
      setStreaming(false);
      return;
    }

    const dec = new TextDecoder();
    let done = false;
    while (!done) {
      const { value, done: d } = await reader.read();
      done = d;
      if (value) {
        const text = dec.decode(value);
        const events = text.split("\n\n").filter(Boolean);
        for (const e of events) {
          if (!e.startsWith("data:")) continue;
          const payload = JSON.parse(e.slice(5).trim());
          if (payload.type === "token") {
            setMessages((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex((m, i) => m.role === "assistant" && i === copy.length - 1);
              const j = idx === -1 ? copy.length - 1 : idx;
              copy[j] = { role: "assistant", content: (copy[j]?.content || "") + payload.chunk };
              return copy;
            });
          } else if (payload.type === "tool_call" || payload.type === "tool_result") {
            setToolEvents((prev) => [...prev, payload]);
            // Could track current tool here if needed for UI
          } else if (payload.type === "done") {
            setStreaming(false);
          } else if (payload.type === "error") {
            setStreaming(false);
            setMessages((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex((m, i) => m.role === "assistant" && i === copy.length - 1);
              const j = idx === -1 ? copy.length - 1 : idx;
              copy[j] = { role: "assistant", content: `Error: ${payload.message}` };
              return copy;
            });
          }
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Connection Status */}
      <ConnectionStatus status={connectionStatus} />

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-auto p-6 pb-20">
        <div className="space-y-6 max-w-6xl mx-auto">
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} content={m.content} />
          ))}
          
          {/* Tool Activity */}
          <ToolActivity events={toolEvents} />
        
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Sticky Input Area */}
      <div className="sticky bottom-0 border-t border-slate-100 p-6 bg-white rounded-b-xl shadow-lg">
        <VoiceInput
          value={input}
          onChange={setInput}
          onSubmit={sendMessage}
          disabled={streaming}
          placeholder="Ask about catalogs, schemas, tables, or run a SQL query…"
        />
      </div>
    </div>
  );
}
