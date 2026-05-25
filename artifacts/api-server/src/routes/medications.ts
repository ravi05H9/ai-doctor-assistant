import { Router, type IRouter } from "express";
import { db, medicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateMedicationBody,
  UpdateMedicationBody,
  UpdateMedicationParams,
  DeleteMedicationParams,
  UpdateMedicationResponse,
  ListMedicationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/medications", async (_req, res): Promise<void> => {
  const medications = await db
    .select()
    .from(medicationsTable)
    .orderBy(medicationsTable.createdAt);
  res.json(ListMedicationsResponse.parse(medications));
});

router.post("/medications", async (req, res): Promise<void> => {
  const parsed = CreateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [medication] = await db
    .insert(medicationsTable)
    .values({
      name: parsed.data.name,
      dosage: parsed.data.dosage,
      frequency: parsed.data.frequency,
      reminderTime: parsed.data.reminderTime ?? null,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : new Date(),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      notes: parsed.data.notes ?? null,
      active: true,
    })
    .returning();

  res.status(201).json(UpdateMedicationResponse.parse(medication));
});

router.patch("/medications/:id", async (req, res): Promise<void> => {
  const params = UpdateMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateMedicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.dosage !== undefined) updateData.dosage = parsed.data.dosage;
  if (parsed.data.frequency !== undefined) updateData.frequency = parsed.data.frequency;
  if (parsed.data.reminderTime !== undefined) updateData.reminderTime = parsed.data.reminderTime;
  if (parsed.data.active !== undefined) updateData.active = parsed.data.active;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

  const [medication] = await db
    .update(medicationsTable)
    .set(updateData)
    .where(eq(medicationsTable.id, params.data.id))
    .returning();

  if (!medication) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  res.json(UpdateMedicationResponse.parse(medication));
});

router.delete("/medications/:id", async (req, res): Promise<void> => {
  const params = DeleteMedicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [medication] = await db
    .delete(medicationsTable)
    .where(eq(medicationsTable.id, params.data.id))
    .returning();

  if (!medication) {
    res.status(404).json({ error: "Medication not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
