import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SourceId } from "@/components/voc/shared";
import type { Grounded, PrdContent } from "@/lib/voc/prd-schema";

export function AiTag({ children = "AI-generated" }: { children?: string }) {
  return <Badge variant="outline" className="border-primary/40 text-primary">{children}</Badge>;
}
export function StatusTag({ kind }: { kind: "supported" | "needs_validation" | "recommendation" | "documented" | "not_documented" | "unverified" | "assumption" | "customer_request" | "documented_capability" }) {
  const map: Record<string, [string, string]> = {
    supported: ["verified evidence", "bg-accent text-accent-foreground"],
    documented: ["documented", "bg-accent text-accent-foreground"],
    documented_capability: ["documented capability", "bg-accent text-accent-foreground"],
    customer_request: ["customer request", "bg-secondary text-secondary-foreground"],
    not_documented: ["docs: not available", "bg-secondary text-secondary-foreground"],
    recommendation: ["recommendation", "bg-mock text-mock-foreground"],
    assumption: ["assumption", "bg-mock text-mock-foreground"],
    needs_validation: ["needs validation", "bg-destructive/10 text-destructive"],
    unverified: ["unverified", "bg-destructive/10 text-destructive"],
  };
  const [label, cls] = map[kind]!;
  return <Badge variant="outline" className={`${cls} border-transparent`}>{label}</Badge>;
}

export function Cites({ g, doc = false }: { g: Grounded; doc?: boolean }) {
  if (!g.verified.length && !g.rejected.length) return null;
  return (
    <div className="mt-1.5 space-y-1">
      {g.verified.map((v, i) => (
        <div key={i} className="text-xs text-muted-foreground"><SourceId id={v.id} /> <span className="text-positive">✓ {doc ? "doc quote" : "verbatim"}</span> “{v.excerpt}”</div>
      ))}
      {g.rejected.map((r, i) => (
        <div key={`r${i}`} className="text-xs text-destructive"><SourceId id={r.id} /> ✗ <s>“{r.quote}”</s> — {r.reason}</div>
      ))}
    </div>
  );
}

