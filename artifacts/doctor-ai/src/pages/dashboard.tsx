import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MessageCircle, Pill, Activity } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading, error } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border">
        <h2 className="text-xl font-semibold text-destructive mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Good morning.</h1>
        <p className="text-muted-foreground mt-1 text-lg">Here is your daily health summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Upcoming</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Medications</CardTitle>
            <Pill className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activeMedications}</div>
            <p className="text-xs text-muted-foreground">Active prescriptions</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Recovery Streak</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.recoveryStreak} Days</div>
            <p className="text-xs text-muted-foreground">Logged in a row</p>
          </CardContent>
        </Card>
        <Card className="hover-elevate transition-shadow bg-primary text-primary-foreground border-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-primary-foreground/90">Last Score</CardTitle>
            <Activity className="h-4 w-4 text-primary-foreground/90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lastFeelingScore || '-'} / 10</div>
            <p className="text-xs text-primary-foreground/80">Feeling score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>AI Symptom Check</CardTitle>
            <CardDescription>Describe how you are feeling and get guidance.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Not feeling well?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Chat with your personal AI assistant to understand your symptoms and find the right specialist.
            </p>
            <Link href="/ai-chat">
              <Button size="lg" className="w-full sm:w-auto">Start Chat</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next Appointment</CardTitle>
            <CardDescription>Your upcoming medical visit.</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.nextAppointment ? (
              <div className="space-y-4">
                <div className="p-4 bg-secondary/50 rounded-lg border border-secondary-border">
                  <div className="font-semibold text-lg">{summary.nextAppointment.doctorName}</div>
                  <div className="text-primary text-sm mb-3">{summary.nextAppointment.doctorSpecialty}</div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(new Date(summary.nextAppointment.scheduledAt), "EEEE, MMMM do 'at' h:mm a")}
                  </div>
                  {summary.nextAppointment.reason && (
                    <div className="text-sm mt-3 pt-3 border-t">
                      <span className="font-medium text-foreground">Reason:</span> {summary.nextAppointment.reason}
                    </div>
                  )}
                </div>
                <Link href="/appointments">
                  <Button variant="outline" className="w-full">View All Appointments</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center p-6 border border-dashed rounded-lg">
                <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-muted-foreground mb-4">No upcoming appointments scheduled.</p>
                <Link href="/doctors">
                  <Button variant="secondary">Find a Doctor</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
