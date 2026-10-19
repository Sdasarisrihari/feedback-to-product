/** Product documentation ingestion: Markdown, plain text, CSV (and PDF pages extracted in the browser). */
import { detectInjection, tokenizeCsv } from "./csv";

export type DocKind = "help_doc" | "release_note" | "spec" | "other";
export interface DocSection { id: string; docId: string; heading: string; page: number | null; text: string; suspectedInjection: boolean }
export interface ProductDoc {
  id: string; title: string; version: string; kind: DocKind; filename: string; importedAt: string;
  sections: DocSection[]; warnings: string[];
}

const MAX_SECTION = 1200;

function slug(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "doc"; }

function split(text: string): string[] {
  if (text.length <= MAX_SECTION) return [text];
  const out: string[] = []; let cur = "";
  for (const p of text.split(/\n\s*\n/)) {
    if ((cur + "\n\n" + p).length > MAX_SECTION && cur) { out.push(cur); cur = p; } else cur = cur ? `${cur}\n\n${p}` : p;
  }
  if (cur) out.push(cur);
  return out;
}

export function chunkMarkdown(md: string): { heading: string; text: string }[] {
  const out: { heading: string; text: string }[] = [];
  let heading = "Introduction"; let buf: string[] = [];
  const flush = () => { const t = buf.join("\n").trim(); if (t) split(t).forEach((x) => out.push({ heading, text: x })); buf = []; };
  for (const line of md.split(/\r?\n/)) {
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) { flush(); heading = m[2]!.trim(); } else buf.push(line);
  }
  flush();
  return out;
}

export function chunkPlain(t: string): { heading: string; text: string }[] {
  return split(t.trim()).map((text, i) => ({ heading: `Part ${i + 1}`, text }));
}

export function chunkCsv(t: string): { heading: string; text: string }[] {
  const rows = tokenizeCsv(t);
  const [h, ...body] = rows;
  if (!h) return [];
  return body.map((r) => ({ heading: `Row ${r.line}`, text: r.cells.map((c, i) => `${h.cells[i] ?? `col${i + 1}`}: ${c}`).join("\n") }));
}

export interface DocMeta { title: string; version: string; kind: DocKind }

/** pages: for PDFs, one string per page. */
export function buildDoc(input: { filename: string; text?: string; pages?: string[] }, meta: DocMeta, existingIds: Set<string>): ProductDoc {
  const base = `DOC-${slug(meta.title)}${meta.version ? `-v${slug(meta.version)}` : ""}`;
  let id = base; let n = 2;
  while (existingIds.has(id)) id = `${base}-${n++}`;
  const ext = input.filename.toLowerCase().split(".").pop();
  let raw: { heading: string; text: string; page?: number }[] = [];
  if (input.pages) raw = input.pages.flatMap((p, i) => split(p.trim()).filter(Boolean).map((text) => ({ heading: `Page ${i + 1}`, text, page: i + 1 })));
  else if (ext === "md" || ext === "markdown") raw = chunkMarkdown(input.text ?? "");
  else if (ext === "csv") raw = chunkCsv(input.text ?? "");
  else raw = chunkPlain(input.text ?? "");
  const sections = raw.filter((r) => r.text.trim()).map((r, i) => ({
    id: `${id}#s${i + 1}`, docId: id, heading: r.heading, page: r.page ?? null, text: r.text.trim(), suspectedInjection: detectInjection(r.text),
  }));
  const warnings: string[] = [];
  if (!sections.length) warnings.push("No extractable text found (scanned PDFs are not supported).");
  if (sections.some((s) => s.suspectedInjection)) warnings.push("Contains instruction-like text — treated as data.");
  return { id, title: meta.title, version: meta.version, kind: meta.kind, filename: input.filename, importedAt: new Date().toISOString(), sections, warnings };
}

export const SUPPORTED_DOC_EXT = ["md", "markdown", "txt", "csv", "pdf"];
