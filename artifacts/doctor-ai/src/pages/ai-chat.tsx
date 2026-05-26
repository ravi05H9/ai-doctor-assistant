import { useState, useRef, useEffect, useCallback } from "react";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useDeleteOpenaiConversation,
  useListOpenaiMessages,
  useTranscribeAudio,
} from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Plus, Trash2, Send, Loader2, Bot, User, Mic, MicOff, Square } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type Message = { role: "user" | "assistant"; content: string; streaming?: boolean };

type RecordingState = "idle" | "recording" | "transcribing";

function VoiceButton({
  onTranscript,
  disabled,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { mutateAsync: transcribeAudio } = useTranscribeAudio();
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const format = mimeType.includes("mp4") ? "mp3" : "webm";

        setState("transcribing");
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const result = await transcribeAudio({ data: { audioBase64: base64, format } });
          if (result.text.trim()) {
            onTranscript(result.text.trim());
          } else {
            toast({ title: "No speech detected", description: "Please speak clearly and try again." });
          }
        } catch {
          toast({ title: "Transcription failed", description: "Could not understand audio. Please try again.", variant: "destructive" });
        } finally {
          setState("idle");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setState("recording");
    } catch {
      toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser.", variant: "destructive" });
    }
  }, [transcribeAudio, onTranscript, toast]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;
  }, []);

  if (state === "transcribing") {
    return (
      <Button type="button" variant="outline" size="icon" disabled className="shrink-0">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </Button>
    );
  }

  if (state === "recording") {
    return (
      <Button
        type="button"
        variant="destructive"
        size="icon"
        onClick={stopRecording}
        className="shrink-0 animate-pulse"
        title="Stop recording"
      >
        <Square className="h-4 w-4 fill-current" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      className="shrink-0"
      title="Speak your symptoms"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
}

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

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content }]);
    setStreaming(true);

    try {
      const resp = await fetch(`${BASE}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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
            <p className="text-sm mt-1">Type or tap the mic to speak — I'll help identify what's happening and which specialist to see.</p>
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

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms…"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={streaming}
            className="flex-1"
          />
          <VoiceButton
            onTranscript={(text) => {
              setInput(text);
            }}
            disabled={streaming}
          />
          <Button onClick={() => sendMessage()} disabled={streaming || !input.trim()}>
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          <Mic className="h-3 w-3 inline mr-1 opacity-60" />
          Tap the mic to speak your symptoms — they'll appear in the box above
        </p>
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
          <p className="text-muted-foreground mt-1">Describe your symptoms by typing or speaking — get AI-powered health guidance.</p>
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
