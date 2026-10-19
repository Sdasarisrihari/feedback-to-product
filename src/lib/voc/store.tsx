import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { analyzeFeedback } from "./analysis";
import { analyzeWithLlm } from "./analyze.functions";
import type { AnalysisResult } from "./llm-schema";
import { parseFeedbackCsv } from "./csv";
import { addRevision, reduceTasks, tasksFromAiPrd, type AiPrd, type TaskAction } from "./drafts";
import type { ProductDoc } from "./docs";
import { sampleDocs } from "./sample-docs";
import { search } from "./retrieval";
import { generatePrd } from "./generate.functions";
import type { PrdContent, PrdSourceInput } from "./prd-schema";
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
  prds: Record<string, unknown>; // legacy template drafts — kept untouched in storage, no longer shown
  docs: ProductDoc[];
  aiPrds: AiPrd[];
  tasks: DraftTask[];
  llm: (Extract<AnalysisResult, { ok: true }> & { at: string; signature: string }) | null;
}

export type LlmStatus = { state: "idle" } | { state: "running" } | { state: "error"; code: string; message: string };

/** Changes whenever the analysable record set changes, so stale AI results are never shown as current. */
export function recordsSignature(records: FeedbackRecord[]) {
  return records.filter((r) => !r.duplicateOf).map((r) => r.id).join("|");
}

const KEY = "voc-workspace-v1";
const empty: Persisted = { records: [], imports: [], runs: [], weights: DEFAULT_WEIGHTS, effort: {}, prds: {}, tasks: [], llm: null, docs: [], aiPrds: [] };

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
  addDoc: (d: ProductDoc) => void;
  removeDoc: (id: string) => void;
  loadSampleDocs: () => void;
  prdStatus: Record<string, LlmStatus>;
  generatePrdFor: (insight: Insight, existingPrdId?: string) => Promise<string | null>;
  savePrdEdit: (id: string, content: PrdContent) => void;
  setPrdReview: (id: string, review: AiPrd["review"]) => void;
  sendPrdToTasks: (id: string) => number;
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
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Persisted>;
        // Additive migration only: older workspaces get sample docs; nothing existing is removed.
        setState({ ...empty, ...parsed, docs: parsed.docs ?? sampleDocs(), aiPrds: parsed.aiPrds ?? [] });
        setReady(true); return;
      }
    } catch { /* corrupted storage: fall back to sample */ }
    const { run, records } = parseFeedbackCsv(SAMPLE_CSV, SAMPLE_FILENAME, [], "imp_sample");
    setState({ ...empty, records, imports: [run], runs: [runBaseline(records).run], docs: sampleDocs() });
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

  const [prdStatus, setPrdStatus] = useState<Record<string, LlmStatus>>({});

  const generatePrdFor = useCallback(async (insight: Insight, existingPrdId?: string) => {
    const key = existingPrdId ?? insight.themeId;
    setPrdStatus((m) => ({ ...m, [key]: { state: "running" } }));
    const byId = new Map(state.records.map((r) => [r.id, r]));
    const feedback = insight.evidence.map((e) => byId.get(e.id)).filter((r): r is FeedbackRecord => !!r).slice(0, 30)
      .map((r) => ({ id: r.id, text: r.text.slice(0, 4000), segment: r.segment, source: r.source }));
    const docHits = search([], state.docs, `${insight.name} ${insight.summary ?? ""} ${insight.productArea}`, "docs", 8);
    const sources: PrdSourceInput = {
      theme: { name: insight.name, summary: insight.summary ?? "", productArea: insight.productArea, kind: insight.kind },
      feedback, docs: docHits.map((h) => ({ id: h.id, title: h.label, text: h.text.slice(0, 4000) })),
    };
    try {
      const res = await generatePrd({ data: sources });
      if (!res.ok) { setPrdStatus((m) => ({ ...m, [key]: { state: "error", code: res.code, message: res.message } })); return null; }
      const at = new Date().toISOString();
      const rev = { at, by: "ai" as const, content: res.content, report: res.report };
      const id = existingPrdId ?? `PRD-${Date.now().toString(36)}`;
      setState((s) => {
        const prev = s.aiPrds.find((p) => p.id === id);
        const next: AiPrd = prev ? { ...addRevision(prev, rev), sources, model: res.model }
          : { id, themeId: insight.themeId, themeName: insight.name, createdAt: at, model: res.model, review: "draft", sources, revisions: [rev] };
        return { ...s, aiPrds: prev ? s.aiPrds.map((p) => (p.id === id ? next : p)) : [next, ...s.aiPrds] };
      });
      setPrdStatus((m) => ({ ...m, [key]: { state: "idle" } }));
      return id;
    } catch {
      setPrdStatus((m) => ({ ...m, [key]: { state: "error", code: "network", message: "Could not reach the server. Check your connection and retry." } }));
      return null;
    }
  }, [state.records, state.docs]);

  const value: Ctx = {
    ...state, ready, insights, baselineInsights, analysisSource: useLlm ? "llm" : "baseline", llmStale, llmStatus, runLlm, importCsv,
    loadSample: () => importCsv(SAMPLE_CSV, SAMPLE_FILENAME) && undefined,
    reset: () => setState(empty),
    runAnalysis: () => setState((s) => ({ ...s, runs: [runBaseline(s.records).run, ...s.runs].slice(0, 20) })),
    setWeights: (weights) => setState((s) => ({ ...s, weights })),
    setEffort: (id, v) => setState((s) => ({ ...s, effort: { ...s.effort, [id]: v } })),
    addDoc: (d) => setState((s) => ({ ...s, docs: [...s.docs, d] })),
    removeDoc: (id) => setState((s) => ({ ...s, docs: s.docs.filter((d) => d.id !== id) })),
    loadSampleDocs: () => setState((s) => {
      const have = new Set(s.docs.map((d) => d.id));
      return { ...s, docs: [...s.docs, ...sampleDocs().filter((d) => !have.has(d.id))] };
    }),
    prdStatus, generatePrdFor,
    savePrdEdit: (id, content) => setState((s) => ({ ...s, aiPrds: s.aiPrds.map((p) => (p.id === id ? addRevision(p, { at: new Date().toISOString(), by: "human", content, report: null }) : p)) })),
    setPrdReview: (id, review) => setState((s) => ({ ...s, aiPrds: s.aiPrds.map((p) => (p.id === id ? { ...p, review } : p)) })),
    sendPrdToTasks: (id) => {
      const p = state.aiPrds.find((x) => x.id === id);
      if (!p) return 0;
      const tasks = tasksFromAiPrd(p);
      setState((s) => ({ ...s, tasks: reduceTasks(s.tasks, { type: "add", tasks }) }));
      return tasks.length;
    },
    dispatchTask: (a) => setState((s) => ({ ...s, tasks: reduceTasks(s.tasks, a) })),
  };
  return <VocContext.Provider value={value}>{children}</VocContext.Provider>;
}

export function useVoc() {
  const c = useContext(VocContext);
  if (!c) throw new Error("useVoc must be used inside VocProvider");
  return c;
}