function H({ children }: { children: string }) {
  return <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">{children}</h3>;
}
function List({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">None listed.</p>;
  return <ul className="list-disc space-y-1 pl-5 text-sm">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}

export function PrdRead({ c }: { c: PrdContent }) {
  return (
    <div>
      <H>Problem statement</H>
      <div className="flex gap-2">{c.problemStatement.supported ? <StatusTag kind="supported" /> : <StatusTag kind="needs_validation" />}<AiTag /></div>
      <p className="mt-1 text-sm">{c.problemStatement.text}</p><Cites g={c.problemStatement} />
      <H>Customer impact</H>
      <div className="flex gap-2">{c.customerImpact.supported ? <StatusTag kind="supported" /> : <StatusTag kind="needs_validation" />}<AiTag /></div>
      <p className="mt-1 text-sm">{c.customerImpact.text}</p><Cites g={c.customerImpact} />
      <H>Requirements</H>
      <ul className="space-y-3">{c.requirements.map((r) => (
        <li key={r.id} className="rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2"><SourceId id={r.id} /><Badge variant="secondary">{r.priority}</Badge><StatusTag kind={r.status} /></div>
          <p className="mt-1">{r.text}</p><Cites g={r.feedback} /><Cites g={r.docs} doc />
        </li>))}</ul>
      <div className="grid gap-4 sm:grid-cols-2"><div><H>In scope</H><List items={c.inScope} /></div><div><H>Out of scope</H><List items={c.outOfScope} /></div></div>
      <H>User stories</H>
      <ul className="space-y-3">{c.stories.map((s) => (
        <li key={s.id} className="rounded-md border p-3 text-sm">
          <div className="flex items-center gap-2"><SourceId id={s.id} />{s.supported ? <StatusTag kind="supported" /> : <StatusTag kind="needs_validation" />}</div>
          <p className="mt-1">As a <strong>{s.persona}</strong>, I want <strong>{s.capability}</strong>, so that <strong>{s.outcome}</strong>.</p>
          <ul className="mt-2 list-disc pl-5 text-muted-foreground">{s.acceptanceCriteria.map((a, i) => <li key={i}>{a}</li>)}</ul>
          <Cites g={s} />
        </li>))}</ul>
      <H>Capability checks against documentation</H>
      <ul className="space-y-2">{c.capabilityChecks.map((k, i) => (
        <li key={i} className="rounded-md border p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{k.capability}</span><StatusTag kind={k.status} />{k.claimed !== k.status && k.status === "unverified" && <span className="text-xs text-muted-foreground">(model claimed “{k.claimed}”, no verified doc quote)</span>}</div>
          {k.status === "unverified" && k.clarificationQuestion && <p className="mt-1 text-muted-foreground">Clarify: {k.clarificationQuestion}</p>}
          <Cites g={k.docs} doc />
        </li>))}</ul>
      <H>Success metrics (suggested)</H>
      <ul className="space-y-1 text-sm">{c.successMetrics.map((m, i) => <li key={i}><strong>{m.metric}</strong> — {m.measurement} {!m.baselineKnown && <span className="text-xs text-mock-foreground">(no baseline yet)</span>}</li>)}</ul>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><H>Dependencies</H><List items={c.dependencies} /></div><div><H>Risks</H><List items={c.risks} /></div>
        <div><H>Assumptions</H><List items={c.assumptions} /></div><div><H>Open questions</H><List items={c.openQuestions} /></div>
      </div>
      <H>Evidence gaps — needs validation</H><List items={c.evidenceGaps} />
    </div>
  );
}

const lines = (v: string) => v.split("\n").map((x) => x.trim()).filter(Boolean);

/** Edits text only; citations stay attached to their items and are not editable. */
export function PrdEdit({ c, onSave, onCancel }: { c: PrdContent; onSave: (c: PrdContent) => void; onCancel: () => void }) {
  const [d, setD] = useState<PrdContent>(c);
  const F = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>{children}</label>;
  return (
    <div className="space-y-4">
      <F label="Title"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></F>
      <F label="Problem statement"><Textarea rows={3} value={d.problemStatement.text} onChange={(e) => setD({ ...d, problemStatement: { ...d.problemStatement, text: e.target.value } })} /></F>
      <F label="Customer impact"><Textarea rows={3} value={d.customerImpact.text} onChange={(e) => setD({ ...d, customerImpact: { ...d.customerImpact, text: e.target.value } })} /></F>
      {d.requirements.map((r, i) => (
        <F key={r.id} label={`Requirement ${r.id}`}><Textarea rows={2} value={r.text} onChange={(e) => setD({ ...d, requirements: d.requirements.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} /></F>
      ))}
      {d.stories.map((s, i) => {
        const up = (p: Partial<typeof s>) => setD({ ...d, stories: d.stories.map((x, j) => (j === i ? { ...x, ...p } : x)) });
        return (
          <div key={s.id} className="space-y-2 rounded-md border p-3">
            <div className="text-xs font-semibold">{s.id}</div>
            <Input aria-label="Persona" value={s.persona} onChange={(e) => up({ persona: e.target.value })} />
            <Input aria-label="Capability" value={s.capability} onChange={(e) => up({ capability: e.target.value })} />
            <Input aria-label="Outcome" value={s.outcome} onChange={(e) => up({ outcome: e.target.value })} />
            <Textarea aria-label="Acceptance criteria" rows={3} value={s.acceptanceCriteria.join("\n")} onChange={(e) => up({ acceptanceCriteria: lines(e.target.value) })} />
          </div>
        );
      })}
      {(["inScope", "outOfScope", "dependencies", "risks", "assumptions", "openQuestions", "evidenceGaps"] as const).map((k) => (
        <F key={k} label={`${k} (one per line)`}><Textarea rows={3} value={d[k].join("\n")} onChange={(e) => setD({ ...d, [k]: lines(e.target.value) })} /></F>
      ))}
      <div className="flex gap-2"><Button onClick={() => onSave(d)}>Save as new revision</Button><Button variant="ghost" onClick={onCancel}>Cancel</Button></div>
    </div>
  );
}
