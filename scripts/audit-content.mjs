import { access, readFile } from "node:fs/promises";

const courseRoot = new URL("../public/generated/course/", import.meta.url);

async function loadJson(name) {
  return JSON.parse(await readFile(new URL(name, courseRoot), "utf8"));
}

const [
  guide,
  notesFile,
  evidenceFile,
  studyBriefs,
  slideExplanations,
  examBank,
] =
  await Promise.all([
  loadJson("chapters.json"),
  loadJson("notes.json"),
  loadJson("evidence-index.json"),
  loadJson("study-briefs.json"),
  loadJson("slide-explanations.json"),
  loadJson("exam-practice.json"),
]);

const notes = Object.values(notesFile.records);
const explanations = notes.flatMap((record) => record.professor_explanation);
const quotes = notes.flatMap((record) => record.quotes ?? []);
const briefs = Object.values(studyBriefs.chapters);
const genericExamPrompt =
  /^Explain .+ in your own words and reproduce the central example\.$/;

const audit = {
  chapters: guide.chapters.length,
  study_briefs: Object.keys(studyBriefs.chapters).length,
  clean_explanation_paragraphs: briefs.flatMap((brief) => brief.core_idea)
    .length,
  mental_model_steps: briefs.flatMap((brief) => brief.mental_model).length,
  curated_exam_patterns: briefs.flatMap((brief) => brief.exam_patterns).length,
  common_mistake_warnings: briefs.flatMap((brief) => brief.common_mistakes)
    .length,
  self_test_questions: briefs.flatMap((brief) => brief.self_test).length,
  evidence_intervals: evidenceFile.evidence.length,
  slide_specific_explanations: Object.keys(slideExplanations.records).length,
  gpt_edited_slide_explanations: Object.values(
    slideExplanations.records,
  ).filter((record) => record.method === "gpt_clarified_from_aligned_speech")
    .length,
  slide_explanation_paragraphs: Object.values(
    slideExplanations.records,
  ).flatMap((record) => record.explanation).length,
  suspicious_default_explanation_ocr: Object.values(
    slideExplanations.records,
  )
    .flatMap((record) => record.explanation)
    .filter((value) => /[©€\\]{2,}/.test(value)).length,
  note_records: notes.length,
  extractive_paragraphs: explanations.length,
  lowercase_extractive_fragments: explanations.filter((value) =>
    /^[a-z]/.test(value),
  ).length,
  hidden_rule_based_interval_exam_prompts: notes.flatMap(
    (record) => record.exam_focus ?? [],
  ).length,
  generic_interval_exam_prompts: notes
    .flatMap((record) => record.exam_focus ?? [])
    .filter((value) => genericExamPrompt.test(value)).length,
  low_confidence_quote_candidates: quotes.filter(
    (quote) =>
      quote.mean_word_confidence != null &&
      quote.mean_word_confidence < 0.8,
  ).length,
  exam_practice_questions: examBank.questions.length,
  high_priority_exam_questions: examBank.questions.filter(
    (question) => question.priority === "high",
  ).length,
  exact_exercise_questions: examBank.questions.filter((question) =>
    question.sources.some((source) => source.kind === "exercise"),
  ).length,
};

const chapterIds = new Set(guide.chapters.map((chapter) => chapter.id));
const briefIds = new Set(Object.keys(studyBriefs.chapters));
const missingBriefs = [...chapterIds].filter((id) => !briefIds.has(id));
const unknownBriefs = [...briefIds].filter((id) => !chapterIds.has(id));

if (missingBriefs.length || unknownBriefs.length) {
  throw new Error(
    `Study-brief coverage mismatch. Missing: ${missingBriefs.join(", ") || "none"}; unknown: ${unknownBriefs.join(", ") || "none"}`,
  );
}

for (const [id, brief] of Object.entries(studyBriefs.chapters)) {
  for (const field of [
    "core_idea",
    "mental_model",
    "exam_patterns",
    "common_mistakes",
    "self_test",
  ]) {
    if (!Array.isArray(brief[field]) || brief[field].length < 2) {
      throw new Error(`${id}.${field} needs at least two study items`);
    }
  }
}

if (
  evidenceFile.evidence.length !== notes.length ||
  evidenceFile.evidence.length !== guide.stats.visual_interval_count ||
  evidenceFile.evidence.length !==
    Object.keys(slideExplanations.records).length
) {
  throw new Error(
    "Evidence, slide explanations, notes, and guide interval counts do not match",
  );
}

const evidenceIds = new Set(
  evidenceFile.evidence.map((record) => record.occurrence_id),
);
const evidenceById = new Map(
  evidenceFile.evidence.map((record) => [record.occurrence_id, record]),
);
const examQuestionIds = new Set();
for (const question of examBank.questions) {
  if (examQuestionIds.has(question.id)) {
    throw new Error(`Duplicate exam question id: ${question.id}`);
  }
  examQuestionIds.add(question.id);
  if (!question.prompt?.trim() || !question.answer?.trim()) {
    throw new Error(`Exam question is missing prompt or answer: ${question.id}`);
  }
  if (!Array.isArray(question.sources) || question.sources.length === 0) {
    throw new Error(`Exam question has no provenance: ${question.id}`);
  }
  for (const chapterId of question.chapter_ids) {
    if (!chapterIds.has(chapterId)) {
      throw new Error(
        `Exam question ${question.id} references unknown chapter ${chapterId}`,
      );
    }
  }
  for (const citation of question.citations) {
    if (!chapterIds.has(citation.chapter_id)) {
      throw new Error(
        `Exam question ${question.id} cites unknown chapter ${citation.chapter_id}`,
      );
    }
    for (const occurrenceId of citation.occurrence_ids) {
      if (!evidenceIds.has(occurrenceId)) {
        throw new Error(
          `Exam question ${question.id} cites unknown occurrence ${occurrenceId}`,
        );
      }
    }
  }
  for (const visual of Object.values(question.visuals ?? {})) {
    await access(new URL(visual.image, courseRoot));
  }
}

const allowedExplanationStatuses = new Set([
  "substantive",
  "brief",
  "transition",
  "silent",
]);
for (const [id, record] of Object.entries(slideExplanations.records)) {
  if (!evidenceIds.has(id)) {
    throw new Error(`Slide explanation has unknown occurrence id: ${id}`);
  }
  if (record.method !== "gpt_clarified_from_aligned_speech") {
    throw new Error(`Slide explanation has unexpected method: ${id}`);
  }
  if (!allowedExplanationStatuses.has(record.status)) {
    throw new Error(`Slide explanation has invalid status: ${id}`);
  }
  if (
    !Array.isArray(record.explanation) ||
    record.explanation.length === 0 ||
    record.explanation.some(
      (value) => typeof value !== "string" || value.trim().length === 0,
    )
  ) {
    throw new Error(`Slide explanation is empty: ${id}`);
  }
  if (record.explanation.some((value) => /[©€\\]{2,}/.test(value))) {
    throw new Error(`Slide explanation contains malformed OCR-like text: ${id}`);
  }
  if (
    record.source_transcript_word_count !==
    evidenceById.get(id)?.transcript?.word_count
  ) {
    throw new Error(`Slide explanation word count does not match source: ${id}`);
  }
  if (
    !Number.isInteger(record.selected_sentence_count) ||
    record.selected_sentence_count < 0
  ) {
    throw new Error(`Slide explanation has invalid sentence count: ${id}`);
  }
  if (typeof record.ocr_warning !== "boolean") {
    throw new Error(`Slide explanation has invalid OCR warning: ${id}`);
  }
}

console.log(JSON.stringify(audit, null, 2));
