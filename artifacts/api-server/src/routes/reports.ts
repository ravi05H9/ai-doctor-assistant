import { Router, type IRouter } from "express";
import { db, reportAnalysesTable } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import {
  AnalyzeReportBody,
  GetReportParams,
  DeleteReportParams,
  ListReportsResponse,
  GetReportResponse,
} from "@workspace/api-zod";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set.");
  return new OpenAI({ apiKey: key });
}

const router: IRouter = Router();

const ANALYSIS_PROMPT = (reportType: string, language: string) => `
You are a medical AI assistant. Analyze the provided medical report image and return a structured JSON response.

Report type: ${reportType.replace("_", " ")}
Response language: ${language}

Return ONLY valid JSON with this exact structure:
{
  "summary": "A clear, compassionate 2-3 sentence plain-language summary of the report",
  "findings": [
    {
      "label": "Test/metric name",
      "value": "The measured value with unit",
      "status": "normal" | "abnormal" | "borderline",
      "explanation": "Plain-language explanation of what this means for the patient"
    }
  ],
  "recommendations": [
    "Actionable recommendation 1",
    "Actionable recommendation 2"
  ]
}

Rules:
- Use plain, non-technical language a patient can understand
- Be compassionate and not alarmist
- Always recommend consulting a doctor for diagnosis
- For X-rays, describe visible findings rather than numerical values
- For prescriptions, list medications and their purpose
- Include 3-8 findings and 2-5 recommendations
`;

router.get("/reports", async (_req, res): Promise<void> => {
  const reports = await db
    .select()
    .from(reportAnalysesTable)
    .orderBy(desc(reportAnalysesTable.createdAt));
  res.json(ListReportsResponse.parse(reports));
});

router.post("/reports", async (req, res): Promise<void> => {
  const parsed = AnalyzeReportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, reportType, fileName, language = "English" } = parsed.data;

  const imageUrl = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  let aiResult: {
    summary: string;
    findings: Array<{ label: string; value: string; status: "normal" | "abnormal" | "borderline"; explanation: string }>;
    recommendations: string[];
  };

  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ANALYSIS_PROMPT(reportType, language),
            },
            {
              type: "image_url",
              image_url: { url: imageUrl, detail: "high" },
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    aiResult = JSON.parse(jsonMatch[0]);
  } catch (err) {
    res.status(502).json({ error: "AI analysis failed. Please try again." });
    return;
  }

  const [report] = await db
    .insert(reportAnalysesTable)
    .values({
      reportType,
      fileName: fileName ?? null,
      summary: aiResult.summary,
      findings: aiResult.findings,
      recommendations: aiResult.recommendations,
      language,
    })
    .returning();

  res.status(201).json(GetReportResponse.parse(report));
});

router.get("/reports/:id", async (req, res): Promise<void> => {
  const params = GetReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [report] = await db
    .select()
    .from(reportAnalysesTable)
    .where(eq(reportAnalysesTable.id, params.data.id));

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json(GetReportResponse.parse(report));
});

router.delete("/reports/:id", async (req, res): Promise<void> => {
  const params = DeleteReportParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(reportAnalysesTable)
    .where(eq(reportAnalysesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.status(204).send();
});

export default router;
