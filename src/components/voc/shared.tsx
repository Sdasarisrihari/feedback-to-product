import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FlaskConical, ShieldAlert } from "lucide-react";
import { useVoc } from "@/lib/voc/store";

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Clear label for anything not produced by a connected LLM. */
export function MockNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex items-start gap-2 rounded-md border border-signal/50 bg-mock px-3 py-2 text-sm text-mock-foreground">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function SourceId({ id }: { id: string }) {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">{id}</code>;
}

export function ConfidenceBadge({ level }: { level: "high" | "medium" | "low" }) {
  const cls = level === "high" ? "bg-accent text-accent-foreground" : level === "medium" ? "bg-mock text-mock-foreground" : "bg-destructive/10 text-destructive";
  return <Badge variant="outline" className={`${cls} border-transparent`}>{level} confidence</Badge>;
}

export function InjectionBadge() {
  return (
    <Badge variant="outline" className="gap-1 border-destructive/40 text-destructive">
      <ShieldAlert className="h-3 w-3" aria-hidden /> instruction-like text · treated as data
    </Badge>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ReadyGate({ children }: { children: ReactNode }) {
  const { ready } = useVoc();
  if (!ready) return <div className="space-y-3" aria-busy="true"><Skeleton className="h-8 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  return <>{children}</>;
}

/** Where the evidence behind an AI result came from, plus any sources the server refused. */
export function ProvenanceNote({ provenance, rejections }: { provenance?: "server_verified" | "browser_supplied" | undefined; rejections?: { id: string; kind: string; reason: string }[] | undefined }) {
  const n = rejections?.length ?? 0;
  return (
    <div className="text-xs text-muted-foreground">
      {provenance === "server_verified"
        ? <span>Sources checked on the server against your saved workspace.</span>
        : <span>Demo mode: sources came from this browser and were not checked against a saved workspace.</span>}
      {n > 0 && (
        <details className="mt-1 text-destructive"><summary className="cursor-pointer">{n} source(s) refused and not sent to the AI</summary>
          <ul className="list-disc pl-5">{rejections!.map((r) => <li key={r.kind + r.id}><span className="font-mono">{r.id}</span> — {r.reason === "text_mismatch" ? "text differs from the saved copy" : "not found in your saved workspace"}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
