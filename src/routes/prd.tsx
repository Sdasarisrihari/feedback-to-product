import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, ReadyGate, SourceId , ProvenanceNote } from "@/components/voc/shared";
import { AiTag, PrdEdit, PrdRead } from "@/components/voc/PrdView";
import { latest } from "@/lib/voc/drafts";
import { scoreOpportunities } from "@/lib/voc/prioritize";
import { useVoc, type LlmStatus } from "@/lib/voc/store";

export const Route = createFileRoute("/prd")({
  head: () => ({
    meta: [
      { title: "PRD Studio · VoC Intelligence Agent" },
      { name: "description", content: "AI-drafted PRDs and user stories with verified customer evidence and documentation checks." },
      { property: "og:title", content: "PRD Studio · VoC Intelligence Agent" },
      { property: "og:description", content: "AI-drafted PRDs and user stories with verified customer evidence and documentation checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Studio /></ReadyGate>,
});

function StatusLine({ s }: { s: LlmStatus | undefined }) {
  if (s?.state === "running") return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Drafting with the AI model and verifying every citation… this can take a minute.</p>;
  if (s?.state === "error") return <p role="alert" className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4" />{s.message}</p>;
  return null;
}

function Studio() {
  const { insights, analysisSource, weights, effort, aiPrds, prdStatus, generatePrdFor, savePrdEdit, setPrdReview, sendPrdToTasks } = useVoc();
  const ranked = scoreOpportunities(insights, weights, effort);
  const [themeId, setThemeId] = useState(ranked[0]?.insight.themeId ?? "");
  const [selected, setSelected] = useState<string | null>(aiPrds[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const insight = insights.find((i) => i.themeId === themeId);
  const prd = aiPrds.find((p) => p.id === selected) ?? null;
  const accepted = aiPrds.filter((p) => p.review === "accepted").length;
  const reviewed = aiPrds.filter((p) => p.review !== "draft").length;

  async function gen() {
    if (!insight) return;
    const id = await generatePrdFor(insight);
    if (id) { setSelected(id); setEditing(false); toast.success("PRD drafted"); }
  }

  return (
    <>
      <PageHeader title="PRD Studio" description="AI drafts PRDs and user stories from analysed themes. Every customer quote and documentation claim is verified against its source before it is shown as evidence." />

      <Card className="mb-6"><CardContent className="space-y-3 pt-5">
        {analysisSource !== "llm" ? (
          <EmptyState title="Run the AI analysis first" body="PRDs are drafted only from AI-analysed themes whose quotes have been verified. The keyword baseline is not used as PRD evidence." action={<Button asChild><Link to="/insights">Go to Insights</Link></Button>} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={themeId} onValueChange={setThemeId}><SelectTrigger className="w-96 max-w-full" aria-label="Theme"><SelectValue placeholder="Choose a theme" /></SelectTrigger>
                <SelectContent>{ranked.map((r, i) => <SelectItem key={r.insight.themeId} value={r.insight.themeId}>#{i + 1} {r.insight.name} ({r.insight.frequency} verified)</SelectItem>)}</SelectContent></Select>
              <Button onClick={gen} disabled={!insight || prdStatus[themeId]?.state === "running"}><Sparkles className="mr-1 h-4 w-4" />Generate PRD</Button>
            </div>
            {insight && insight.frequency < 3 && <p className="text-sm text-mock-foreground">Thin evidence: only {insight.frequency} verified record(s). The draft will list what needs validation.</p>}
            <StatusLine s={prdStatus[themeId]} />
          </>
        )}
      </CardContent></Card>

      {!aiPrds.length ? <EmptyState title="No PRDs yet" body="Choose an analysed theme above and generate a draft." /> : (
        <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Human review: {accepted} accepted of {reviewed} reviewed ({aiPrds.length} total)</p>
            {aiPrds.map((p) => {
              const r = latest(p);
              return (
                <button key={p.id} onClick={() => { setSelected(p.id); setEditing(false); }} className={`w-full rounded-md border p-3 text-left text-sm transition-colors hover:bg-muted ${selected === p.id ? "border-primary bg-card" : "bg-card"}`}>
                  <div className="font-medium">{r.content.title}</div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground"><span>{p.review.replace("_", " ")}</span>·<span>rev {p.revisions.length}</span>{r.report && <>·<span>{r.report.verified}/{r.report.citations} cites verified</span></>}</div>
                </button>
              );
            })}
          </div>

          {prd && (() => {
            const rev = latest(prd);
            const theme = insights.find((i) => i.themeId === prd.themeId);
            return (
              <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
                <Card><CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2"><SourceId id={prd.id} /><AiTag /><Badge variant="secondary">{prd.review.replace("_", " ")}</Badge>{rev.by === "human" && <Badge variant="outline">edited by human</Badge>}</div>
                  <CardTitle className="mt-2 text-xl">{rev.content.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">Theme: {prd.themeName} · {prd.model} · revision {prd.revisions.length} · {new Date(rev.at).toLocaleString()}</p>
                  {rev.by === "ai" && rev.report && <ProvenanceNote provenance={rev.report.provenance} rejections={rev.report.sourceRejections} />}
                  {rev.report && rev.report.downgrades.length > 0 && (
                    <details className="mt-2 rounded-md bg-destructive/5 p-2 text-xs text-destructive"><summary className="cursor-pointer">{rev.report.downgrades.length} item(s) downgraded by citation checks</summary><ul className="mt-1 list-disc pl-5">{rev.report.downgrades.map((d, i) => <li key={i}>{d}</li>)}</ul></details>
                  )}
                  <div className="flex flex-wrap gap-2 pt-3">
                    {!editing && <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>}
                    <Button size="sm" variant="outline" disabled={!theme || prdStatus[prd.id]?.state === "running"} onClick={async () => { if (theme && (await generatePrdFor(theme, prd.id))) toast.success("New AI revision added"); }}>Regenerate</Button>
                    <Button size="sm" onClick={() => setPrdReview(prd.id, "accepted")} disabled={prd.review === "accepted"}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => setPrdReview(prd.id, "needs_changes")}>Needs changes</Button>
                    <Button size="sm" variant="secondary" onClick={() => toast.success(`${sendPrdToTasks(prd.id)} draft task(s) sent for review`)}>Send stories to Task Review</Button>
                  </div>
                  {!theme && <p className="text-xs text-muted-foreground">Regenerate unavailable: this theme is not in the current analysis.</p>}
                  <StatusLine s={prdStatus[prd.id]} />
                </CardHeader>
                  <CardContent>{editing ? <PrdEdit c={rev.content} onCancel={() => setEditing(false)} onSave={(c) => { savePrdEdit(prd.id, c); setEditing(false); toast.success("Saved as new revision"); }} /> : <PrdRead c={rev.content} />}</CardContent>
                </Card>
                <Card className="h-fit xl:sticky xl:top-6"><CardHeader><CardTitle className="text-base">Sources given to the model</CardTitle></CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div><div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Customer feedback ({prd.sources.feedback.length})</div>
                      <ul className="space-y-2">{prd.sources.feedback.map((f) => <li key={f.id}><SourceId id={f.id} /> <span className="text-muted-foreground">{f.segment}</span><p className="mt-0.5">{f.text}</p></li>)}</ul></div>
                    <div><div className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">Product documentation ({prd.sources.docs.length})</div>
                      {prd.sources.docs.length ? <ul className="space-y-2">{prd.sources.docs.map((d) => <li key={d.id}><SourceId id={d.id} /><div className="text-muted-foreground">{d.title}</div><p className="mt-0.5 line-clamp-4">{d.text}</p></li>)}</ul> : <p className="text-muted-foreground">No matching documentation — capability claims will be unverified.</p>}</div>
                  </CardContent></Card>
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}
