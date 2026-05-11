"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatSend } from "@/lib/hooks";
import type { ChatMessage, ToolCallRecord } from "@/lib/types";
import { MarkdownMessage } from "@/components/chat/markdown-message";

interface DisplayMessage extends ChatMessage {
  operations?: ToolCallRecord[];
}

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const sendChat = useChatSend();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sendChat.isPending]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || sendChat.isPending) return;

    const newMessages: DisplayMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInput("");

    const apiPayload: ChatMessage[] = newMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    sendChat.mutate(apiPayload, {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.reply,
            operations: data.operations,
          },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Lo siento, ha habido un error. Intenta de nuevo.",
          },
        ]);
      },
    });
  };

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg"
        size="icon"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[380px] h-[560px] bg-white rounded-lg shadow-2xl border flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div>
          <h3 className="font-semibold text-sm">Asistente</h3>
          <p className="text-xs text-slate-500">Consulta y gestiona tickets</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Mensajes */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-8 space-y-2">
            <p>Pregúntame sobre tus tickets:</p>
            <ul className="text-xs space-y-1">
              <li>"Mis tickets abiertos de prioridad alta"</li>
              <li>"Cierra el ticket #3"</li>
              <li>"Comenta en el #5 que ya está listo"</li>
              <li>"Crea un ticket sobre el bug del login"</li>
            </ul>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={`inline-block max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-900"
              }`}
            >
              {m.role === "assistant" ? (
                <MarkdownMessage>{m.content}</MarkdownMessage>
                ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
                )}
            </div>

            {m.operations && m.operations.length > 0 && (
              <div className="mt-2 space-y-1">
                {m.operations.map((op, idx) => (
                  <div
                    key={idx}
                    className={`text-xs px-2 py-1 rounded inline-block max-w-[85%] ${
                      op.success
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {op.success ? "✓" : "✗"} {op.output_summary}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {sendChat.isPending && (
          <div className="bg-slate-100 inline-block rounded-lg px-3 py-2">
            <span className="text-sm text-slate-500">Pensando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe un mensaje..."
          disabled={sendChat.isPending}
          className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleSend} disabled={!input.trim() || sendChat.isPending} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}