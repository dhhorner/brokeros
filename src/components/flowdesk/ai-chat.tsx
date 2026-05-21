"use client";

import { useChat } from "ai/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useEffect } from "react";

export function AiChat({ brokerageId }: { brokerageId?: string }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      api: "/api/ai/chat",
      body: { brokerageId },
      initialMessages: [
        {
          id: "welcome",
          role: "assistant",
          content:
            "Hi! I'm your BrokerOS AI assistant. I can help you draft emails, summarize deals, suggest tasks, and answer questions about your transactions. What do you need?",
        },
      ],
    });

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 mt-1">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-900 rounded-bl-sm"
                )}
              >
                <p className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 mt-1">
                  <User className="h-4 w-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 mt-1">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="border-t border-slate-200 p-4 flex gap-2"
      >
        <Textarea
          value={input}
          onChange={handleInputChange}
          placeholder="Ask about a deal, draft an email, suggest tasks..."
          className="resize-none min-h-[44px] max-h-32"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
