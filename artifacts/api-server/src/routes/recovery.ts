import { Router, type IRouter } from "express";
import { db, recoveryEntriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateRecoveryEntryBody,
  DeleteRecoveryEntryParams,
  ListRecoveryEntriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/recovery", async (_req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(recoveryEntriesTable)
    .orderBy(recoveryEntriesTable.date);
  res.json(ListRecoveryEntriesResponse.parse(entries));
});

router.post("/recovery", async (req, res): Promise<void> => {
  const parsed = CreateRecoveryEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(recoveryEntriesTable)
    .values({
      date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
      feelingScore: parsed.data.feelingScore,
      symptoms: parsed.data.symptoms,
      notes: parsed.data.notes ?? null,
      appointmentId: parsed.data.appointmentId ?? null,
    })
    .returning();

  res.status(201).json(entry);
});

router.delete("/recovery/:id", async (req, res): Promise<void> => {
  const params = DeleteRecoveryEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [entry] = await db
    .delete(recoveryEntriesTable)
    .where(eq(recoveryEntriesTable.id, params.data.id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Recovery entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
