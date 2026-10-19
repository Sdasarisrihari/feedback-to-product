import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { analyzeFeedback } from "./analysis";
import { parseFeedbackCsv } from "./csv";
import { reduceTasks, type PrdDraft, type TaskAction } from "./drafts";
import { DEFAULT_WEIGHTS } from "./prioritize";
import { SAMPLE_CSV, SAMPLE_FILENAME } from "./sample-data";
import type { DraftTask, FeedbackRecord, ImportRun, Insight, Weights } from "./types";

export interface AnalysisRun { id: string; at: string; method: "bm25-baseline"; records: number; themes: number; durationMs: number }

interface Persisted {
  records: FeedbackRecord[];
  imports: ImportRun[];
  runs: AnalysisRun[];
  weights: Weights;
  effort: Record<string, number>;
  prds: Record<string, PrdDraft>;
  tasks: DraftTask[];
}

const KEY = "voc-workspace-v1";
const empty: Persisted = { records: [], imports: [], runs: [], weights: DEFAULT_WEIGHTS, effort: {}, prds: {}, tasks: [] };

interface Ctx extends Persisted {
  ready: boolean;
  insights: Insight[];
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

  const insights = useMemo(() => analyzeFeedback(state.records), [state.records]);

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
    ...state, ready, insights, importCsv,
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
