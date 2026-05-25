import { useState } from "react";
import { useListAppointments, useUpdateAppointment, useDeleteAppointment } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Calendar, Clock, Stethoscope, Loader2, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import type { Appointment } from "@workspace/api-client-react";

type Tab = "upcoming" | "completed" | "cancelled";

function statusBadge(status: string) {
  if (status === "upcoming") return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Upcoming</Badge>;
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
  return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Cancelled</Badge>;
}

function AppointmentCard({
  appt,
  onCancel,
  onReschedule,
}: {
  appt: Appointment;
  onCancel: (id: number) => void;
  onReschedule: (appt: Appointment) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{appt.doctorName ?? "Doctor"}</CardTitle>
              {appt.doctorSpecialty && <p className="text-sm text-primary">{appt.doctorSpecialty}</p>}
            </div>
          </div>
          {statusBadge(appt.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{format(new Date(appt.scheduledAt), "EEEE, MMMM do, yyyy")}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{format(new Date(appt.scheduledAt), "h:mm a")}</span>
        </div>
        {appt.reason && (
          <div className="text-sm border-t pt-3 mt-3">
            <span className="font-medium">Reason:</span> <span className="text-muted-foreground">{appt.reason}</span>
          </div>
        )}
        {appt.status === "upcoming" && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => onReschedule(appt)}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Reschedule
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
              onClick={() => onCancel(appt.id)}
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Appointments() {
  const { data: appointments = [], isLoading, refetch } = useListAppointments();
  const { mutateAsync: updateAppointment } = useUpdateAppointment();
  const { mutateAsync: deleteAppointment } = useDeleteAppointment();
  const { toast } = useToast();

  const [tab, setTab] = useState<Tab>("upcoming");
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [isSaving, setIsSaving] = useState(false);

  const filtered = appointments.filter((a) => a.status === tab);

  async function handleCancel(id: number) {
    try {
      await updateAppointment({ id, data: { status: "cancelled" } });
      toast({ title: "Appointment cancelled" });
      refetch();
    } catch {
      toast({ title: "Cancel failed", variant: "destructive" });
    }
  }

  async function handleReschedule() {
    if (!rescheduling || !newDate) return;
    setIsSaving(true);
    try {
      const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
      await updateAppointment({ id: rescheduling.id, data: { scheduledAt } });
      toast({ title: "Appointment rescheduled" });
      setRescheduling(null);
      refetch();
    } catch {
      toast({ title: "Reschedule failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: appointments.filter((a) => a.status === "upcoming").length },
    { key: "completed", label: "Completed", count: appointments.filter((a) => a.status === "completed").length },
    { key: "cancelled", label: "Cancelled", count: appointments.filter((a) => a.status === "cancelled").length },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground mt-1">Manage your upcoming and past visits.</p>
        </div>
        <Link href="/doctors">
          <Button><Calendar className="h-4 w-4 mr-2" /> Book New</Button>
        </Link>
      </div>

      <div className="flex gap-2 border-b pb-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.key ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No {tab} appointments</p>
          {tab === "upcoming" && (
            <><p className="text-sm mt-1 mb-6">Book an appointment with a doctor to get started.</p>
            <Link href="/doctors"><Button variant="outline">Find a Doctor</Button></Link></>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((a) => (
            <AppointmentCard
              key={a.id}
              appt={a}
              onCancel={handleCancel}
              onReschedule={(appt) => {
                setRescheduling(appt);
                const d = new Date(appt.scheduledAt);
                setNewDate(d.toISOString().split("T")[0]);
                setNewTime(d.toTimeString().slice(0, 5));
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={!!rescheduling} onOpenChange={(open) => !open && setRescheduling(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Choose a new date and time.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduling(null)}>Cancel</Button>
            <Button onClick={handleReschedule} disabled={!newDate || isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
