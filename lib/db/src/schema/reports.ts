import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reportAnalysesTable = pgTable("report_analyses", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  fileName: text("file_name"),
  summary: text("summary").notNull(),
  findings: jsonb("findings").notNull().$type<ReportFinding[]>(),
  recommendations: jsonb("recommendations").notNull().$type<string[]>(),
  language: text("language").notNull().default("English"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReportFinding = {
  label: string;
  value: string;
  status: "normal" | "abnormal" | "borderline";
  explanation: string;
};

export const insertReportAnalysisSchema = createInsertSchema(reportAnalysesTable).omit({ id: true, createdAt: true });
export type InsertReportAnalysis = z.infer<typeof insertReportAnalysisSchema>;
export type ReportAnalysis = typeof reportAnalysesTable.$inferSelect;
