import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge, EmptyState, InjectionBadge, PageHeader, ReadyGate, SourceId } from "@/components/voc/shared";
import { useVoc } from "@/lib/voc/store";
import { AnalysisBar } from "@/components/voc/AnalysisBar";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights · VoC Intelligence Agent" },
      { name: "description", content: "Themes with verbatim supporting quotes, source references, frequency and sentiment." },
      { property: "og:title", content: "Insights · VoC Intelligence Agent" },
      { property: "og:description", content: "Themes with verbatim supporting quotes, source references, frequency and sentiment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Insights /></ReadyGate>,
});

function Insights() {
  const { insights, records } = useVoc();
  const byId = new Map(records.map((r) => [r.id, r]));
  if (!insights.length) return <><PageHeader title="Insights" description="Evidence-backed themes." /><EmptyState title="No themes found" body="Import feedback first. Themes appear once records match at least one seed theme." /></>;
  return (
    <>
      <PageHeader title="Insights" description="Each theme lists the exact records that support it. Quotes are verbatim excerpts — click through to the Feedback Explorer to see the full record." />
      <AnalysisBar />
      <div className="space-y-5">
        {[...insights].sort((a, b) => b.frequency - a.frequency).map((i) => (
          <Card key={i.themeId} id={i.themeId} className="scroll-mt-6">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{i.name}</CardTitle>
                <Badge variant="secondary">{i.kind === "pain_point" ? "Pain point" : "Feature request"}</Badge>
                <Badge variant="outline">{i.productArea}</Badge>
                <ConfidenceBadge level={i.confidence} />
              </div>
              <p className="text-xs text-muted-foreground">{i.confidenceReason}</p>
              {i.summary && <p className="mt-2 text-sm"><Badge variant="outline" className="mr-2 border-primary/40 text-primary">AI suggestion</Badge>{i.summary}</p>}
            </CardHeader>
            <CardContent>
              <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div><div className="text-xs text-muted-foreground">Frequency</div><div className="font-mono">{i.frequency} records</div></div>
                <div><div className="text-xs text-muted-foreground">Sentiment −/○/+</div><div className="font-mono">{i.sentiment.negative}/{i.sentiment.neutral}/{i.sentiment.positive} <span className="text-muted-foreground">({i.sentiment.unrated} unrated)</span></div></div>
                <div><div className="text-xs text-muted-foreground">Severity (heuristic)</div><div className="font-mono">{i.severity}/5</div></div>
                <div><div className="text-xs text-muted-foreground">Enterprise share</div><div className="font-mono">{Math.round(i.enterpriseShare * 100)}%</div></div>
              </div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{i.origin === "llm" ? "Verified evidence (cited by model, checked verbatim)" : "Supporting evidence (BM25 rank)"}</h4>
              <ul className="space-y-2">
                {i.evidence.slice(0, 5).map((e) => {
                  const r = byId.get(e.id);
                  return (
                    <li key={e.id} className="border-l-2 border-primary/40 pl-3 text-sm">
                      <blockquote>"{e.excerpt}"</blockquote>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <SourceId id={e.id} /> {r?.source} · {r?.segment} · {i.origin === "llm" ? <span className="text-positive">verified</span> : `score ${e.score}`}
                        {r?.suspectedInjection && <InjectionBadge />}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {i.evidence.length > 5 && <p className="mt-2 text-xs text-muted-foreground">+{i.evidence.length - 5} more: {i.evidence.slice(5).map((e) => e.id).join(", ")}</p>}
              {!!i.related?.length && (
                <details className="mt-4 text-sm"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-muted-foreground">Related records found by BM25 — not cited, not counted ({i.related.length})</summary>
                  <ul className="mt-2 space-y-1">{i.related.map((e) => <li key={e.id} className="text-muted-foreground"><SourceId id={e.id} /> "{e.excerpt}"</li>)}</ul></details>
              )}
              {!!i.rejectedCitations?.length && (
                <details className="mt-3 text-sm"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-destructive">Rejected model citations ({i.rejectedCitations.length})</summary>
                  <ul className="mt-2 space-y-1">{i.rejectedCitations.map((c, k) => <li key={k} className="text-muted-foreground"><SourceId id={c.id} /> <s>"{c.quote}"</s> — {c.reason}</li>)}</ul></details>
              )}
              {!!i.openQuestions?.length && (
                <div className="mt-3 text-sm"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open questions (AI suggestion)</div><ul className="mt-1 list-disc pl-5">{i.openQuestions.map((q) => <li key={q}>{q}</li>)}</ul></div>
              )}
              <details className="mt-4 text-xs text-muted-foreground"><summary className="cursor-pointer">Assumptions behind this insight</summary><ul className="mt-2 list-disc pl-5">{i.assumptions.map((a) => <li key={a}>{a}</li>)}</ul></details>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
