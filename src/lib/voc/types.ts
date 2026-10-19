export type FeedbackSource = "support_ticket" | "app_review" | "survey" | "sales_call" | "unknown";
export type Segment = "smb" | "mid_market" | "enterprise" | "unknown";

export interface FeedbackRecord {
  id: string;
  source: FeedbackSource;
  segment: Segment;
  createdAt: string; // ISO date or "" when missing
  rating: number | null; // 1-5
  text: string;
  importId: string; // provenance: which import produced this record
  line: number; // provenance: line in the source file
  warnings: string[];
  duplicateOf?: string | undefined;
  suspectedInjection: boolean;
}

export interface RejectedRow {
  line: number;
  reason: string;
  raw: string;
}

export interface ImportRun {
  id: string;
  filename: string;
  at: string;
  total: number;
  accepted: number;
  duplicates: number;
  warnings: number;
  rejected: RejectedRow[];
  fatalError?: string;
}

export interface EvidenceRef {
  id: string;
  score: number;
  excerpt: string; // verbatim substring of the source record text
}

export interface Insight {
  themeId: string;
  name: string;
  productArea: string;
  kind: "pain_point" | "feature_request";
  evidence: EvidenceRef[];
  frequency: number;
  sentiment: { positive: number; neutral: number; negative: number; unrated: number };
  severity: number; // 1-5 heuristic
  enterpriseShare: number; // 0-1
  confidence: "high" | "medium" | "low";
  confidenceReason: string;
  assumptions: string[];
  origin?: "baseline" | "llm" | undefined;
  summary?: string | undefined; // model-generated suggestion
  rejectedCitations?: { id: string; quote: string; reason: string }[] | undefined;
  related?: EvidenceRef[] | undefined; // BM25-retrieved, not cited by the model
  openQuestions?: string[] | undefined;
}

export interface Weights {
  frequency: number;
  severity: number;
  impact: number;
  confidence: number;
  effort: number;
}

export type TaskStatus = "draft" | "approved" | "rejected";
export interface DraftTask {
  id: string;
  themeId: string;
  title: string;
  description: string;
  acceptance: string[];
  evidenceIds: string[];
  status: TaskStatus;
  reviewedAt?: string | undefined;
}
