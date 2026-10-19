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
    const { loadSavedSources } = await import("./caller.server");
    const { reconcileSources } = await import("./source-auth");
    const caller = await loadSavedSources(data.records.map((r) => r.id), []);
    if (caller.mode === "error") return { ok: false, code: "unauthorized", message: caller.message };
    let input = data.records;
    let sourceRejections: ReturnType<typeof reconcileSources>["rejected"] = [];
    if (caller.mode === "signed_in") {
      const rec = reconcileSources(data.records, caller.saved.feedback, "feedback");
      input = rec.accepted; sourceRejections = rec.rejected;
      if (!input.length) return { ok: false, code: "source_rejected", message: "None of the submitted feedback matches your saved workspace. Wait for “All changes saved”, then retry." };
    }
    const provenance = caller.mode === "signed_in" ? "server_verified" as const : "browser_supplied" as const;
    const truncated = input.length > MAX_RECORDS;
    const records = input.slice(0, MAX_RECORDS).map((r) => ({ ...r, text: r.text.slice(0, MAX_TEXT) }));
    const { runLlmAnalysis } = await import("./llm.server");
    const res = await runLlmAnalysis(records, apiKey, truncated);
    return res.ok ? { ...res, provenance, sourceRejections } : res;
  });

export const getModelStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { ANALYSIS_MODEL } = await import("./llm.server");
  return { configured: Boolean(process.env["LOVABLE_API_KEY"]), model: ANALYSIS_MODEL };
});
