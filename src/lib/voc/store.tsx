import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { analyzeFeedback } from "./analysis";
import { analyzeWithLlm } from "./analyze.functions";
import type { AnalysisResult } from "./llm-schema";
import { parseFeedbackCsv } from "./csv";
import { reduceTasks, type PrdDraft, type TaskAction } from "./drafts";
import { DEFAULT_WEIGHTS } from "./prioritize";
import { SAMPLE_CSV, SAMPLE_FILENAME } from "./sample-data";
import type { DraftTask, FeedbackRecord, ImportRun, Insight, Weights } from "./types";

export interface AnalysisRun { id: string; at: string; method: "bm25-baseline" | "llm"; model?: string | undefined; records: number; themes: number; durationMs: number }

interface Persisted {
  records: FeedbackRecord[];
  imports: ImportRun[];
  runs: AnalysisRun[];
  weights: Weights;
  effort: Record<string, number>;
  prds: Record<string, PrdDraft>;
  tasks: DraftTask[];
  llm: (Extract<AnalysisResult, { ok: true }> & { at: string; signature: string }) | null;
}

export type LlmStatus = { state: "idle" } | { state: "running" } | { state: "error"; code: string; message: string };

/** Changes whenever the analysable record set changes, so stale AI results are never shown as current. */
export function recordsSignature(records: FeedbackRecord[]) {
  return records.filter((r) => !r.duplicateOf).map((r) => r.id).join("|");
}

const KEY = "voc-workspace-v1";
const empty: Persisted = { records: [], imports: [], runs: [], weights: DEFAULT_WEIGHTS, effort: {}, prds: {}, tasks: [], llm: null };

interface Ctx extends Persisted {
  ready: boolean;
  insights: Insight[];
  baselineInsights: Insight[];
  analysisSource: "llm" | "baseline";
  llmStale: boolean;
  llmStatus: LlmStatus;
  runLlm: () => Promise<void>;
  importCsv: (text: string, filename: string) => ImportRun;
  loadSample: () => void;
  reset: () => void;
  runAnalysis: () => void;
  setWeights: (w: Weights) => void;
  setEffort: (themeId: string, v: number) => void;
  savePrd: (p: PrdDraft) => void;
  dispatchTask: (a: TaskAction) => void;
}

const VocContext = createContext<Ctx | null>(null);

function runBaseline(records: FeedbackRecord[]): { insights: Insight[]; run: AnalysisRun } {
  const t0 = performance.now();
  const insights = analyzeFeedback(records);
  return {
    insights,
    run: { id: `run_${Date.now().toString(36)}`, at: new Date().toISOString(), method: "bm25-baseline", records: records.filter((r) => !r.duplicateOf).length, themes: insights.length, durationMs: Math.round(performance.now() - t0) },
  };
}

export function VocProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { setState({ ...empty, ...JSON.parse(raw) }); setReady(true); return; }
    } catch { /* corrupted storage: fall back to sample */ }
    const { run, records } = parseFeedbackCsv(SAMPLE_CSV, SAMPLE_FILENAME, [], "imp_sample");
    setState({ ...empty, records, imports: [run], runs: [runBaseline(records).run] });
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(state)); }, [state, ready]);

  const [llmStatus, setLlmStatus] = useState<LlmStatus>({ state: "idle" });
  const baselineInsights = useMemo(() => analyzeFeedback(state.records), [state.records]);
  const sig = useMemo(() => recordsSignature(state.records), [state.records]);
  const llmStale = !!state.llm && state.llm.signature !== sig;
  const useLlm = !!state.llm && !llmStale;
  const insights = useLlm ? state.llm!.insights : baselineInsights;

  const runLlm = useCallback(async () => {
    setLlmStatus({ state: "running" });
    const unique = state.records.filter((r) => !r.duplicateOf);
    try {
      const res = await analyzeWithLlm({ data: { records: unique.map((r) => ({ id: r.id, text: r.text, source: r.source, segment: r.segment, rating: r.rating })) } });
      if (!res.ok) { setLlmStatus({ state: "error", code: res.code, message: res.message }); return; }
      const at = new Date().toISOString();
      setState((s) => ({
        ...s,
        llm: { ...res, at, signature: recordsSignature(s.records) },
        runs: [{ id: `run_${Date.now().toString(36)}`, at, method: "llm" as const, model: res.model, records: res.inputCount, themes: res.insights.length, durationMs: res.durationMs }, ...s.runs].slice(0, 20),
      }));
      setLlmStatus({ state: "idle" });
    } catch {
      setLlmStatus({ state: "error", code: "network", message: "Could not reach the server. Check your connection and retry." });
    }
  }, [state.records]);

  const importCsv = useCallback((text: string, filename: string) => {
    let out!: ImportRun;
    setState((s) => {
      const { run, records } = parseFeedbackCsv(text, filename, s.records);
      out = run;
      return { ...s, records: [...s.records, ...records], imports: [run, ...s.imports] };
    });
    return out;
  }, []);

  const value: Ctx = {
    ...state, ready, insights, baselineInsights, analysisSource: useLlm ? "llm" : "baseline", llmStale, llmStatus, runLlm, importCsv,
    loadSample: () => importCsv(SAMPLE_CSV, SAMPLE_FILENAME) && undefined,
    reset: () => setState(empty),
    runAnalysis: () => setState((s) => ({ ...s, runs: [runBaseline(s.records).run, ...s.runs].slice(0, 20) })),
    setWeights: (weights) => setState((s) => ({ ...s, weights })),
    setEffort: (id, v) => setState((s) => ({ ...s, effort: { ...s.effort, [id]: v } })),
    savePrd: (p) => setState((s) => ({ ...s, prds: { ...s.prds, [p.themeId]: p } })),
    dispatchTask: (a) => setState((s) => ({ ...s, tasks: reduceTasks(s.tasks, a) })),
  };
  return <VocContext.Provider value={value}>{children}</VocContext.Provider>;
}

export function useVoc() {
  const c = useContext(VocContext);
  if (!c) throw new Error("useVoc must be used inside VocProvider");
  return c;
}
