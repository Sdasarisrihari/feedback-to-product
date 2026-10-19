import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { groundLlmOutput, llmOutputSchema, type AnalysisInputRecord, type AnalysisResult } from "./llm-schema";
import { ANALYSIS_INSTRUCTIONS, PRD_INSTRUCTIONS, QA_INSTRUCTIONS, buildAnalysisPrompt, buildPrdPrompt, buildQaPrompt } from "./prompt";
import { groundPrd, prdOutputSchema, type PrdResult, type PrdSourceInput } from "./prd-schema";
import { groundAnswer, qaOutputSchema, type QaInput, type QaResult } from "./qa-schema";

export const ANALYSIS_MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

export function mapGatewayError(err: unknown): Extract<AnalysisResult, { ok: false }> {
  const e = err as { statusCode?: number; status?: number; message?: string; name?: string };
  const status = e?.statusCode ?? e?.status;
  if (status === 429) return { ok: false, code: "rate_limited", message: "The AI service is rate limited. Wait a minute and try again." };
  if (status === 402) return { ok: false, code: "credits", message: "AI credits are exhausted. Add credits in Settings → Plans & credits, then retry." };
  if (status === 401) return { ok: false, code: "not_configured", message: "The AI service key is missing or invalid on the server." };
  if (status === 403) return { ok: false, code: "denied", message: "The AI service denied this request (workspace limit or policy)." };
  if (e?.name?.includes("NoObjectGenerated") || e?.name?.includes("TypeValidation")) return { ok: false, code: "bad_output", message: "The model returned output that failed schema validation. Nothing was saved." };
  return { ok: false, code: "upstream", message: "The AI service is unavailable right now. The keyword baseline is still available." };
}

type Fail = Extract<AnalysisResult, { ok: false }>;

/** One structured, streamed model call. Returns a typed failure instead of throwing. */
export async function callStructured<T>(schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }, instructions: string, prompt: string, apiKey: string, effort: "low" | "medium" = "low"): Promise<{ ok: true; data: T } | Fail> {
  const provider = createOpenAI({ baseURL: GATEWAY, apiKey, headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" } });
  try {
    const result = streamText({
      model: provider.responses(ANALYSIS_MODEL),
      instructions,
      prompt,
      output: Output.object({ schema: schema as never }),
      maxRetries: 1,
      providerOptions: { openai: { forceReasoning: true, reasoningEffort: effort, reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] } },
    });
    const parsed = schema.safeParse(await result.output);
    if (!parsed.success) return { ok: false, code: "bad_output", message: "The model returned output that failed schema validation. Nothing was saved." };
    return { ok: true, data: parsed.data };
  } catch (err) {
    const e = err as { statusCode?: number; name?: string };
    console.error("[voc] model call failed", { status: e?.statusCode, name: e?.name });
    return mapGatewayError(err);
  }
}

export async function runLlmAnalysis(records: AnalysisInputRecord[], apiKey: string, truncated: boolean): Promise<AnalysisResult> {
  const t0 = Date.now();
  const r = await callStructured(llmOutputSchema, ANALYSIS_INSTRUCTIONS, buildAnalysisPrompt(records), apiKey);
  if (!r.ok) return r;
  return { ok: true, model: ANALYSIS_MODEL, durationMs: Date.now() - t0, inputCount: records.length, truncated, insights: groundLlmOutput(r.data, records), notes: r.data.notes };
}

export async function runPrdGeneration(input: PrdSourceInput, apiKey: string): Promise<PrdResult> {
  const t0 = Date.now();
  const r = await callStructured(prdOutputSchema, PRD_INSTRUCTIONS, buildPrdPrompt(input), apiKey, "medium");
  if (!r.ok) return r;
  const { content, report } = groundPrd(r.data, input);
  return { ok: true, model: ANALYSIS_MODEL, durationMs: Date.now() - t0, content, report };
}

export async function runQa(input: QaInput, apiKey: string): Promise<QaResult> {
  const t0 = Date.now();
  const r = await callStructured(qaOutputSchema, QA_INSTRUCTIONS, buildQaPrompt(input), apiKey);
  if (!r.ok) return r;
  return { ok: true, model: ANALYSIS_MODEL, durationMs: Date.now() - t0, result: groundAnswer(r.data, input) };
}
