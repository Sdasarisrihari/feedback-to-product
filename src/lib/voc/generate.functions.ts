import { createServerFn } from "@tanstack/react-start";
import { z } from "zod/v4";
import type { PrdResult } from "./prd-schema";
import type { QaResult } from "./qa-schema";

const src = z.object({ id: z.string().min(1).max(160), text: z.string().min(1).max(4000) });
const prdInput = z.object({
  theme: z.object({ name: z.string().max(300), summary: z.string().max(2000), productArea: z.string().max(200), kind: z.string().max(40) }),
  feedback: z.array(src.extend({ segment: z.string().max(40), source: z.string().max(40) })).max(30),
  docs: z.array(src.extend({ title: z.string().max(300) })).max(12),
});
const qaInput = z.object({ question: z.string().min(3).max(500), feedback: z.array(src).max(12), docs: z.array(src.extend({ title: z.string().max(300) })).max(12) });

function key() { return process.env["LOVABLE_API_KEY"]; }
const notConfigured = { ok: false as const, code: "not_configured", message: "No AI key is configured on the server." };

export const generatePrd = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => prdInput.parse(d))
  .handler(async ({ data }): Promise<PrdResult> => {
    if (data.feedback.length === 0) return { ok: false, code: "insufficient_evidence", message: "This theme has no verified customer evidence. Run the AI analysis or pick a theme with verified quotes." };
    const k = key(); if (!k) return notConfigured;
    const { runPrdGeneration } = await import("./llm.server");
    return runPrdGeneration(data, k);
  });

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => qaInput.parse(d))
  .handler(async ({ data }): Promise<QaResult> => {
    if (!data.feedback.length && !data.docs.length) return { ok: false, code: "insufficient_evidence", message: "No matching feedback or documentation was found for this question. Try different wording or import documents." };
    const k = key(); if (!k) return notConfigured;
    const { runQa } = await import("./llm.server");
    return runQa(data, k);
  });
