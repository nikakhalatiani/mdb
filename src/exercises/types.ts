export type ExerciseSourceRef = {
  path: string;
  lines?: string;
  symbol?: string;
  note: string;
};

export type ExerciseLectureLink = {
  chapter_id: string;
  occurrence_ids: string[];
  note: string;
};

export type ExerciseConcept = {
  title: string;
  takeaway: string;
  explanation: string[];
  pseudocode?: string[];
  invariants: string[];
  pitfalls: string[];
  source_refs: ExerciseSourceRef[];
};

export type ExerciseTrace = {
  title: string;
  setup: string;
  steps: string[];
  result: string;
};

export type ExerciseDecision = {
  title: string;
  rationale: string;
  tradeoff: string;
  source_refs: ExerciseSourceRef[];
};

export type ExerciseTestLesson = {
  name: string;
  proves: string;
  failure_mode: string;
  source_refs: ExerciseSourceRef[];
};

export type ExerciseDrill = {
  prompt: string;
  format: "explain" | "pseudocode" | "trace" | "debug" | "compare";
  answer: string;
  checklist: string[];
};

export type ExerciseLab = {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  project_label: string;
  report_status: "available" | "not_provided";
  chapter_ids: string[];
  assignment_brief: string[];
  learning_outcomes: string[];
  artifacts: string[];
  concepts: ExerciseConcept[];
  trace: ExerciseTrace;
  decisions: ExerciseDecision[];
  tests: ExerciseTestLesson[];
  drills: ExerciseDrill[];
  lecture_links: ExerciseLectureLink[];
  limitations: string[];
};

export type ExerciseLabCollection = {
  generated_at: string;
  title: string;
  warning: string;
  methodology: string[];
  labs: ExerciseLab[];
};

export type ExerciseChapterRef = {
  id: string;
  number: number;
  title: string;
};

export type ExerciseEvidenceRef = {
  occurrence_id: string;
  title: string;
  source_file: string;
  start: string;
  end: string;
  annotated_image: string;
};
