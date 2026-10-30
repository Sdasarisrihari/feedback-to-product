/** v2.1 evaluation-only fixtures. Never seeds or edits a user's workspace. */
import type { ProductDoc } from "../docs";
import { fromRows, toRows } from "../persist-map";
import { DEFAULT_WEIGHTS } from "../prioritize";
import type { QaAnswer, QaInput } from "../qa-schema";
import { search } from "../retrieval";
import { sampleDocs } from "../sample-docs";
import { CONFLICT_DOC_SECTIONS } from "./dataset";

export const CAPABILITY_FIXTURE_VERSION = "v2.1";
export const SCIM_SECTION_ID = "DOC-eval-identity-v1#s1";

export function conflictDocs(): ProductDoc[] {
  return CONFLICT_DOC_SECTIONS.map((s, i) => {
    const id = s.id.split("#")[0] ?? s.id;
    return {
      id, title: "Synthetic export policy (evaluation only)", version: i ? "4.0" : "3.0",
      kind: "help_doc", filename: `synthetic-export-${i}.md`, importedAt: "2026-10-30T00:00:00.000Z", warnings: [],
      sections: [{ id: s.id, docId: id, heading: "Custom-field exports", page: null, text: s.text, suspectedInjection: false }],
    };
  });
}

/** Exercise the actual persistence row mapping, not live storage or authorization. */
export function restoredFixtureDocs(docs: ProductDoc[]): ProductDoc[] {
  const rows = toRows({ records: [], imports: [], runs: [], weights: DEFAULT_WEIGHTS, effort: {}, docs, aiPrds: [], tasks: [], llm: null, browserImportDone: false });
  return fromRows(rows, { weights: DEFAULT_WEIGHTS }).docs;
}

export function capabilityInput(capability: string): QaInput {
  let docs = sampleDocs();
  if (capability === "SCIM provisioning") {
    const id = SCIM_SECTION_ID.split("#")[0] ?? SCIM_SECTION_ID;
    docs = [...docs, {
      id, title: "Synthetic identity policy (evaluation only)", version: "1", kind: "spec", filename: "synthetic-identity.md",
      importedAt: "2026-10-30T00:00:00.000Z", warnings: [],
      sections: [{ id: SCIM_SECTION_ID, docId: id, heading: "SCIM provisioning", page: null, text: "Trellis does not support SCIM provisioning. Automated SCIM user provisioning is not available.", suspectedInjection: false }],
    }];
  }
  if (capability.includes("conflicting doc versions")) docs = [...docs, ...conflictDocs()];
  const restored = restoredFixtureDocs(docs);
  return {
    question: `Does the documentation confirm that Trellis supports ${capability}?`, feedback: [],
    docs: search([], restored, capability, "docs", 6).map((h) => ({ id: h.id, title: h.label, text: h.text })),
  };
}

/** Transparent automated proxies, not a semantic or human correctness judgment. */
export function scoreConflict(answer: QaAnswer, input: QaInput) {
  const expected = CONFLICT_DOC_SECTIONS.map((s) => s.id);
  const citations = [...answer.claims.flatMap((c) => c.docs.verified), ...answer.capabilityVerdicts.flatMap((v) => v.docs.verified)];
  const rejected = [...answer.claims.flatMap((c) => c.docs.rejected), ...answer.capabilityVerdicts.flatMap((v) => v.docs.rejected)];
  const text = [answer.answer, ...answer.claims.map((c) => c.text)].join(" ");
  return {
    bothRetrieved: expected.every((id) => input.docs.some((d) => d.id === id)),
    bothCitedVerbatim: CONFLICT_DOC_SECTIONS.every((s) => citations.some((c) => c.id === s.id && s.text.includes(c.excerpt))),
    communicatesConflict: /conflict|contradict|disagree|inconsistent/i.test(text),
    uncertainVerdict: answer.capabilityVerdicts.length > 0 && answer.capabilityVerdicts.every((v) => v.claimed === "unknown" && v.status === "unverified"),
    asksClarification: answer.clarificationQuestions.some((q) => q.trim().length > 0),
    noRejectedCitations: rejected.length === 0,
  };
}