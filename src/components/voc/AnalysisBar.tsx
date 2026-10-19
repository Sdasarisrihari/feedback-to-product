import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MockNotice , ProvenanceNote } from "@/components/voc/shared";
import { useVoc } from "@/lib/voc/store";

/** Shows which analysis is on screen, lets the user run the AI step, and surfaces failures plainly. */
export function AnalysisBar() {
  const { analysisSource, llm, llmStale, llmStatus, runLlm, records } = useVoc();
  const running = llmStatus.state === "running";
  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={runLlm} disabled={running || !records.length}>
          {running ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
          {running ? "Analysing feedback…" : llm ? "Re-run AI analysis" : "Run AI analysis"}
        </Button>
        <span className="text-sm text-muted-foreground">
          Showing: <strong className="text-foreground">{analysisSource === "llm" ? `AI analysis (${llm?.model})` : "keyword baseline"}</strong>
          {llm && analysisSource === "llm" && ` · ${new Date(llm.at).toLocaleString()} · ${llm.inputCount} records`}
        </span>
      </div>
      {llmStatus.state === "error" && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{llmStatus.message} The keyword baseline remains available below.</span>
        </div>
      )}
      {llmStale && <MockNotice>Feedback changed since the last AI run, so its results are hidden. Showing the keyword baseline — re-run the AI analysis to update.</MockNotice>}
      {analysisSource === "llm" ? (
        <div className="rounded-md border border-primary/30 bg-accent px-3 py-2 text-sm text-accent-foreground">
          Theme names, summaries and severity are <strong>AI suggestions</strong>. Quotes marked <em>verified</em> were checked server-side to appear word-for-word in the cited record; citations that failed are listed separately.
          {llm?.truncated && " Only the first 300 records were analysed."}
          <ProvenanceNote provenance={llm?.provenance} rejections={llm?.sourceRejections} />
        </div>
      ) : (
        <MockNotice>Themes below come from a deterministic <strong>BM25 keyword baseline</strong> over PM-defined seed themes, not an AI model.</MockNotice>
      )}
    </div>
  );
}
