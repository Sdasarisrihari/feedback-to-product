import type { Insight, Weights } from "./types";

export const DEFAULT_WEIGHTS: Weights = { frequency: 30, severity: 25, impact: 20, confidence: 15, effort: 10 };
export const CONF_VALUE = { high: 1, medium: 0.6, low: 0.3 } as const;

export interface ScoreFactor { key: keyof Weights; label: string; raw: string; normalized: number; weight: number; contribution: number }
export interface ScoredOpportunity { insight: Insight; effort: number; score: number; factors: ScoreFactor[]; rationale: string }

/**
 * Transparent weighted score (0-100). All inputs normalized to 0-1.
 * Effort is a PM estimate (1 = small, 5 = very large) and contributes as (1 - normalized effort).
 */
export function scoreOpportunities(insights: Insight[], weights: Weights, effort: Record<string, number>): ScoredOpportunity[] {
  const maxFreq = Math.max(1, ...insights.map((i) => i.frequency));
  const totalW = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  return insights
    .map((insight) => {
      const e = effort[insight.themeId] ?? 3;
      const parts: Omit<ScoreFactor, "contribution" | "weight">[] = [
        { key: "frequency", label: "Frequency", raw: `${insight.frequency} records`, normalized: insight.frequency / maxFreq },
        { key: "severity", label: "Severity", raw: `${insight.severity}/5 (heuristic)`, normalized: insight.severity / 5 },
        { key: "impact", label: "Customer impact", raw: `${Math.round(insight.enterpriseShare * 100)}% enterprise`, normalized: insight.enterpriseShare },
        { key: "confidence", label: "Evidence confidence", raw: insight.confidence, normalized: CONF_VALUE[insight.confidence] },
        { key: "effort", label: "Effort (inverse)", raw: `${e}/5 PM estimate`, normalized: 1 - (e - 1) / 4 },
      ];
      const factors = parts.map((p) => ({ ...p, weight: weights[p.key], contribution: (p.normalized * weights[p.key] * 100) / totalW }));
      const score = Math.round(factors.reduce((s, f) => s + f.contribution, 0) * 10) / 10;
      const top = [...factors].sort((a, b) => b.contribution - a.contribution).slice(0, 2).map((f) => f.label.toLowerCase());
      return { insight, effort: e, score, factors, rationale: `Driven mostly by ${top.join(" and ")}.` };
    })
    .sort((a, b) => b.score - a.score);
}
