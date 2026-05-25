import { useState } from "react";
import { useListMedications, useCreateMedication, useDeleteMedication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Pill, Plus, Trash2, Clock, Loader2, CalendarRange } from "lucide-react";
import type { Medication } from "@workspace/api-client-react";

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 8 hours", "Every 12 hours", "As needed", "Weekly"];

function MedicationCard({ med, onDelete }: { med: Medication; onDelete: (id: number) => void }) {
  const isActive = !med.endDate || new Date(med.endDate) >= new Date();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{med.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{med.dosage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              {isActive ? "Active" : "Ended"}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(med.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{med.frequency}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarRange className="h-3.5 w-3.5 shrink-0" />
          <span>
            Started {new Date(med.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {med.endDate && ` · Ends ${new Date(med.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
          </span>
        </div>
        {med.reminderTimes && med.reminderTimes.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {med.reminderTimes.map((t) => (
              <Badge key={t} variant="outline" className="text-xs gap-1">
                <Clock className="h-2.5 w-2.5" /> {t}
              </Badge>
            ))}
          </div>
        )}
        {med.notes && <p className="text-sm text-muted-foreground border-t pt-2 mt-2">{med.notes}</p>}
      </CardContent>
    </Card>
  );
}

export default function Medications() {
  const { data: medications = [], isLoading, refetch } = useListMedications();
  const { mutateAsync: createMedication } = useCreateMedication();
  const { mutateAsync: deleteMedication } = useDeleteMedication();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    frequency: "Once daily",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reminder1: "",
    reminder2: "",
    notes: "",
  });

  function field(key: keyof typeof form) {
    return { value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value })) };
  }

  async function handleSave() {
    if (!form.name || !form.dosage) return;
    setIsSaving(true);
    try {
      const reminderTimes = [form.reminder1, form.reminder2].filter(Boolean);
      await createMedication({
        data: {
          name: form.name,
          dosage: form.dosage,
          frequency: form.frequency,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          reminderTimes: reminderTimes.length ? reminderTimes : undefined,
          notes: form.notes || undefined,
        },
      });
      toast({ title: "Medication added" });
      setOpen(false);
      setForm({ name: "", dosage: "", frequency: "Once daily", startDate: new Date().toISOString().split("T")[0], endDate: "", reminder1: "", reminder2: "", notes: "" });
      refetch();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMedication({ id });
      toast({ title: "Medication removed" });
      refetch();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  }

  const active = medications.filter((m) => !m.endDate || new Date(m.endDate) >= new Date());
  const ended = medications.filter((m) => m.endDate && new Date(m.endDate) < new Date());

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Medications</h1>
          <p className="text-muted-foreground mt-1">Track your prescriptions and reminder times.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Medication
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Pill className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No medications tracked</p>
          <p className="text-sm mt-1 mb-6">Add your prescriptions to keep track of dosages and reminders.</p>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Add First Medication</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Active ({active.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map((m) => <MedicationCard key={m.id} med={m} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
          {ended.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-muted-foreground">Ended ({ended.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                {ended.map((m) => <MedicationCard key={m.id} med={m} onDelete={handleDelete} />)}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medication</DialogTitle>
            <DialogDescription>Enter the details of your prescription.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2">
                <Label>Medication name *</Label>
                <Input placeholder="e.g. Metformin" {...field("name")} />
              </div>
              <div className="space-y-2">
                <Label>Dosage *</Label>
                <Input placeholder="e.g. 500mg" {...field("dosage")} />
              </div>
              <div className="space-y-2">
                <Label>Frequency</Label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" {...field("frequency")}>
                  {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Start date</Label>
                <Input type="date" {...field("startDate")} />
              </div>
              <div className="space-y-2">
                <Label>End date (optional)</Label>
                <Input type="date" {...field("endDate")} min={form.startDate} />
              </div>
              <div className="space-y-2">
                <Label>Reminder time 1</Label>
                <Input type="time" {...field("reminder1")} />
              </div>
              <div className="space-y-2">
                <Label>Reminder time 2</Label>
                <Input type="time" {...field("reminder2")} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Notes (optional)</Label>
                <Input placeholder="e.g. Take with food" {...field("notes")} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name || !form.dosage || isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Add Medication"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
