/**
 * Source authority: before any model call by a signed-in user, the sources the browser sent are
 * replaced by the saved, owner-scoped copies. Anything not found (unknown, another user's, not yet
 * saved) or whose text differs from the saved copy (stale/tampered) is rejected and never reaches
 * the model or the citation verifier.
 */
export interface SubmittedSource { id: string; text: string }
export type RejectReason = "unknown_or_not_owned" | "text_mismatch";
export interface SourceRejection { id: string; kind: "feedback" | "doc"; reason: RejectReason }
export type Provenance = "server_verified" | "browser_supplied";

export function reconcileSources<T extends SubmittedSource>(
  submitted: T[], saved: Map<string, string>, kind: "feedback" | "doc",
): { accepted: T[]; rejected: SourceRejection[] } {
  const accepted: T[] = [];
  const rejected: SourceRejection[] = [];
  for (const s of submitted) {
    const text = saved.get(s.id);
    if (text === undefined) { rejected.push({ id: s.id, kind, reason: "unknown_or_not_owned" }); continue; }
    // Analysis input may be truncated client-side; compare on the submitted length only when it is a prefix cut.
    if (text !== s.text) { rejected.push({ id: s.id, kind, reason: "text_mismatch" }); continue; }
    accepted.push({ ...s, text }); // authoritative text from the database
  }
  return { accepted, rejected };
}

export const REJECT_LABEL: Record<RejectReason, string> = {
  unknown_or_not_owned: "not found in your saved workspace",
  text_mismatch: "text differs from the saved copy (stale or modified)",
};
