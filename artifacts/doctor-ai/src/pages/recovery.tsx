import { useState } from "react";
import { useListRecoveryEntries, useCreateRecoveryEntry, useDeleteRecoveryEntry } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Activity, Plus, Trash2, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";

function scoreColor(score: number) {
  if (score >= 8) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 5) return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-red-100 text-red-800 border-red-200";
}

function ScoreButton({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
  const base = "h-10 w-10 rounded-full border-2 text-sm font-semibold transition-all";
  if (selected) return <button className={`${base} bg-primary border-primary text-primary-foreground scale-110`} onClick={onClick}>{value}</button>;
  const color = value >= 8 ? "border-green-300 text-green-700 hover:bg-green-50"
    : value >= 5 ? "border-amber-300 text-amber-700 hover:bg-amber-50"
    : "border-red-300 text-red-700 hover:bg-red-50";
  return <button className={`${base} ${color}`} onClick={onClick}>{value}</button>;
}

export default function Recovery() {
  const { data: entries = [], isLoading, refetch } = useListRecoveryEntries();
  const { mutateAsync: createEntry } = useCreateRecoveryEntry();
  const { mutateAsync: deleteEntry } = useDeleteRecoveryEntry();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(7);
  const [symptoms, setSymptoms] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSaving, setIsSaving] = useState(false);

  const chartData = [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14)
    .map((e) => ({
      date: format(new Date(e.date), "MMM d"),
      score: e.feelingScore,
    }));

  async function handleSave() {
    setIsSaving(true);
    try {
      await createEntry({
        data: {
          date,
          feelingScore: score,
          symptoms: symptoms || undefined,
          notes: notes || undefined,
        },
      });
      toast({ title: "Recovery entry logged" });
      setShowForm(false);
      setScore(7);
      setSymptoms("");
      setNotes("");
      setDate(new Date().toISOString().split("T")[0]);
      refetch();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteEntry({ id });
      toast({ title: "Entry deleted" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recovery Log</h1>
          <p className="text-muted-foreground mt-1">Track your daily health and recovery progress.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" /> Log Today
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/30 animate-in slide-in-from-top-2">
          <CardHeader>
            <CardTitle className="text-lg">How are you feeling today?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="max-w-[200px]" />
            </div>
            <div className="space-y-3">
              <Label>Feeling score: <span className="text-primary font-bold">{score}/10</span></Label>
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
                  <ScoreButton key={v} value={v} selected={score === v} onClick={() => setScore(v)} />
                ))}
              </div>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span>1 = Very poor</span>
                <span className="ml-auto">10 = Excellent</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Symptoms (optional)</Label>
              <Input placeholder="e.g. Headache, fatigue, sore throat…" value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input placeholder="Any additional notes…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Entry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recovery Trend (Last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  formatter={(v: number) => [`${v}/10`, "Feeling"]}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                  dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">History</h2>
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
            <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No recovery entries yet</p>
            <p className="text-sm mt-1 mb-6">Start logging your daily health to track your recovery.</p>
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" /> Log First Entry</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-base font-bold px-3 py-1 ${scoreColor(entry.feelingScore)}`}>
                        {entry.feelingScore}/10
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {format(new Date(entry.date), "EEEE, MMMM do, yyyy")}
                        </p>
                        {entry.symptoms && <p className="text-xs text-muted-foreground mt-0.5">{entry.symptoms}</p>}
                        {entry.notes && <p className="text-xs text-muted-foreground">{entry.notes}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
