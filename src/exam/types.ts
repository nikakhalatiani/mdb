export type ExamSourceKind =
  | "compiled_protocol"
  | "student_recollection"
  | "exercise";

export type ExamVerification =
  | "verified"
  | "corrected"
  | "incomplete"
  | "unsupported"
  | "not_answerable";

export type ExamPriority = "high" | "medium" | "reference";

export type ExamSource = {
  kind: ExamSourceKind;
  label: string;
  detail: string;
  pages?: number[];
  reliability: "recollection" | "reported_pattern" | "exact_exercise";
};

export type ExamCitation = {
  chapter_id: string;
  occurrence_ids: string[];
  support_note: string;
  mapping_status: "verified" | "probable" | "coverage_gap";
};

export type PipelineGroup = {
  label: string;
  tone: "blue" | "green" | "red" | "amber";
  items: string[];
};

export type ExamQuestion = {
  id: string;
  topic: string;
  prompt: string;
  prompt_code?: string;
  format:
    | "explanation"
    | "calculation"
    | "diagram"
    | "pseudocode"
    | "comparison"
    | "recognition"
    | "plan_transformation"
    | "fill_in"
    | "trace";
  question_fidelity: "as_recorded" | "paraphrased" | "partial" | "topic_only";
  protocol_flag:
    | "none"
    | "incomplete"
    | "assumption_based"
    | "impossible_to_know";
  verification: ExamVerification;
  priority: ExamPriority;
  chapter_ids: string[];
  sources: ExamSource[];
  answer: string;
  answer_basis:
    | "lecture_supported"
    | "lecture_plus_reasoning"
    | "external_general_knowledge"
    | "unavailable";
  audit_note: string;
  assumptions: string[];
  common_traps: string[];
  citations: ExamCitation[];
  signals?: string[];
  visuals?: {
    prompt?: {
      image: string;
      alt: string;
      caption: string;
    };
    solution?: {
      image: string;
      alt: string;
      caption: string;
    };
  };
  worked_example?: {
    kind: "pipelines";
    title: string;
    groups: PipelineGroup[];
    note: string;
  };
};

export type ExamBank = {
  generated_at: string;
  title: string;
  warning: string;
  methodology: string[];
  questions: ExamQuestion[];
};

export type ExamChapterRef = {
  id: string;
  number: number;
  title: string;
};

export type ExamEvidenceRef = {
  occurrence_id: string;
  title: string;
  source_file: string;
  start: string;
  end: string;
};
