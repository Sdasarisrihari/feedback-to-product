import type { FeedbackRecord, FeedbackSource, ImportRun, RejectedRow, Segment } from "./types";

/** RFC-4180-ish CSV tokenizer. Throws on unterminated quotes. Returns rows with their starting line. */
export function tokenizeCsv(input: string): { line: number; cells: string[] }[] {
  const rows: { line: number; cells: string[] }[] = [];
  let cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  let line = 1;
  let rowStart = 1;
  const text = input.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else {
        if (ch === "\n") line++;
        cell += ch;
      }
      continue;
    }
    if (ch === '"' && cell === "") inQuotes = true;
    else if (ch === ",") { cells.push(cell); cell = ""; }
    else if (ch === "\r") continue;
    else if (ch === "\n") {
      cells.push(cell);
      rows.push({ line: rowStart, cells });
      cells = []; cell = ""; line++; rowStart = line;
    } else cell += ch;
  }
  if (inQuotes) throw new Error(`Unterminated quoted field starting near line ${rowStart}`);
  if (cell !== "" || cells.length) { cells.push(cell); rows.push({ line: rowStart, cells }); }
  return rows.filter((r) => !(r.cells.length === 1 && (r.cells[0] ?? "").trim() === ""));
}

const SOURCES: FeedbackSource[] = ["support_ticket", "app_review", "survey", "sales_call"];
const SEGMENTS: Segment[] = ["smb", "mid_market", "enterprise"];

const INJECTION_PATTERNS = [
  /ignore (all |any )?(previous|prior|above) instructions/i,
  /system prompt/i,
  /you are now/i,
  /reveal (your|the) (api key|secret|prompt)/i,
  /disregard .*instructions/i,
];
export function detectInjection(text: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(text));
}

export function normalizeText(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

export interface ParseResult {
  run: ImportRun;
  records: FeedbackRecord[];
}

/**
 * Parse + validate a feedback CSV. Required column: text. Optional: id, source, segment, created_at, rating.
 * Never drops rows silently: every row is accepted, flagged as duplicate, or listed as rejected with a reason.
 */
export function parseFeedbackCsv(
  input: string,
  filename: string,
  existing: FeedbackRecord[] = [],
  importId = `imp_${Date.now().toString(36)}`,
): ParseResult {
  const run: ImportRun = { id: importId, filename, at: new Date().toISOString(), total: 0, accepted: 0, duplicates: 0, warnings: 0, rejected: [] };
  if (!input.trim()) return { run: { ...run, fatalError: "The file is empty." }, records: [] };
  let rows;
  try { rows = tokenizeCsv(input); } catch (e) {
    return { run: { ...run, fatalError: (e as Error).message }, records: [] };
  }
  const [header, ...body] = rows as [(typeof rows)[number], ...typeof rows];
  const cols = header.cells.map((c) => c.trim().toLowerCase());
  const idx = (n: string) => cols.indexOf(n);
  if (idx("text") === -1) return { run: { ...run, fatalError: `Missing required column "text". Found: ${cols.join(", ") || "none"}` }, records: [] };
  if (body.length === 0) return { run: { ...run, fatalError: "The file has a header but no feedback rows." }, records: [] };

  const seenIds = new Map(existing.map((r) => [r.id, r.id]));
  const seenText = new Map(existing.map((r) => [normalizeText(r.text), r.id]));
  const records: FeedbackRecord[] = [];
  const rejected: RejectedRow[] = [];

  for (const row of body) {
    run.total++;
    const raw = row.cells.join(",");
    if (row.cells.length !== cols.length) {
      rejected.push({ line: row.line, reason: `Expected ${cols.length} columns, got ${row.cells.length}`, raw });
      continue;
    }
    const get = (n: string) => (idx(n) >= 0 ? (row.cells[idx(n)] ?? "").trim() : "");
    const text = get("text");
    if (!text) { rejected.push({ line: row.line, reason: "Empty feedback text", raw }); continue; }
    const warnings: string[] = [];
    let id = get("id");
    const norm = normalizeText(text);
    const dupOf: string | undefined = seenText.get(norm);
    if (!id) { id = `${importId}-L${row.line}`; warnings.push("Missing id — generated from import + line"); }
    if (seenIds.has(id)) {
      const newId = `${id}~L${row.line}`;
      if (!dupOf) warnings.push(`ID ${id} reused with different text — stored as ${newId}`);
      id = newId;
    }
    const srcRaw = get("source").toLowerCase() as FeedbackSource;
    const source: FeedbackSource = SOURCES.includes(srcRaw) ? srcRaw : "unknown";
    if (source === "unknown") warnings.push(srcRaw ? `Unrecognized source "${srcRaw}"` : "Missing source");
    const segRaw = get("segment").toLowerCase() as Segment;
    const segment: Segment = SEGMENTS.includes(segRaw) ? segRaw : "unknown";
    if (segment === "unknown") warnings.push("Missing or unrecognized segment");
    let createdAt = get("created_at");
    if (createdAt && Number.isNaN(Date.parse(createdAt))) { warnings.push(`Invalid date "${createdAt}"`); createdAt = ""; }
    if (!createdAt) warnings.push("Missing date");
    const rRaw = get("rating");
    let rating: number | null = null;
    if (rRaw) {
      const n = Number(rRaw);
      if (Number.isInteger(n) && n >= 1 && n <= 5) rating = n; else warnings.push(`Invalid rating "${rRaw}"`);
    }
    const rec: FeedbackRecord = {
      id, source, segment, createdAt, rating, text, importId, line: row.line, warnings,
      duplicateOf: dupOf, suspectedInjection: detectInjection(text),
    };
    if (rec.duplicateOf) run.duplicates++; else run.accepted++;
    if (warnings.length) run.warnings++;
    seenIds.set(rec.id, rec.id);
    if (!seenText.has(norm)) seenText.set(norm, rec.id);
    records.push(rec);
  }
  run.rejected = rejected;
  return { run, records };
}
