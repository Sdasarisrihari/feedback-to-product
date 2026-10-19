import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ConfidenceBadge, EmptyState, MockNotice, PageHeader, ReadyGate } from "@/components/voc/shared";
import { DEFAULT_WEIGHTS, scoreOpportunities } from "@/lib/voc/prioritize";
import { useVoc } from "@/lib/voc/store";
import type { Weights } from "@/lib/voc/types";

export const Route = createFileRoute("/prioritization")({
  head: () => ({
    meta: [
      { title: "Prioritization · VoC Intelligence Agent" },
      { name: "description", content: "Ranked opportunities with adjustable weights and visible scoring rationale." },
      { property: "og:title", content: "Prioritization · VoC Intelligence Agent" },
      { property: "og:description", content: "Ranked opportunities with adjustable weights and visible scoring rationale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Prioritization /></ReadyGate>,
});

const LABELS: Record<keyof Weights, string> = { frequency: "Frequency", severity: "Severity", impact: "Customer impact", confidence: "Confidence", effort: "Low effort" };

function Prioritization() {
  const { insights, weights, setWeights, effort, setEffort } = useVoc();
  if (!insights.length) return <><PageHeader title="Prioritization" description="Ranked opportunities." /><EmptyState title="Nothing to rank" body="Import feedback to generate themes first." /></>;
  const scored = scoreOpportunities(insights, weights, effort);
  return (
    <>
      <PageHeader title="Prioritization" description="A transparent, adjustable score — a starting point for discussion, not an objective ranking." actions={<Button variant="outline" onClick={() => setWeights(DEFAULT_WEIGHTS)}>Reset weights</Button>} />
      <MockNotice>Effort values are <strong>PM estimates</strong> (default 3) and should be confirmed with engineering. Severity and impact are proxies from the sample data, not measured business impact.</MockNotice>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="h-fit lg:sticky lg:top-6">
          <CardHeader><CardTitle className="text-base">Weights</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {(Object.keys(LABELS) as (keyof Weights)[]).map((k) => (
              <div key={k}>
                <div className="mb-2 flex justify-between text-sm"><span>{LABELS[k]}</span><span className="font-mono">{weights[k]}</span></div>
                <Slider value={[weights[k]]} min={0} max={50} step={5} onValueChange={([v]) => setWeights({ ...weights, [k]: v })} aria-label={`${LABELS[k]} weight`} />
              </div>
            ))}
          </CardContent>
        </Card>
        <ol className="space-y-4 lg:col-span-2">
          {scored.map((s, rank) => (
            <li key={s.insight.themeId}><Card>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-4">
                  <div><div className="text-xs text-muted-foreground">#{rank + 1} · {s.insight.productArea}</div><h3 className="font-semibold">{s.insight.name}</h3></div>
                  <div className="text-right"><div className="font-display text-2xl font-semibold">{s.score}</div><div className="text-xs text-muted-foreground">/ 100</div></div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><ConfidenceBadge level={s.insight.confidence} /> {s.rationale}</div>
                <table className="mt-4 w-full text-sm">
                  <thead><tr className="text-left text-xs text-muted-foreground"><th className="font-normal">Factor</th><th className="font-normal">Input</th><th className="font-normal">Points</th></tr></thead>
                  <tbody>{s.factors.map((f) => (
                    <tr key={f.key} className="border-t"><td className="py-1.5">{f.label}</td><td className="font-mono text-xs">{f.raw}</td>
                      <td className="w-40"><div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded bg-muted"><div className="h-1.5 rounded bg-primary" style={{ width: `${Math.min(100, f.contribution * 2.5)}%` }} /></div><span className="w-8 text-right font-mono text-xs">{f.contribution.toFixed(1)}</span></div></td></tr>
                  ))}</tbody>
                </table>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <label htmlFor={`eff-${s.insight.themeId}`}>Effort estimate</label>
                  <select id={`eff-${s.insight.themeId}`} value={s.effort} onChange={(e) => setEffort(s.insight.themeId, Number(e.target.value))} className="rounded-md border bg-card px-2 py-1 text-sm">
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} — {["XS", "S", "M", "L", "XL"][n - 1]}</option>)}
                  </select>
                </div>
              </CardContent>
            </Card></li>
          ))}
        </ol>
      </div>
    </>
  );
}
