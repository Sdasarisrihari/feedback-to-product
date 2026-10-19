import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MockNotice, PageHeader, ReadyGate, SourceId, EmptyState } from "@/components/voc/shared";
import { useVoc } from "@/lib/voc/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · VoC Intelligence Agent" },
      { name: "description", content: "Feedback volume, top themes, sentiment and urgent issues at a glance." },
      { property: "og:title", content: "Overview · VoC Intelligence Agent" },
      { property: "og:description", content: "Feedback volume, top themes, sentiment and urgent issues at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Overview /></ReadyGate>,
});

const URGENT = /\b(urgent|lost|blocker|escalat|compliance|crash|times out)\w*/i;

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card><CardContent className="pt-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </CardContent></Card>
  );
}

function Overview() {
  const { records, insights, runs, imports, runAnalysis, loadSample } = useVoc();
  if (!records.length) return (<><PageHeader title="Overview" description="Your feedback workspace." /><EmptyState title="No feedback yet" body="Import a CSV in the Feedback Explorer, or load the synthetic Trellis dataset to explore the workflow." action={<Button onClick={loadSample}>Load sample dataset</Button>} /></>);

  const unique = records.filter((r) => !r.duplicateOf);
  const rated = unique.filter((r) => r.rating != null);
  const neg = rated.filter((r) => r.rating! <= 2).length, neu = rated.filter((r) => r.rating === 3).length, pos = rated.length - neg - neu;
  const urgent = unique.filter((r) => URGENT.test(r.text)).slice(0, 5);
  const maxF = Math.max(1, ...insights.map((i) => i.frequency));
  const pct = (n: number) => (rated.length ? Math.round((n / rated.length) * 100) : 0);

  return (
    <>
      <PageHeader title="Overview" description="Where customer pain is concentrating, and what the evidence says." actions={<Button onClick={runAnalysis}><Play className="mr-1 h-4 w-4" />Run baseline analysis</Button>} />
      <MockNotice>Themes here come from a deterministic <strong>BM25 keyword baseline</strong> over PM-defined seed themes, not an LLM. All counts are computed from the {unique.length} imported synthetic records.</MockNotice>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Feedback records" value={unique.length} hint={`${records.length - unique.length} duplicates excluded`} />
        <Stat label="Themes with evidence" value={insights.length} />
        <Stat label="Negative (rated)" value={`${pct(neg)}%`} hint={`${rated.length} of ${unique.length} records have a rating`} />
        <Stat label="Urgent signals" value={unique.filter((r) => URGENT.test(r.text)).length} hint="keyword match: lost, blocker, crash…" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader><CardTitle className="text-base">Top themes by frequency</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[...insights].sort((a, b) => b.frequency - a.frequency).map((i) => (
              <Link key={i.themeId} to="/insights" hash={i.themeId} className="block group">
                <div className="flex justify-between text-sm"><span className="group-hover:underline">{i.name}</span><span className="font-mono text-muted-foreground">{i.frequency}</span></div>
                <div className="mt-1 h-2 rounded bg-muted"><div className="h-2 rounded bg-primary" style={{ width: `${(i.frequency / maxF) * 100}%` }} /></div>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Sentiment (from star rating)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex h-3 overflow-hidden rounded" role="img" aria-label={`Negative ${pct(neg)}%, neutral ${pct(neu)}%, positive ${pct(pos)}%`}>
              <div className="bg-negative" style={{ width: `${pct(neg)}%` }} /><div className="bg-neutral" style={{ width: `${pct(neu)}%` }} /><div className="bg-positive" style={{ width: `${pct(pos)}%` }} />
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex justify-between"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-negative" />Negative (1–2★)</span><span className="font-mono">{neg}</span></li>
              <li className="flex justify-between"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-neutral" />Neutral (3★)</span><span className="font-mono">{neu}</span></li>
              <li className="flex justify-between"><span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-positive" />Positive (4–5★)</span><span className="font-mono">{pos}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Unrated</span><span className="font-mono">{unique.length - rated.length}</span></li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Urgent issues</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {urgent.map((r) => (<div key={r.id} className="text-sm"><SourceId id={r.id} /> <span className="text-muted-foreground">· {r.segment}</span><p className="mt-1">"{r.text}"</p></div>))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent runs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {runs.slice(0, 4).map((r) => (<div key={r.id} className="flex justify-between border-b pb-2"><span><SourceId id={r.id} /> BM25 baseline · {r.records} records → {r.themes} themes</span><span className="text-muted-foreground">{new Date(r.at).toLocaleString()}</span></div>))}
            {imports.slice(0, 3).map((i) => (<div key={i.id} className="flex justify-between border-b pb-2"><span>Import <span className="font-mono text-xs">{i.filename}</span>: {i.accepted} ok, {i.duplicates} dup, {i.rejected.length} rejected</span><span className="text-muted-foreground">{new Date(i.at).toLocaleDateString()}</span></div>))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
