import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader, ReadyGate, SourceId } from "@/components/voc/shared";
import { useVoc } from "@/lib/voc/store";
import type { DraftTask } from "@/lib/voc/types";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Review · VoC Intelligence Agent" },
      { name: "description", content: "Approve, edit or reject draft development tasks before anything leaves the workspace." },
      { property: "og:title", content: "Task Review · VoC Intelligence Agent" },
      { property: "og:description", content: "Approve, edit or reject draft development tasks before anything leaves the workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ReadyGate><Tasks /></ReadyGate>,
});

function TaskCard({ t }: { t: DraftTask }) {
  const { dispatchTask } = useVoc();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(t.title);
  const [desc, setDesc] = useState(t.description);
  const now = () => new Date().toISOString();
  const statusCls = t.status === "approved" ? "bg-accent text-accent-foreground" : t.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-mock text-mock-foreground";
  return (
    <Card><CardContent className="pt-5">
      <div className="flex flex-wrap items-center gap-2"><SourceId id={t.id} /><Badge variant="outline" className={`${statusCls} border-transparent`}>{t.status}</Badge>
        <span className="text-xs text-muted-foreground">evidence: {t.evidenceIds.join(", ")}</span></div>
      {editing ? (
        <div className="mt-3 space-y-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Task title" />
          <Textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Task description" />
          <div className="flex gap-2"><Button size="sm" onClick={() => { dispatchTask({ type: "edit", id: t.id, title, description: desc }); setEditing(false); }}>Save (returns to draft)</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
        </div>
      ) : (
        <>
          <h3 className="mt-2 font-semibold">{t.title}</h3>
          <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{t.description}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">{t.acceptance.map((a) => <li key={a}>{a}</li>)}</ul>
        </>
      )}
      {!editing && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" disabled={t.status === "approved"} onClick={() => dispatchTask({ type: "approve", id: t.id, at: now() })}><Check className="mr-1 h-4 w-4" />Approve</Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>
          <Button size="sm" variant="outline" disabled={t.status === "rejected"} onClick={() => dispatchTask({ type: "reject", id: t.id, at: now() })}><X className="mr-1 h-4 w-4" />Reject</Button>
        </div>
      )}
    </CardContent></Card>
  );
}

function Tasks() {
  const { tasks } = useVoc();
  const approved = tasks.filter((t) => t.status === "approved").length;
  return (
    <>
      <PageHeader title="Task Review" description="Draft tasks stay local until a human approves them. Rejected tasks never create an external side effect." />
      <div className="mb-5 rounded-md border bg-card p-3 text-sm">
        <strong>Task destination: not connected.</strong> Approved tasks ({approved}) are stored in this workspace only. GitHub Issues export is not built yet; when added it will require a second explicit confirmation.
      </div>
      {!tasks.length ? <EmptyState title="No draft tasks" body="Generate a PRD and send its stories here for review." action={<Button asChild><Link to="/prd">Open PRD Studio</Link></Button>} /> : (
        <div className="space-y-4">{tasks.map((t) => <TaskCard key={t.id} t={t} />)}</div>
      )}
    </>
  );
}
