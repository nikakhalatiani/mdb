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
  exerciseLabs,
] =
  await Promise.all([
  loadJson("chapters.json"),
  loadJson("notes.json"),
  loadJson("evidence-index.json"),
  loadJson("study-briefs.json"),
  loadJson("slide-explanations.json"),
  loadJson("exam-practice.json"),
  loadJson("exercise-labs.json"),
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
  implementation_exercise_labs: exerciseLabs.labs.length,
  exercise_concepts: exerciseLabs.labs.flatMap((lab) => lab.concepts).length,
  exercise_test_lessons: exerciseLabs.labs.flatMap((lab) => lab.tests).length,
  exercise_exam_drills: exerciseLabs.labs.flatMap((lab) => lab.drills).length,
  exercise_lecture_anchors: exerciseLabs.labs
    .flatMap((lab) => lab.lecture_links)
    .reduce((count, link) => count + link.occurrence_ids.length, 0),
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
const chapterOccurrenceIds = new Map(
  guide.chapters.map((chapter) => [
    chapter.id,
    new Set(chapter.occurrence_ids),
  ]),
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

if (
  !exerciseLabs.title?.trim() ||
  !exerciseLabs.warning?.trim() ||
  !exerciseLabs.methodology?.length
) {
  throw new Error("Exercise lab collection metadata is incomplete");
}

const exerciseIds = new Set();
const exerciseNumbers = new Set();
const allowedReportStatuses = new Set(["available", "not_provided"]);
const allowedDrillFormats = new Set([
  "explain",
  "pseudocode",
  "trace",
  "debug",
  "compare",
]);
for (const lab of exerciseLabs.labs) {
  if (
    !lab.id?.trim() ||
    !lab.title?.trim() ||
    !lab.subtitle?.trim() ||
    !lab.project_label?.trim() ||
    !Number.isInteger(lab.number) ||
    lab.number < 1
  ) {
    throw new Error(`Exercise lab has incomplete identity metadata: ${lab.id}`);
  }
  if (exerciseIds.has(lab.id) || exerciseNumbers.has(lab.number)) {
    throw new Error(`Duplicate exercise lab id: ${lab.id}`);
  }
  exerciseIds.add(lab.id);
  exerciseNumbers.add(lab.number);
  if (!allowedReportStatuses.has(lab.report_status)) {
    throw new Error(`Exercise lab ${lab.id} has invalid report_status`);
  }
  for (const field of [
    "assignment_brief",
    "learning_outcomes",
    "artifacts",
    "concepts",
    "decisions",
    "tests",
    "drills",
    "lecture_links",
    "limitations",
  ]) {
    if (!Array.isArray(lab[field]) || lab[field].length === 0) {
      throw new Error(`Exercise lab ${lab.id}.${field} must not be empty`);
    }
  }
  if (
    !lab.trace?.title?.trim() ||
    !lab.trace?.setup?.trim() ||
    !lab.trace?.steps?.length ||
    !lab.trace?.result?.trim()
  ) {
    throw new Error(`Exercise lab ${lab.id} has an incomplete worked trace`);
  }
  for (const chapterId of lab.chapter_ids) {
    if (!chapterIds.has(chapterId)) {
      throw new Error(
        `Exercise lab ${lab.id} references unknown chapter ${chapterId}`,
      );
    }
  }
  for (const decision of lab.decisions) {
    if (
      !decision.title?.trim() ||
      !decision.rationale?.trim() ||
      !decision.tradeoff?.trim() ||
      !decision.source_refs?.length
    ) {
      throw new Error(`Exercise lab ${lab.id} has an incomplete decision`);
    }
  }
  for (const test of lab.tests) {
    if (
      !test.name?.trim() ||
      !test.proves?.trim() ||
      !test.failure_mode?.trim() ||
      !test.source_refs?.length
    ) {
      throw new Error(`Exercise lab ${lab.id} has an incomplete test lesson`);
    }
  }
  for (const concept of lab.concepts) {
    if (
      !concept.title ||
      !concept.takeaway ||
      !concept.explanation?.length ||
      !concept.invariants?.length ||
      !concept.pitfalls?.length ||
      !concept.source_refs?.length
    ) {
      throw new Error(
        `Exercise lab ${lab.id} has an incomplete concept: ${concept.title ?? "untitled"}`,
      );
    }
  }
  for (const sourceRef of [
    ...lab.concepts.flatMap((concept) => concept.source_refs),
    ...lab.decisions.flatMap((decision) => decision.source_refs),
    ...lab.tests.flatMap((test) => test.source_refs),
  ]) {
    if (
      !sourceRef.path ||
      !sourceRef.note ||
      sourceRef.path.startsWith("/") ||
      sourceRef.path.includes("/Users/")
    ) {
      throw new Error(
        `Exercise lab ${lab.id} exposes an invalid source reference`,
      );
    }
  }
  for (const drill of lab.drills) {
    if (
      !drill.prompt?.trim() ||
      !drill.answer?.trim() ||
      !drill.checklist?.length ||
      !allowedDrillFormats.has(drill.format)
    ) {
      throw new Error(`Exercise lab ${lab.id} has an incomplete exam drill`);
    }
  }
  for (const link of lab.lecture_links) {
    if (
      !chapterIds.has(link.chapter_id) ||
      !lab.chapter_ids.includes(link.chapter_id)
    ) {
      throw new Error(
        `Exercise lab ${lab.id} links unrelated chapter ${link.chapter_id}`,
      );
    }
    if (!link.note?.trim() || !link.occurrence_ids?.length) {
      throw new Error(
        `Exercise lab ${lab.id} has an incomplete lecture link`,
      );
    }
    for (const occurrenceId of link.occurrence_ids) {
      if (!evidenceIds.has(occurrenceId)) {
        throw new Error(
          `Exercise lab ${lab.id} links unknown occurrence ${occurrenceId}`,
        );
      }
      if (!chapterOccurrenceIds.get(link.chapter_id)?.has(occurrenceId)) {
        throw new Error(
          `Exercise lab ${lab.id} links ${occurrenceId} outside ${link.chapter_id}`,
        );
      }
    }
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
