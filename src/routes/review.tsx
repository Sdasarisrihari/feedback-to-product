import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrdRead } from "@/components/voc/PrdView";
import { EmptyState, PageHeader, ReadyGate, SourceId } from "@/components/voc/shared";
import { CRITERIA, MIN_ITEMS_FOR_REPORT, SCALE, completeReview, reviewsToCsv, summarize, type HumanReview } from "@/lib/voc/human-eval";
import { useVoc } from "@/lib/voc/store";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Human Review · VoC Intelligence Agent" },
      { name: "description", content: "Score AI-generated PRDs and user stories for evidence support, correctness and usefulness." },
      { property: "og:title", content: "Human Review · VoC Intelligence Agent" },
      { property: "og:description", content: "Repeatable human evaluation of AI-generated PRDs and user stories." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><ReviewPage /></ReadyGate>,
});

type Item = { key: string; prdId: string; revNo: number; target: "prd" | "story"; storyId?: string; label: string };

function ReviewPage() {
  const { aiPrds, reviews = [], saveReview, deleteReview, cloud } = useVoc();
  const items = useMemo<Item[]>(() => aiPrds.flatMap((p) => {
    const revNo = p.revisions.length;
    const c = p.revisions[revNo - 1]!.content;
    return [
      { key: `${p.id}#${revNo}#`, prdId: p.id, revNo, target: "prd" as const, label: `PRD · ${c.title}` },
      ...c.stories.map((s) => ({ key: `${p.id}#${revNo}#${s.id}`, prdId: p.id, revNo, target: "story" as const, storyId: s.id, label: `Story ${s.id} · As a ${s.persona}, I want ${s.capability}` })),
    ];
  }), [aiPrds]);
  const [sel, setSel] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState("");
  const item = items.find((i) => i.key === sel) ?? null;
  const summary = summarize(reviews);
  const keyOf = (r: HumanReview) => `${r.prdId}#${r.revNo}#${r.storyId ?? ""}`;

  function exportCsv() {
    const url = URL.createObjectURL(new Blob([reviewsToCsv(reviews)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "human-reviews.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Human Review" description="Reviewers score AI-generated PRDs and user stories. Results below are computed only from completed reviews and are kept separate from automated model metrics."
        actions={<Button variant="outline" size="sm" onClick={exportCsv} disabled={!reviews.length}>Export CSV</Button>} />
      {cloud.mode === "local" && <p className="mb-4 text-sm text-muted-foreground">Demo mode: reviews are saved in this browser only. <Link to="/auth" className="text-primary underline">Sign in</Link> to keep them in your workspace.</p>}

      <Card className="mb-5"><CardHeader className="pb-2"><CardTitle className="text-base">Human evaluation results</CardTitle>
        <p className="text-xs text-muted-foreground">{summary.completed} completed review(s) of {summary.itemsReviewed} item(s) by {summary.reviewers} reviewer(s); {summary.inProgress} in progress. Target: at least {MIN_ITEMS_FOR_REPORT} reviewed items before reporting.</p></CardHeader>
        <CardContent>
          {summary.completed === 0 ? <p className="text-sm text-muted-foreground">No completed reviews yet — no human scores are reported.</p> : (
            <div className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
              {CRITERIA.map((c) => <div key={c.key}><div className="text-xs text-muted-foreground">{c.label}</div><div className="font-mono">{summary.mean[c.key]?.toFixed(2)} / 5</div><div className="text-xs text-muted-foreground">{Math.round((summary.acceptableRate[c.key] ?? 0) * 100)}% scored ≥ 4</div></div>)}
              <div><div className="text-xs text-muted-foreground">Unsupported claims</div><div className="font-mono">{summary.unsupportedClaimsTotal}</div><div className="text-xs text-muted-foreground">in {summary.reviewsWithUnsupported} review(s)</div></div>
              <div><div className="text-xs text-muted-foreground">Accepted</div><div className="font-mono">{Math.round((summary.acceptedRate ?? 0) * 100)}%</div><div className="text-xs text-muted-foreground">useful ≥4, evidence ≥4, 0 unsupported</div></div>
            </div>
          )}
          {summary.completed > 0 && summary.itemsReviewed < MIN_ITEMS_FOR_REPORT && <p className="mt-2 text-xs text-destructive">Below the {MIN_ITEMS_FOR_REPORT}-item minimum — treat as preliminary.</p>}
        </CardContent>
      </Card>

      {!items.length ? <EmptyState title="Nothing to review yet" body="Generate PRDs in PRD Studio first; each PRD and each of its user stories becomes a review item." action={<Link to="/prd"><Button size="sm">Open PRD Studio</Button></Link>} /> : (
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <Card><CardContent className="space-y-1 p-2">
            <Input placeholder="Your reviewer name" value={reviewer} onChange={(e) => setReviewer(e.target.value)} aria-label="Reviewer name" className="mb-2" />
            {items.map((i) => {
              const mine = reviews.find((r) => keyOf(r) === i.key && r.reviewer.trim().toLowerCase() === reviewer.trim().toLowerCase() && reviewer.trim());
              const doneCount = reviews.filter((r) => keyOf(r) === i.key && r.status === "completed").length;
              return (
                <button key={i.key} onClick={() => setSel(i.key)} className={`block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-muted ${sel === i.key ? "bg-muted" : ""}`}>
                  <div className="line-clamp-2">{i.label}</div>
                  <div className="mt-0.5 flex gap-1 text-xs text-muted-foreground"><SourceId id={`${i.prdId} r${i.revNo}`} />{mine && <Badge variant="outline">{mine.status === "completed" ? "you: done" : "you: draft"}</Badge>}{doneCount > 0 && <span>{doneCount} completed</span>}</div>
                </button>
              );
            })}
          </CardContent></Card>
          {item ? <ReviewForm key={`${item.key}|${reviewer}`} item={item} reviewer={reviewer} existing={reviews.find((r) => keyOf(r) === item.key && r.reviewer.trim().toLowerCase() === reviewer.trim().toLowerCase() && !!reviewer.trim())}
            onSave={(r) => { saveReview(r); }} onDelete={deleteReview} /> : <EmptyState title="Pick an item" body="Enter your name, then choose a PRD or user story to score." />}
        </div>
      )}
    </>
  );
}

function ReviewForm({ item, reviewer, existing, onSave, onDelete }: { item: Item; reviewer: string; existing: HumanReview | undefined; onSave: (r: HumanReview) => void; onDelete: (id: string) => void }) {
  const { aiPrds } = useVoc();
  const prd = aiPrds.find((p) => p.id === item.prdId)!;
  const content = prd.revisions[item.revNo - 1]!.content;
  const story = item.storyId ? content.stories.find((s) => s.id === item.storyId) : undefined;
  const [r, setR] = useState<HumanReview>(existing ?? { id: `HR-${Date.now().toString(36)}`, prdId: item.prdId, revNo: item.revNo, target: item.target, ...(item.storyId ? { storyId: item.storyId } : {}), reviewer, scores: {}, unsupportedClaims: null, notes: "", status: "in_progress", updatedAt: new Date().toISOString() });
  const locked = r.status === "completed";
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <Card><CardContent className="max-h-[75vh] overflow-auto p-4 text-sm">
        {story ? (
          <div className="space-y-2"><p className="font-medium">As a {story.persona}, I want {story.capability}, so that {story.outcome}.</p>
            <ul className="list-disc pl-5">{story.acceptanceCriteria.map((a, i) => <li key={i}>{a}</li>)}</ul>
            <div className="text-xs text-muted-foreground">Verified quotes: {story.verified.length ? story.verified.map((v) => `${v.id}: “${v.excerpt}”`).join(" · ") : "none"}</div></div>
        ) : <PrdRead c={content} />}
      </CardContent></Card>
      <Card><CardContent className="space-y-4 p-4">
        {!reviewer.trim() && <p className="text-sm text-destructive">Enter your reviewer name first.</p>}
        {CRITERIA.map((c) => (
          <fieldset key={c.key} disabled={locked}><legend className="text-sm font-medium">{c.label}</legend><p className="text-xs text-muted-foreground">{c.help}</p>
            <div className="mt-1 flex gap-1">{SCALE.map((n) => (
              <button key={n} type="button" aria-pressed={r.scores[c.key] === n} aria-label={`${c.label} ${n}`} onClick={() => setR({ ...r, scores: { ...r.scores, [c.key]: n } })}
                className={`h-8 w-8 rounded-md border text-sm ${r.scores[c.key] === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{n}</button>
            ))}</div></fieldset>
        ))}
        <label className="block text-sm font-medium">Unsupported claims (count)
          <Input type="number" min={0} step={1} disabled={locked} value={r.unsupportedClaims ?? ""} onChange={(e) => setR({ ...r, unsupportedClaims: e.target.value === "" ? null : Math.max(0, Math.floor(Number(e.target.value))) })} /></label>
        <label className="block text-sm font-medium">Notes<Textarea disabled={locked} value={r.notes} onChange={(e) => setR({ ...r, notes: e.target.value })} placeholder="Which claims were unsupported? What would you change?" /></label>
        <div className="flex flex-wrap gap-2">
          {!locked && <Button size="sm" variant="outline" disabled={!reviewer.trim()} onClick={() => { const x = { ...r, reviewer, updatedAt: new Date().toISOString() }; setR(x); onSave(x); toast.success("Draft saved"); }}>Save draft</Button>}
          {!locked && <Button size="sm" disabled={!reviewer.trim()} onClick={() => { const res = completeReview({ ...r, reviewer }, new Date().toISOString()); if (!res.ok) { toast.error(res.reason); return; } setR(res.review); onSave(res.review); toast.success("Review completed"); }}>Complete review</Button>}
          {locked && <Button size="sm" variant="outline" onClick={() => { const x = { ...r, status: "in_progress" as const, updatedAt: new Date().toISOString() }; delete x.completedAt; setR(x); onSave(x); }}>Reopen</Button>}
          {existing && <Button size="sm" variant="ghost" onClick={() => onDelete(r.id)}>Delete</Button>}
        </div>
      </CardContent></Card>
    </div>
  );
}
