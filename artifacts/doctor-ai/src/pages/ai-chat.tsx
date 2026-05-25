import { useState, useRef, useEffect } from "react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiMessages,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Trash2, Send, Loader2, Bot, User } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Message = { role: "user" | "assistant"; content: string; streaming?: boolean };

function ChatView({ convId, onBack }: { convId: number; onBack: () => void }) {
  const { data: history = [], isLoading } = useListOpenaiMessages(convId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (history.length > 0 && messages.length === 0) {
      setMessages(history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  }, [history]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStreaming(true);

    try {
      const resp = await fetch(`${BASE}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            try {
              const parsed = JSON.parse(data);
              if (parsed.done) break;
              const chunk = parsed.content ?? parsed.delta ?? "";
              if (chunk) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  updated[updated.length - 1] = { ...last, content: last.content + chunk };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], streaming: false };
        return updated;
      });
    } catch {
      toast({ title: "Send failed", description: "Could not send message. Please try again.", variant: "destructive" });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <span className="text-sm text-muted-foreground">AI Health Chat</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Describe your symptoms</p>
            <p className="text-sm mt-1">I'll help you understand what might be happening and which specialist to see.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm"
            }`}>
              {m.content}
              {m.streaming && <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />}
            </div>
            {m.role === "user" && (
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your symptoms…"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          disabled={streaming}
          className="flex-1"
        />
        <Button onClick={sendMessage} disabled={streaming || !input.trim()}>
          {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function AiChat() {
  const { data: conversations = [], isLoading, refetch } = useListOpenaiConversations();
  const { mutateAsync: createConversation } = useCreateOpenaiConversation();
  const { mutateAsync: deleteConversation } = useDeleteOpenaiConversation();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const { toast } = useToast();

  async function startNew() {
    const conv = await createConversation({ data: { title: `Chat ${new Date().toLocaleDateString()}` } });
    refetch();
    setActiveConvId(conv.id);
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await deleteConversation({ id });
    toast({ title: "Conversation deleted" });
    if (activeConvId === id) setActiveConvId(null);
    refetch();
  }

  if (activeConvId !== null) {
    return (
      <div className="animate-in fade-in">
        <ChatView convId={activeConvId} onBack={() => setActiveConvId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Health Chat</h1>
          <p className="text-muted-foreground mt-1">Describe your symptoms and get AI-powered health guidance.</p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-2" /> New Chat
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No conversations yet</p>
          <p className="text-sm mt-1 mb-6">Start a new chat to describe your symptoms.</p>
          <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" /> Start New Chat</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveConvId(conv.id)}
            >
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{conv.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(conv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(conv.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
