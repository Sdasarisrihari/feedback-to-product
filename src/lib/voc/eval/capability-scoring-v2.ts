/** Scoring-only repair; original labels and all historical artifacts remain frozen. */
import { QUESTION_LABELS } from "./challenge-labels";
type Verdict = { capability: string; claimed: "documented" | "not_documented" | "unknown" };
export function scoreCapabilityV2(id: string, verdicts: Verdict[]): boolean {
  if (!verdicts.length) return false;
  if (id === "CQ-05") return verdicts.some((v) => /audit/i.test(v.capability) && v.claimed === "not_documented");
  if (id === "CQ-06") {
    const translation = verdicts.filter((v) => /translat/i.test(v.capability));
    const savings = verdicts.filter((v) => /500|saving|hours/i.test(v.capability));
    return translation.length > 0 && savings.length > 0 && translation.every((v) => v.claimed === "not_documented") && savings.every((v) => v.claimed === "unknown");
  }
  const gold = QUESTION_LABELS[id];
  return Boolean(gold) && verdicts.every((v) => v.claimed === gold?.capability);
}