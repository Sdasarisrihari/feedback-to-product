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

async function authorize<F extends { id: string; text: string }, D extends { id: string; text: string }>(feedback: F[], docs: D[]) {
  const { loadSavedSources } = await import("./caller.server");
  const { reconcileSources } = await import("./source-auth");
  const caller = await loadSavedSources(feedback.map((f) => f.id), docs.map((d) => d.id));
  if (caller.mode === "error") return { ok: false as const, code: "unauthorized", message: caller.message };
  if (caller.mode === "signed_out") return { ok: true as const, feedback, docs, provenance: "browser_supplied" as const, sourceRejections: [] };
  const f = reconcileSources(feedback, caller.saved.feedback, "feedback");
  const d = reconcileSources(docs, caller.saved.docs, "doc");
  return { ok: true as const, feedback: f.accepted, docs: d.accepted, provenance: "server_verified" as const, sourceRejections: [...f.rejected, ...d.rejected] };
}

function key() { return process.env["LOVABLE_API_KEY"]; }
const notConfigured = { ok: false as const, code: "not_configured", message: "No AI key is configured on the server." };

export const generatePrd = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => prdInput.parse(d))
  .handler(async ({ data }): Promise<PrdResult> => {
    if (data.feedback.length === 0) return { ok: false, code: "insufficient_evidence", message: "This theme has no verified customer evidence. Run the AI analysis or pick a theme with verified quotes." };
    const k = key(); if (!k) return notConfigured;
    const a = await authorize(data.feedback, data.docs);
    if (!a.ok) return a;
    if (!a.feedback.length) return { ok: false, code: "source_rejected", message: "None of this theme's evidence matches your saved workspace (unsaved, changed or removed). Wait for “All changes saved” or re-run the analysis." };
    const { runPrdGeneration } = await import("./llm.server");
    const res = await runPrdGeneration({ ...data, feedback: a.feedback, docs: a.docs }, k);
    return res.ok ? { ...res, provenance: a.provenance, sourceRejections: a.sourceRejections } : res;
  });

export const askQuestion = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => qaInput.parse(d))
  .handler(async ({ data }): Promise<QaResult> => {
    if (!data.feedback.length && !data.docs.length) return { ok: false, code: "insufficient_evidence", message: "No matching feedback or documentation was found for this question. Try different wording or import documents." };
    const k = key(); if (!k) return notConfigured;
    const a = await authorize(data.feedback, data.docs);
    if (!a.ok) return a;
    if (!a.feedback.length && !a.docs.length) return { ok: false, code: "source_rejected", message: "None of the retrieved sources match your saved workspace. Wait for “All changes saved”, then retry." };
    const { runQa } = await import("./llm.server");
    const res = await runQa({ ...data, feedback: a.feedback, docs: a.docs }, k);
    return res.ok ? { ...res, provenance: a.provenance, sourceRejections: a.sourceRejections } : res;
  });
