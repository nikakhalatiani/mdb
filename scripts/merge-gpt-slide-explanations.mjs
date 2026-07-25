import { readFile, writeFile } from "node:fs/promises";

const courseRoot = new URL("../public/generated/course/", import.meta.url);
const partNames = [
  "gpt-slide-explanations-01-06.json",
  "gpt-slide-explanations-07-09.json",
  "gpt-slide-explanations-10-13.json",
  "gpt-slide-explanations-14-17.json",
];

async function loadJson(name) {
  return JSON.parse(await readFile(new URL(name, courseRoot), "utf8"));
}

const [evidenceFile, ...parts] = await Promise.all([
  loadJson("evidence-index.json"),
  ...partNames.map(loadJson),
]);

const expectedIds = new Set(
  evidenceFile.evidence.map((record) => record.occurrence_id),
);
const evidenceById = new Map(
  evidenceFile.evidence.map((record) => [record.occurrence_id, record]),
);
const allowedStatuses = new Set([
  "substantive",
  "brief",
  "transition",
  "silent",
]);
const records = {};

for (const [partIndex, part] of parts.entries()) {
  for (const [id, record] of Object.entries(part.records ?? {})) {
    if (records[id]) {
      throw new Error(`Duplicate explanation ${id} in ${partNames[partIndex]}`);
    }
    if (!expectedIds.has(id)) {
      throw new Error(`Unknown explanation ${id} in ${partNames[partIndex]}`);
    }
    if (record.method !== "gpt_clarified_from_aligned_speech") {
      throw new Error(`Non-GPT explanation method for ${id}: ${record.method}`);
    }
    if (!allowedStatuses.has(record.status)) {
      throw new Error(`Invalid explanation status for ${id}: ${record.status}`);
    }
    if (
      !Array.isArray(record.explanation) ||
      record.explanation.length === 0 ||
      record.explanation.some(
        (value) => typeof value !== "string" || value.trim().length === 0,
      )
    ) {
      throw new Error(`Empty explanation for ${id}`);
    }
    if (record.explanation.some((value) => /[©€\\]{2,}/.test(value))) {
      throw new Error(`Malformed OCR-like text leaked into explanation ${id}`);
    }
    if (
      !Number.isInteger(record.selected_sentence_count) ||
      record.selected_sentence_count < 0
    ) {
      throw new Error(`Invalid selected-sentence count for ${id}`);
    }
    if (typeof record.ocr_warning !== "boolean") {
      throw new Error(`Invalid OCR warning for ${id}`);
    }
    records[id] = {
      ...record,
      source_transcript_word_count:
        evidenceById.get(id)?.transcript?.word_count ?? 0,
    };
  }
}

const missing = [...expectedIds].filter((id) => !records[id]);
if (missing.length) {
  throw new Error(
    `Missing ${missing.length} interval explanations: ${missing.slice(0, 12).join(", ")}`,
  );
}

const statuses = Object.values(records).reduce((counts, record) => {
  counts[record.status] = (counts[record.status] ?? 0) + 1;
  return counts;
}, {});
const output = {
  method:
    "Every explanation was rewritten with GPT-class reasoning from the professor's transcript aligned to that exact visual interval. Repetition, false starts, and obvious recognition errors are removed; the slide or whiteboard image remains the authority for diagrams and notation.",
  notice:
    "These are clarified teaching explanations, not quotations. Open the source panel to check the professor's exact words and the uncorrected OCR.",
  coverage: {
    interval_count: evidenceFile.evidence.length,
    explanation_count: Object.keys(records).length,
    gpt_edited_count: Object.values(records).filter(
      (record) => record.method === "gpt_clarified_from_aligned_speech",
    ).length,
    statuses,
  },
  records,
};

await writeFile(
  new URL("slide-explanations.json", courseRoot),
  `${JSON.stringify(output, null, 2)}\n`,
);

console.log(JSON.stringify(output.coverage, null, 2));
