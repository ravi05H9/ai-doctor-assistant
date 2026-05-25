import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const recoveryEntriesTable = pgTable("recovery_entries", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  feelingScore: integer("feeling_score").notNull(),
  symptoms: text("symptoms").notNull(),
  notes: text("notes"),
  appointmentId: integer("appointment_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRecoveryEntrySchema = createInsertSchema(recoveryEntriesTable).omit({ id: true, createdAt: true });
export type InsertRecoveryEntry = z.infer<typeof insertRecoveryEntrySchema>;
export type RecoveryEntry = typeof recoveryEntriesTable.$inferSelect;
