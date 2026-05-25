import { Router, type IRouter } from "express";
import { db, appointmentsTable, medicationsTable, recoveryEntriesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { GetDashboardSummaryResponse, ListRecoveryEntriesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [allAppointments, allMedications, allRecovery] = await Promise.all([
    db.select().from(appointmentsTable).orderBy(appointmentsTable.scheduledAt),
    db.select().from(medicationsTable),
    db.select().from(recoveryEntriesTable).orderBy(desc(recoveryEntriesTable.date)),
  ]);

  const now = new Date();
  const upcomingAppointments = allAppointments.filter(
    (a) => a.status === "upcoming" && new Date(a.scheduledAt) > now
  );
  const activeMedications = allMedications.filter((m) => m.active);
  const recentRecovery = allRecovery.slice(0, 7);

  // Recovery streak: consecutive days with entries
  let recoveryStreak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 30; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const hasEntry = allRecovery.some((e) => {
      const d = new Date(e.date);
      return d >= day && d < nextDay;
    });
    if (hasEntry) {
      recoveryStreak++;
    } else if (i > 0) {
      break;
    }
  }

  const nextAppointment = upcomingAppointments[0] ?? null;
  const lastFeelingScore = recentRecovery[0]?.feelingScore ?? null;

  const summary = {
    upcomingAppointments: upcomingAppointments.length,
    activeMedications: activeMedications.length,
    recoveryStreak,
    lastFeelingScore,
    totalAppointments: allAppointments.length,
    recentRecoveryEntries: ListRecoveryEntriesResponse.parse(recentRecovery),
    nextAppointment: nextAppointment ?? undefined,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
