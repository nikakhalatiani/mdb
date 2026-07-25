import { readFile } from "node:fs/promises";

const courseRoot = new URL("../public/generated/course/", import.meta.url);

async function loadJson(name) {
  return JSON.parse(await readFile(new URL(name, courseRoot), "utf8"));
}

const [guide, notesFile, evidenceFile, studyBriefs] = await Promise.all([
  loadJson("chapters.json"),
  loadJson("notes.json"),
  loadJson("evidence-index.json"),
  loadJson("study-briefs.json"),
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
  evidenceFile.evidence.length !== guide.stats.visual_interval_count
) {
  throw new Error("Evidence, notes, and guide interval counts do not match");
}

console.log(JSON.stringify(audit, null, 2));
