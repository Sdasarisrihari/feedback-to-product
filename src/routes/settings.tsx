import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, ReadyGate } from "@/components/voc/shared";
import { useVoc } from "@/lib/voc/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · VoC Intelligence Agent" },
      { name: "description", content: "Model configuration, data import options and integration status." },
      { property: "og:title", content: "Settings · VoC Intelligence Agent" },
      { property: "og:description", content: "Model configuration, data import options and integration status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Settings /></ReadyGate>,
});

const INTEGRATIONS = [
  { name: "LLM (server-side model call)", status: "Not connected", phase: "Phase 3", setup: "Enable the backend and connect the built-in AI service. Keys stay on the server; outputs are schema-validated." },
  { name: "Retrieval: BM25 lexical index", status: "Active (in browser)", phase: "Phase 2", setup: "Moves server-side in Phase 3. Embeddings only if evaluation shows value." },
  { name: "Persistent storage", status: "Browser only", phase: "Phase 3", setup: "Data is saved in this browser. A database is added with the backend." },
  { name: "MCP server", status: "Planned", phase: "Phase 4", setup: "Tools: search_feedback, get_theme_evidence, create_draft_task (draft-only, least privilege)." },
  { name: "n8n workflow", status: "Planned", phase: "Phase 4", setup: "Self-hosted n8n receives a validated insight batch, produces a digest, records run status." },
  { name: "GitHub Issues", status: "Not connected", phase: "Phase 4", setup: "Only approved tasks, with idempotency keys and a second confirmation." },
];

function Settings() {
  const { reset, loadSample, records } = useVoc();
  return (
    <>
      <PageHeader title="Settings" description="What is connected, what is not, and how to set it up." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Model configuration</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Analysis method</span><span className="font-mono">bm25-baseline</span></div>
            <div className="flex justify-between"><span>LLM provider</span><Badge variant="outline" className="text-destructive">not configured</Badge></div>
            <p className="text-muted-foreground">No AI results are simulated. Until a model is connected, insights come from the transparent keyword baseline and drafts from templates.</p>
          </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Data</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{records.length} records stored in this browser. CSV limit 2 MB; required column <code className="font-mono">text</code>.</p>
            <p className="text-muted-foreground">Feedback is treated as untrusted data. Instruction-like text is flagged and never executed.</p>
            <div className="flex gap-2"><Button variant="outline" onClick={loadSample}>Load sample dataset</Button><Button variant="destructive" onClick={() => confirm("Delete all imported feedback, drafts and tasks from this browser?") && reset()}>Clear workspace</Button></div>
          </CardContent></Card>
      </div>
      <Card className="mt-5"><CardHeader><CardTitle className="text-base">Integration status</CardTitle></CardHeader>
        <CardContent className="divide-y">
          {INTEGRATIONS.map((i) => (
            <div key={i.name} className="grid gap-1 py-3 text-sm sm:grid-cols-[1fr_auto]">
              <div><div className="font-medium">{i.name}</div><div className="text-muted-foreground">{i.setup}</div></div>
              <div className="flex gap-2 sm:justify-end"><Badge variant="secondary">{i.status}</Badge><Badge variant="outline">{i.phase}</Badge></div>
            </div>
          ))}
        </CardContent></Card>
    </>
  );
}
