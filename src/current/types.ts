export type Course2026Classification =
  | "unchanged"
  | "updated"
  | "new"
  | "coverage_gap"
  | "uncertain"
  | "annotation"
  | "supplementary";

export type Course2026Status =
  | "verified_unchanged"
  | "mixed"
  | "user_reported_covered"
  | "supplementary";

export type Course2026ContentLayer =
  | "printed"
  | "annotated_printed"
  | "handwriting";

export type Course2026ExamSignal = {
  points: string[];
  evidence_basis: string;
  official_scope: "unknown";
};

export type Course2026Finding = {
  title: string;
  detail: string;
  classification: Course2026Classification;
  confidence: "high" | "medium" | "low";
  pdf_pages?: number[];
  occurrence_ids?: string[];
};

export type Course2026Annotation = {
  pdf_page: number;
  description: string;
  interpretation: string;
  study_value: "useful" | "context_only" | "incidental";
  image?: string;
};

export type Course2026Slide = {
  id: string;
  deck_slide: number | null;
  pdf_pages: number[];
  title: string;
  image: string;
  image_alt: string;
  classification: Course2026Classification;
  content_layer: Course2026ContentLayer;
  comparison_basis: string;
  chapter_id: string;
  source_note: string;
  baseline_occurrence_ids: string[];
  explanation: string[];
  key_points: string[];
  exam_signal: Course2026ExamSignal;
  self_test: string[];
  handwritten_note?: string;
};

export type Course2026Deck = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  source_file: string;
  source_year: number;
  physical_page_count: number;
  logical_slide_count: number;
  chapter_ids: string[];
  status: Course2026Status;
  status_label: string;
  coverage_basis: "printed_comparison" | "user_report" | "supplement";
  official_exam_scope: "unknown";
  verdict: string;
  confidence_note: string;
  study_treatment: string[];
  findings: Course2026Finding[];
  annotations: Course2026Annotation[];
  slides: Course2026Slide[];
};

export type Course2026Collection = {
  generated_at: string;
  title: string;
  warning: string;
  baseline_note: string;
  methodology: string[];
  decks: Course2026Deck[];
};
