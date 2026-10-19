export interface ClassReport { label: string; precision: number; recall: number; f1: number; support: number }

export function classification(gold: string[], pred: string[], labels: readonly string[]) {
  const per: ClassReport[] = labels.map((l) => {
    let tp = 0, fp = 0, fn = 0;
    gold.forEach((g, i) => { const p = pred[i]; if (p === l && g === l) tp++; else if (p === l) fp++; else if (g === l) fn++; });
    const precision = tp + fp ? tp / (tp + fp) : 0;
    const recall = tp + fn ? tp / (tp + fn) : 0;
    return { label: l, precision, recall, f1: precision + recall ? (2 * precision * recall) / (precision + recall) : 0, support: tp + fn };
  });
  const scored = per.filter((p) => p.support > 0);
  const macroF1 = scored.reduce((s, p) => s + p.f1, 0) / (scored.length || 1);
  const accuracy = gold.filter((g, i) => g === pred[i]).length / (gold.length || 1);
  return { per, macroF1, accuracy, n: gold.length };
}

export function recallAtK(results: string[][], relevant: string[][], k: number) {
  const vals = results.map((r, i) => { const rel = relevant[i]!; const top = new Set(r.slice(0, k)); return rel.filter((x) => top.has(x)).length / (rel.length || 1); });
  return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;
