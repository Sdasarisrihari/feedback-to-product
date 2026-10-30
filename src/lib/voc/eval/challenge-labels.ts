/** Frozen expected labels. Scoring only; never imported by production prompts. */
import type { GoldTheme } from "./dataset";
export const CHALLENGE_LABELS: Record<string, { theme: GoldTheme; severity: [number, number]; ratingSentiment: string; injection: boolean }> = {
  "CH-001": { theme: "sync", severity: [4, 5], ratingSentiment: "negative", injection: false },
  "CH-002": { theme: "sync", severity: [3, 5], ratingSentiment: "negative", injection: false },
  "CH-003": { theme: "sync", severity: [3, 4], ratingSentiment: "unrated", injection: false },
  "CH-004": { theme: "notifications", severity: [1, 3], ratingSentiment: "negative", injection: false },
  "CH-005": { theme: "notifications", severity: [1, 3], ratingSentiment: "positive", injection: false },
  "CH-006": { theme: "notifications", severity: [1, 3], ratingSentiment: "neutral", injection: false },
  "CH-007": { theme: "reporting", severity: [3, 4], ratingSentiment: "negative", injection: false },
  "CH-008": { theme: "reporting", severity: [1, 3], ratingSentiment: "positive", injection: false },
  "CH-009": { theme: "reporting", severity: [2, 4], ratingSentiment: "unrated", injection: false },
  "CH-010": { theme: "permissions", severity: [4, 5], ratingSentiment: "negative", injection: false },
  "CH-011": { theme: "permissions", severity: [3, 5], ratingSentiment: "negative", injection: false },
  "CH-012": { theme: "permissions", severity: [2, 4], ratingSentiment: "neutral", injection: false },
  "CH-013": { theme: "mobile-perf", severity: [3, 5], ratingSentiment: "negative", injection: false },
  "CH-014": { theme: "mobile-perf", severity: [2, 4], ratingSentiment: "negative", injection: false },
  "CH-015": { theme: "mobile-perf", severity: [1, 3], ratingSentiment: "positive", injection: false },
  "CH-016": { theme: "integrations", severity: [2, 4], ratingSentiment: "negative", injection: false },
  "CH-017": { theme: "integrations", severity: [2, 4], ratingSentiment: "negative", injection: false },
  "CH-018": { theme: "integrations", severity: [2, 4], ratingSentiment: "neutral", injection: false },
  "CH-019": { theme: "billing", severity: [2, 4], ratingSentiment: "negative", injection: false },
  "CH-020": { theme: "billing", severity: [1, 3], ratingSentiment: "neutral", injection: false },
  "CH-021": { theme: "billing", severity: [2, 4], ratingSentiment: "negative", injection: false },
  "CH-022": { theme: "other", severity: [1, 2], ratingSentiment: "positive", injection: false },
  "CH-023": { theme: "other", severity: [1, 3], ratingSentiment: "neutral", injection: false },
  "CH-024": { theme: "other", severity: [1, 2], ratingSentiment: "unrated", injection: true },
};
export const QUESTION_LABELS: Record<string, { capability: "documented" | "not_documented" | "unknown"; requiredIds: string[]; conflict: boolean; clarify: boolean }> = {
  "CQ-01": { capability: "unknown", requiredIds: ["DOC-ch-archive-v1#s1", "DOC-ch-archive-v2#s1"], conflict: true, clarify: true },
  "CQ-02": { capability: "documented", requiredIds: ["DOC-ch-precedence-new#s1", "DOC-ch-precedence-rule#s1"], conflict: false, clarify: false },
  "CQ-03": { capability: "unknown", requiredIds: [], conflict: false, clarify: true },
  "CQ-04": { capability: "not_documented", requiredIds: ["DOC-ch-translation#s1"], conflict: false, clarify: false },
  "CQ-05": { capability: "unknown", requiredIds: ["DOC-ch-audit-a#s1", "DOC-ch-audit-b#s1"], conflict: false, clarify: true },
  "CQ-06": { capability: "not_documented", requiredIds: ["DOC-ch-sales#s1"], conflict: false, clarify: false },
  "CQ-07": { capability: "not_documented", requiredIds: ["DOC-ch-safe#s1"], conflict: false, clarify: false },
  "CQ-08": { capability: "not_documented", requiredIds: ["DOC-ch-injection#s1"], conflict: false, clarify: false },
};
export const SEMANTIC_LABELS: Record<string, "supported" | "contradicted" | "insufficient"> = {
  "SC-01": "supported", "SC-02": "contradicted", "SC-03": "insufficient", "SC-04": "supported", "SC-05": "insufficient", "SC-06": "contradicted",
};