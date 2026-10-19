/**
 * Human evaluation of generated PRDs and user stories. Stores reviewer judgments only;
 * summaries are computed exclusively from completed reviews and never mixed with model metrics.
 */
export const CRITERIA = [
  { key: "evidenceSupport", label: "Evidence support", help: "Are claims backed by the cited customer quotes / doc sections?" },
  { key: "requirementCorrectness", label: "Requirement correctness", help: "Do the requirements correctly address the evidenced problem?" },
  { key: "acceptanceQuality", label: "Acceptance-criteria quality", help: "Are criteria specific, testable and complete?" },
  { key: "usefulness", label: "Usefulness", help: "Would a PM use this as a starting draft?" },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];
export const SCALE = [1, 2, 3, 4, 5] as const; // 1 = poor, 3 = acceptable, 5 = excellent

export interface HumanReview {
  id: string;
  prdId: string;
  revNo: number; // the exact revision that was reviewed
  target: "prd" | "story";
  storyId?: string;
  reviewer: string;
  scores: Partial<Record<CriterionKey, number>>;
  unsupportedClaims: number | null; // count of claims the reviewer found unsupported
  notes: string;
  status: "in_progress" | "completed";
  updatedAt: string;
  completedAt?: string;
}

export function isComplete(r: Pick<HumanReview, "reviewer" | "scores" | "unsupportedClaims">): boolean {
  return r.reviewer.trim().length > 0 && r.unsupportedClaims !== null && r.unsupportedClaims >= 0
    && CRITERIA.every((c) => SCALE.includes(r.scores[c.key] as 1));
}

/** Marks a review completed only if every field is filled; otherwise returns a reason. */
export function completeReview(r: HumanReview, at: string): { ok: true; review: HumanReview } | { ok: false; reason: string } {
  if (!r.reviewer.trim()) return { ok: false, reason: "Enter a reviewer name." };
  const missing = CRITERIA.filter((c) => !SCALE.includes(r.scores[c.key] as 1)).map((c) => c.label);
  if (missing.length) return { ok: false, reason: `Score every criterion: ${missing.join(", ")}.` };
  if (r.unsupportedClaims === null || r.unsupportedClaims < 0 || !Number.isInteger(r.unsupportedClaims)) return { ok: false, reason: "Enter the number of unsupported claims (0 if none)." };
  return { ok: true, review: { ...r, status: "completed", completedAt: at, updatedAt: at } };
}

export interface HumanSummary {
  completed: number;
  inProgress: number;
  itemsReviewed: number; // distinct prd/story revisions with ≥1 completed review
  reviewers: number;
  mean: Record<CriterionKey, number | null>;
  acceptableRate: Record<CriterionKey, number | null>; // share of scores ≥ 4
  unsupportedClaimsTotal: number;
  reviewsWithUnsupported: number;
  acceptedRate: number | null; // usefulness ≥ 4 AND evidence ≥ 4 AND 0 unsupported claims
}

export function summarize(reviews: HumanReview[]): HumanSummary {
  const done = reviews.filter((r) => r.status === "completed" && isComplete(r));
  const mean = {} as HumanSummary["mean"];
  const acceptableRate = {} as HumanSummary["acceptableRate"];
  for (const c of CRITERIA) {
    const xs = done.map((r) => r.scores[c.key]!);
    mean[c.key] = xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;
    acceptableRate[c.key] = xs.length ? xs.filter((x) => x >= 4).length / xs.length : null;
  }
  const accepted = done.filter((r) => r.scores.usefulness! >= 4 && r.scores.evidenceSupport! >= 4 && r.unsupportedClaims === 0).length;
  return {
    completed: done.length,
    inProgress: reviews.filter((r) => r.status !== "completed").length,
    itemsReviewed: new Set(done.map((r) => `${r.prdId}#${r.revNo}#${r.storyId ?? ""}`)).size,
    reviewers: new Set(done.map((r) => r.reviewer.trim().toLowerCase())).size,
    mean, acceptableRate,
    unsupportedClaimsTotal: done.reduce((a, r) => a + (r.unsupportedClaims ?? 0), 0),
    reviewsWithUnsupported: done.filter((r) => (r.unsupportedClaims ?? 0) > 0).length,
    acceptedRate: done.length ? accepted / done.length : null,
  };
}

export const MIN_ITEMS_FOR_REPORT = 10;

export function reviewsToCsv(reviews: HumanReview[]): string {
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const head = ["review_id", "prd_id", "rev_no", "target", "story_id", "reviewer", ...CRITERIA.map((c) => c.key), "unsupported_claims", "status", "completed_at", "notes"];
  const rows = reviews.map((r) => [r.id, r.prdId, r.revNo, r.target, r.storyId ?? "", r.reviewer, ...CRITERIA.map((c) => r.scores[c.key] ?? ""), r.unsupportedClaims ?? "", r.status, r.completedAt ?? "", r.notes].map(esc).join(","));
  return [head.join(","), ...rows].join("\n");
}
