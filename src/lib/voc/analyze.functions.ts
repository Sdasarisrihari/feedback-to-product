import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import { MAX_RECORDS, MAX_TEXT, type AnalysisResult } from "./llm-schema";

const inputSchema = z.object({
  records: z.array(z.object({
    id: z.string().min(1).max(120),
    text: z.string().min(1),
    source: z.string().max(40),
    segment: z.string().max(40),
    rating: z.number().int().min(1).max(5).nullable(),
  })).max(2000),
});

export const analyzeWithLlm = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => inputSchema.parse(d))
  .handler(async ({ data }): Promise<AnalysisResult> => {
    if (!data.records.length) return { ok: false, code: "invalid_input", message: "There is no feedback to analyse. Import records first." };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, code: "not_configured", message: "No AI key is configured on the server. Enable the AI service, then retry." };
    const truncated = data.records.length > MAX_RECORDS;
    const records = data.records.slice(0, MAX_RECORDS).map((r) => ({ ...r, text: r.text.slice(0, MAX_TEXT) }));
    const { runLlmAnalysis } = await import("./llm.server");
    return runLlmAnalysis(records, apiKey, truncated);
  });

export const getModelStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { ANALYSIS_MODEL } = await import("./llm.server");
  return { configured: Boolean(process.env["LOVABLE_API_KEY"]), model: ANALYSIS_MODEL };
});
