import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Sparkles, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, InjectionBadge, PageHeader, ReadyGate, SourceId } from "@/components/voc/shared";
import { AiTag, Cites, StatusTag } from "@/components/voc/PrdView";
import { buildDoc, SUPPORTED_DOC_EXT, type DocKind } from "@/lib/voc/docs";
import { askQuestion } from "@/lib/voc/generate.functions";
import type { QaAnswer } from "@/lib/voc/qa-schema";
import { search, type SourceFilter } from "@/lib/voc/retrieval";
import { useVoc } from "@/lib/voc/store";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base · VoC Intelligence Agent" },
      { name: "description", content: "Search customer feedback and product documentation together, and ask evidence-grounded questions." },
      { property: "og:title", content: "Knowledge Base · VoC Intelligence Agent" },
      { property: "og:description", content: "Search customer feedback and product documentation together, and ask evidence-grounded questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Knowledge /></ReadyGate>,
});

const MAX_BYTES = 5 * 1024 * 1024;

function Knowledge() {
  const { docs, records, addDoc, removeDoc, loadSampleDocs } = useVoc();
  const fileRef = useRef<HTMLInputElement>(null);
  const [meta, setMeta] = useState<{ title: string; version: string; kind: DocKind }>({ title: "", version: "", kind: "help_doc" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<SourceFilter>("all");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<QaAnswer | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const hits = useMemo(() => search(records, docs, q, filter, 10), [records, docs, q, filter]);

  async function onFile(f: File | undefined) {
    if (!f) return;
    const ext = f.name.toLowerCase().split(".").pop() ?? "";
    if (!SUPPORTED_DOC_EXT.includes(ext)) { toast.error(`Unsupported file type .${ext}. Use ${SUPPORTED_DOC_EXT.join(", ")}.`); return; }
    if (f.size > MAX_BYTES) { toast.error("File is larger than 5 MB."); return; }
    setBusy(true);
    try {
      const m = { ...meta, title: meta.title.trim() || f.name.replace(/\.[^.]+$/, "") };
      const ids = new Set(docs.map((d) => d.id));
      const doc = ext === "pdf"
        ? buildDoc({ filename: f.name, pages: await (await import("@/lib/voc/pdf-extract")).extractPdfPages(f) }, m, ids)
        : buildDoc({ filename: f.name, text: await f.text() }, m, ids);
      if (!doc.sections.length) toast.error(doc.warnings[0] ?? "No text found."); else { addDoc(doc); toast.success(`Imported ${doc.sections.length} section(s) from ${f.name}`); }
      setMeta({ title: "", version: "", kind: meta.kind });
    } catch {
      toast.error("Could not read this file. It may be corrupted or password-protected.");
    } finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function ask() {
    setAsking(true); setAskError(null); setAnswer(null);
    const fb = search(records, [], q, "feedback", 8).map((h) => ({ id: h.id, text: h.text }));
    const dc = search([], docs, q, "docs", 8).map((h) => ({ id: h.id, title: h.label, text: h.text }));
    try {
      const res = await askQuestion({ data: { question: q, feedback: fb, docs: dc } });
      if (res.ok) setAnswer(res.result); else setAskError(res.message);
    } catch { setAskError("Could not reach the server. Check your connection and retry."); }
    finally { setAsking(false); }
  }

  return (
    <>
      <PageHeader title="Knowledge Base" description="Product documentation and release notes, searchable alongside customer feedback. Documentation confirms what exists; feedback shows what customers report or request." />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Search & ask</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input placeholder="e.g. Does the documentation confirm PDF export exists?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search or question" onKeyDown={(e) => { if (e.key === "Enter" && q.trim().length >= 3) ask(); }} />
                <Select value={filter} onValueChange={(v) => setFilter(v as SourceFilter)}><SelectTrigger className="sm:w-44" aria-label="Source filter"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="feedback">Customer feedback</SelectItem><SelectItem value="docs">Product docs</SelectItem></SelectContent></Select>
                <Button onClick={ask} disabled={asking || q.trim().length < 3}>{asking ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}Ask AI</Button>
              </div>
              <p className="text-xs text-muted-foreground">Search is instant keyword (BM25) retrieval. “Ask AI” sends the top matching feedback and documentation sections to the server-side model; its claims are re-checked against those sources.</p>
              {askError && <p role="alert" className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="mt-0.5 h-4 w-4" />{askError}</p>}
            </CardContent></Card>

          {answer && (
            <Card className="border-primary/30"><CardContent className="space-y-3 pt-5">
              <div className="flex items-center gap-2"><AiTag>AI answer</AiTag><span className="text-xs text-muted-foreground">“{answer.question}”</span></div>
              <p className="text-sm">{answer.answer}</p>
              <ul className="space-y-2">{answer.claims.map((c, i) => (
                <li key={i} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2"><StatusTag kind={c.status} />{c.status === "unverified" && <span className="text-xs text-muted-foreground">model said “{c.claimed.replace("_", " ")}” but no source confirmed it</span>}</div>
                  <p className="mt-1">{c.text}</p><Cites g={c.docs} doc /><Cites g={c.feedback} />
                </li>))}</ul>
              {answer.capabilityVerdicts.length > 0 && (
                <div className="space-y-2"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capability check against documentation</div>
                  {answer.capabilityVerdicts.map((v, i) => (
                    <div key={i} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{v.capability}</span><StatusTag kind={v.status} />{v.status === "unverified" && v.claimed !== "unknown" && <span className="text-xs text-muted-foreground">(model said “{v.claimed.replace("_", " ")}” without a verified doc quote)</span>}</div><Cites g={v.docs} doc /></div>
                  ))}</div>
              )}
              {answer.clarificationQuestions.length > 0 && <div className="text-sm"><div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Needs clarification</div><ul className="mt-1 list-disc pl-5">{answer.clarificationQuestions.map((x, i) => <li key={i}>{x}</li>)}</ul></div>}
            </CardContent></Card>
          )}

          {q.trim() && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{hits.length} result(s)</p>
              {hits.map((h) => (
                <Card key={h.id}><CardContent className="pt-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={h.sourceType === "doc" ? "border-primary/40 text-primary" : ""}>{h.sourceType === "doc" ? "Product documentation" : "Customer feedback"}</Badge>
                    <SourceId id={h.id} /><span className="text-xs text-muted-foreground">{h.label} · score {h.score}</span>{h.suspectedInjection && <InjectionBadge />}
                  </div>
                  <p className="mt-2">“{h.excerpt}”</p>
                </CardContent></Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Import document</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input placeholder="Title (optional)" value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} aria-label="Document title" />
              <Input placeholder="Version (optional)" value={meta.version} onChange={(e) => setMeta({ ...meta, version: e.target.value })} aria-label="Document version" />
              <Select value={meta.kind} onValueChange={(v) => setMeta({ ...meta, kind: v as DocKind })}><SelectTrigger aria-label="Document type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="help_doc">Help doc</SelectItem><SelectItem value="release_note">Release notes</SelectItem><SelectItem value="spec">Spec / PRD</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select>
              <input ref={fileRef} type="file" className="hidden" accept=".md,.markdown,.txt,.csv,.pdf" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload document" />
              <Button className="w-full" onClick={() => fileRef.current?.click()} disabled={busy}>{busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}Choose file</Button>
              <p className="text-xs text-muted-foreground">Markdown, text, CSV or PDF (text-based, up to 5 MB). Document text is treated as data, never as instructions.</p>
            </CardContent></Card>

          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Documents ({docs.length})</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {!docs.length && <EmptyState title="No documents" body="Import docs or load the synthetic Trellis docs." action={<Button variant="outline" onClick={loadSampleDocs}>Load sample docs</Button>} />}
              {docs.map((d) => (
                <div key={d.id} className="border-b pb-3 text-sm last:border-0">
                  <div className="font-medium">{d.title}</div>
                  <div className="text-xs text-muted-foreground"><SourceId id={d.id} /> {d.kind.replace("_", " ")}{d.version && ` · v${d.version}`} · {d.sections.length} sections · {d.filename}</div>
                  {d.warnings.map((w) => <div key={w} className="mt-1 text-xs text-destructive">{w}</div>)}
                  <button className="mt-1 text-xs text-muted-foreground underline" onClick={() => { if (confirm(`Remove "${d.title}" from the knowledge base?`)) removeDoc(d.id); }}>Remove</button>
                </div>
              ))}
            </CardContent></Card>
        </div>
      </div>
    </>
  );
}
