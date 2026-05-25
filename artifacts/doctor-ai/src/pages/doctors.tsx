import { useState } from "react";
import {
  useListDoctors,
  useCreateAppointment,
  listDoctors,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, Stethoscope, Phone, Mail, CalendarPlus, Loader2 } from "lucide-react";
import type { Doctor } from "@workspace/api-client-react";

const SPECIALTIES = ["All", "General Practice", "Cardiology", "Dermatology", "Neurology", "Pediatrics", "Orthopedics", "Psychiatry", "Internal Medicine"];

function DoctorCard({ doctor, onBook }: { doctor: Doctor; onBook: (doctor: Doctor) => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{doctor.name}</CardTitle>
              <Badge variant="secondary" className="mt-1 text-xs">{doctor.specialty}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {doctor.bio && <CardDescription className="text-sm leading-relaxed">{doctor.bio}</CardDescription>}
        <div className="space-y-1.5 text-sm text-muted-foreground">
          {doctor.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{doctor.phone}</span>
            </div>
          )}
          {doctor.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span>{doctor.email}</span>
            </div>
          )}
        </div>
        {doctor.availableDays && doctor.availableDays.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {doctor.availableDays.map((day) => (
              <Badge key={day} variant="outline" className="text-xs">{day}</Badge>
            ))}
          </div>
        )}
        <Button className="w-full mt-2" onClick={() => onBook(doctor)}>
          <CalendarPlus className="h-4 w-4 mr-2" /> Book Appointment
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Doctors() {
  const { data: doctors = [], isLoading, refetch } = useListDoctors();
  const { mutateAsync: createAppointment } = useCreateAppointment();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("All");
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("09:00");
  const [bookingReason, setBookingReason] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  const filtered = doctors.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesSpecialty = specialty === "All" || d.specialty === specialty;
    return matchesSearch && matchesSpecialty;
  });

  async function confirmBooking() {
    if (!bookingDoctor || !bookingDate) return;
    setIsBooking(true);
    try {
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      await createAppointment({
        data: {
          doctorId: bookingDoctor.id,
          scheduledAt,
          reason: bookingReason || undefined,
        },
      });
      toast({ title: "Appointment booked!", description: `Scheduled with ${bookingDoctor.name}.` });
      setBookingDoctor(null);
      setBookingDate("");
      setBookingTime("09:00");
      setBookingReason("");
      refetch();
    } catch {
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Doctor Directory</h1>
        <p className="text-muted-foreground mt-1">Find and book appointments with specialists.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or specialty…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {SPECIALTIES.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => setSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors whitespace-nowrap ${
                specialty === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/50 text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
          <select
            value={SPECIALTIES.slice(5).includes(specialty) ? specialty : ""}
            onChange={(e) => e.target.value && setSpecialty(e.target.value)}
            className="px-3 py-1.5 rounded-full text-sm border border-border bg-background text-muted-foreground"
          >
            <option value="">More…</option>
            {SPECIALTIES.slice(5).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Stethoscope className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No doctors found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => <DoctorCard key={d.id} doctor={d} onBook={setBookingDoctor} />)}
        </div>
      )}

      <Dialog open={!!bookingDoctor} onOpenChange={(open) => !open && setBookingDoctor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with {bookingDoctor?.name} ({bookingDoctor?.specialty})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Time</Label>
                <Input type="time" value={bookingTime} onChange={(e) => setBookingTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input placeholder="e.g. Annual checkup, Follow-up…" value={bookingReason} onChange={(e) => setBookingReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDoctor(null)}>Cancel</Button>
            <Button onClick={confirmBooking} disabled={!bookingDate || isBooking}>
              {isBooking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Booking…</> : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
