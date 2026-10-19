import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, MockNotice, PageHeader, ReadyGate, SourceId } from "@/components/voc/shared";
import { buildPrdDraft, tasksFromPrd, type PrdDraft } from "@/lib/voc/drafts";
import { scoreOpportunities } from "@/lib/voc/prioritize";
import { useVoc } from "@/lib/voc/store";

export const Route = createFileRoute("/prd")({
  head: () => ({
    meta: [
      { title: "PRD Studio · VoC Intelligence Agent" },
      { name: "description", content: "Draft PRDs, user stories and acceptance criteria linked to source evidence." },
      { property: "og:title", content: "PRD Studio · VoC Intelligence Agent" },
      { property: "og:description", content: "Draft PRDs, user stories and acceptance criteria linked to source evidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Studio /></ReadyGate>,
});

function Studio() {
  const { insights, records, weights, effort, prds, savePrd, dispatchTask } = useVoc();
  const ranked = scoreOpportunities(insights, weights, effort);
  const [themeId, setThemeId] = useState(ranked[0]?.insight.themeId ?? "");
  const [draft, setDraft] = useState<PrdDraft | null>(null);
  useEffect(() => { setDraft(prds[themeId] ?? null); }, [themeId, prds]);

  if (!ranked.length) return <><PageHeader title="PRD Studio" description="Draft product artifacts." /><EmptyState title="No insights to draft from" body="Import feedback first." /></>;
  const insight = insights.find((i) => i.themeId === themeId)!;
  const set = (patch: Partial<PrdDraft>) => draft && setDraft({ ...draft, ...patch });

  return (
    <>
      <PageHeader title="PRD Studio" description="Generate a draft from a selected insight, edit it, then send its stories to Task Review." />
      <MockNotice>Drafts are built from a <strong>deterministic template</strong> filled with real evidence IDs and quotes — they are not LLM-written. Bracketed text marks gaps the PM must fill.</MockNotice>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Select value={themeId} onValueChange={setThemeId}><SelectTrigger className="w-80" aria-label="Insight"><SelectValue /></SelectTrigger>
          <SelectContent>{ranked.map((r, i) => <SelectItem key={r.insight.themeId} value={r.insight.themeId}>#{i + 1} {r.insight.name}</SelectItem>)}</SelectContent></Select>
        <Button onClick={() => setDraft(buildPrdDraft(insight, records))}>{draft ? "Regenerate draft" : "Generate draft"}</Button>
        {draft && <Button variant="outline" onClick={() => { savePrd(draft); toast.success("Draft saved"); }}>Save edits</Button>}
        {draft && <Button variant="secondary" onClick={() => { savePrd(draft); dispatchTask({ type: "add", tasks: tasksFromPrd(draft) }); toast.success("Draft tasks sent for review"); }}>Send stories to Task Review</Button>}
      </div>
      {!draft ? <EmptyState title="No draft yet" body={`Generate a draft PRD for "${insight.name}" from its ${insight.frequency} evidence records.`} /> : (
        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-2"><CardContent className="space-y-4 pt-5">
            <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} className="font-display text-lg font-semibold" aria-label="PRD title" />
            <Field label="Problem"><Textarea rows={3} value={draft.problem} onChange={(e) => set({ problem: e.target.value })} /></Field>
            <Field label="Goals (one per line)"><Textarea rows={2} value={draft.goals.join("\n")} onChange={(e) => set({ goals: e.target.value.split("\n") })} /></Field>
            <Field label="Non-goals"><Textarea rows={2} value={draft.nonGoals.join("\n")} onChange={(e) => set({ nonGoals: e.target.value.split("\n") })} /></Field>
            <Field label="Open questions"><Textarea rows={3} value={draft.openQuestions.join("\n")} onChange={(e) => set({ openQuestions: e.target.value.split("\n") })} /></Field>
            <div>
              <h3 className="mb-2 text-sm font-semibold">User stories</h3>
              <div className="space-y-3">{draft.stories.map((s) => (
                <div key={s.id} className="rounded-md border p-3 text-sm">
                  <div className="flex justify-between"><SourceId id={s.id} /><span className="text-xs text-muted-foreground">evidence: {s.evidenceIds.join(", ")}</span></div>
                  <p className="mt-2">As a <em>{s.persona}</em>, I want {s.want}, so that {s.benefit}.</p>
                  <ul className="mt-2 list-disc pl-5 text-muted-foreground">{s.acceptance.map((a) => <li key={a}>{a}</li>)}</ul>
                </div>))}</div>
            </div>
            <Field label="Recommended next actions"><Textarea rows={3} value={draft.nextActions.join("\n")} onChange={(e) => set({ nextActions: e.target.value.split("\n") })} /></Field>
          </CardContent></Card>
          <Card className="h-fit"><CardHeader><CardTitle className="text-base">Evidence used</CardTitle></CardHeader>
            <CardContent><pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{draft.evidenceSummary}</pre>
              <Link to="/insights" hash={themeId} className="mt-3 inline-block text-sm text-primary underline">View full insight</Link></CardContent></Card>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
}
