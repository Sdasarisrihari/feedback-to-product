import { createOpenAI } from "@ai-sdk/openai";
import { Output, streamText } from "ai";
import { groundLlmOutput, llmOutputSchema, type AnalysisInputRecord, type AnalysisResult } from "./llm-schema";
import { ANALYSIS_INSTRUCTIONS, buildAnalysisPrompt } from "./prompt";

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

export async function runLlmAnalysis(records: AnalysisInputRecord[], apiKey: string, truncated: boolean): Promise<AnalysisResult> {
  const t0 = Date.now();
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  try {
    const result = streamText({
      model: provider.responses(ANALYSIS_MODEL),
      instructions: ANALYSIS_INSTRUCTIONS,
      prompt: buildAnalysisPrompt(records),
      output: Output.object({ schema: llmOutputSchema }),
      maxRetries: 1,
      providerOptions: {
        openai: { forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", store: false, include: ["reasoning.encrypted_content"] },
      },
    });
    const out = await result.output;
    const parsed = llmOutputSchema.safeParse(out);
    if (!parsed.success) return { ok: false, code: "bad_output", message: "The model returned output that failed schema validation. Nothing was saved." };
    return { ok: true, model: ANALYSIS_MODEL, durationMs: Date.now() - t0, inputCount: records.length, truncated, insights: groundLlmOutput(parsed.data, records), notes: parsed.data.notes };
  } catch (err) {
    // Log status/name only — never prompt contents or keys.
    const e = err as { statusCode?: number; name?: string };
    console.error("[voc] LLM analysis failed", { status: e?.statusCode, name: e?.name });
    return mapGatewayError(err);
  }
}
