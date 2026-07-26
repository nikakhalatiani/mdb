import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const analysisRoot = path.join(projectRoot, "analysis", "lecture-2026");
const publicRoot = path.join(
  projectRoot,
  "public",
  "generated",
  "course",
  "2026",
);
const outputFile = path.join(
  projectRoot,
  "public",
  "generated",
  "course",
  "course-2026.json",
);

async function readJson(filename) {
  return JSON.parse(await readFile(path.join(analysisRoot, filename), "utf8"));
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function classificationLabel(value) {
  return value === "cosmetic/reordered" ? "unchanged" : value;
}

function countsFor(chapter) {
  const counts = new Map();
  for (const page of chapter.pages) {
    const classification = classificationLabel(page.classification);
    counts.set(classification, (counts.get(classification) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

async function preserveAsset(source, target) {
  await mkdir(path.dirname(target), { recursive: true });
  if (existsSync(source)) {
    await copyFile(source, target);
    return;
  }
  if (!existsSync(target)) {
    throw new Error(`Missing 2026 visual source and target: ${source}`);
  }
}

function chapterDeck({
  audit,
  chapterId,
  number,
  title,
  subtitle,
  chapterIds,
  status,
  statusLabel,
  verdict,
  confidenceNote,
  studyTreatment,
  findings,
  coverageBasis = "printed_comparison",
}) {
  const chapter = audit.chapters.find((item) => item.chapter_id === chapterId);
  if (!chapter) throw new Error(`Missing audit chapter ${chapterId}`);
  return {
    id: chapterId,
    number,
    title,
    subtitle,
    source_file: path.basename(chapter.pdf),
    source_year: 2026,
    physical_page_count: chapter.physical_page_count,
    logical_slide_count: chapter.printed_deck_slide_count,
    chapter_ids: chapterIds,
    status,
    status_label: statusLabel,
    coverage_basis: coverageBasis,
    official_exam_scope: "unknown",
    verdict,
    confidence_note: confidenceNote,
    study_treatment: studyTreatment,
    findings: findings(countsFor(chapter), chapter),
    annotations: [],
    slides: [],
  };
}

function findPrintedSlidePage(pages, logicalSlide) {
  return pages.find((page) => {
    if (!page.printed_page) return false;
    const parsed = Number.parseInt(String(page.printed_page).split("/")[0], 10);
    return parsed === logicalSlide;
  });
}

async function supplementSlides(deck, auditDeck) {
  const slides = [];
  for (const slide of deck.logical_slides) {
    const logicalSlide = slide.logical_slide;
    const physicalPage = Math.max(...slide.source_pdf_pages);
    const sourceImage = path.join(
      projectRoot,
      "tmp",
      "pdfs",
      "lecture-2026",
      deck.id,
      `page-${pad(physicalPage)}.png`,
    );
    const targetImage = path.join(
      publicRoot,
      deck.id,
      `slide-${pad(logicalSlide)}.png`,
    );
    await preserveAsset(sourceImage, targetImage);

    const auditPage = auditDeck
      ? findPrintedSlidePage(auditDeck.pages, logicalSlide)
      : undefined;
    const baselineOccurrenceIds =
      auditPage?.exact_2021_occurrence_ids ?? [];
    let classification = "new";
    if (deck.id === "chapter8") {
      classification =
        logicalSlide >= 26
          ? "new"
          : baselineOccurrenceIds.length
            ? "unchanged"
            : "coverage_gap";
    } else if (deck.id === "qsort") {
      classification = "supplementary";
    }

    const sourceNote =
      deck.id === "qsort"
        ? "Standalone Thomas Neumann deck dated May 28, 2020. It is not present in the captured 2021 lecture corpus; that does not make it new in 2026."
        : classification === "new"
          ? "Printed 2026 slide beyond the old 375-slide deck boundary."
          : classification === "coverage_gap"
            ? "Printed 2026 slide. Its old deck position is known, but no 2021 visual or professor explanation was captured for it."
            : "Printed 2026 slide with an exact visual match in the 2021 recording evidence.";
    const handwriting = slide.handwritten_note_treatment;

    slides.push({
      id: `current-${deck.id}-${pad(logicalSlide)}`,
      deck_slide: logicalSlide,
      chapter_id:
        deck.id === "chapter8"
          ? "17-parallel-query-execution"
          : "15-sort-group-and-set-operations",
      pdf_pages: slide.source_pdf_pages,
      title: slide.title,
      image: `./generated/course/2026/${deck.id}/slide-${pad(logicalSlide)}.png`,
      image_alt: `${deck.title}, slide ${logicalSlide}: ${slide.title}`,
      classification,
      content_layer: "printed",
      comparison_basis:
        deck.id === "qsort"
          ? "standalone 2020 supplement not present in the captured 2021 corpus"
          : classification === "new"
            ? "printed beyond the old deck boundary"
            : classification === "coverage_gap"
              ? "old deck position known but no captured 2021 teaching"
              : "exact captured 2021 visual match",
      source_note: sourceNote,
      baseline_occurrence_ids: baselineOccurrenceIds,
      explanation: slide.teaching_explanation,
      key_points: slide.key_points,
      exam_signal:
        deck.id === "chapter8"
          ? {
              points: [
                `Be able to explain ${slide.title.toLowerCase()} without relying on the diagram alone.`,
              ],
              evidence_basis:
                "user-reported full 2026 teaching coverage; no supplied official exam-weighting statement",
              official_scope: "unknown",
            }
          : {
              points: [
                "Prioritize the conceptual progression before memorizing code or benchmark numbers.",
                `Connect ${slide.title.toLowerCase()} to sorting, code generation, and CPU-level cost.`,
              ],
              evidence_basis:
                "standalone supplied deck; no current exam-scope statement supplied",
              official_scope: "unknown",
            },
      self_test: slide.review_prompts,
      handwritten_note: handwriting?.present
        ? `${handwriting.summary} ${handwriting.display}`
        : undefined,
    });
  }
  return slides;
}

async function attachEarlySupplements(decks, supplements) {
  for (const item of supplements.items) {
    const deckId = item.deck_id.split("_")[0];
    const deck = decks.find((candidate) => candidate.id === deckId);
    if (!deck) throw new Error(`Missing target deck for ${item.id}`);
    const sourceImage = path.join(projectRoot, item.image_source_paths[0]);
    const targetImage = path.join(publicRoot, deckId, `${item.id}.png`);
    await preserveAsset(sourceImage, targetImage);
    const handwritten = item.handwritten_note_treatment;
    const handwrittenView = item.classification === "useful-handwritten-teaching-view";
    const contentLayer =
      item.printed_slide_number == null
        ? "handwriting"
        : handwrittenView
          ? "annotated_printed"
          : "printed";
    deck.slides.push({
      id: `current-${item.id}`,
      deck_slide: item.printed_slide_number,
      chapter_id: item.intended_existing_site_chapter_id,
      pdf_pages: item.source_pdf_physical_pages,
      title: item.teaching_view_title,
      image: `./generated/course/2026/${deckId}/${item.id}.png`,
      image_alt: `${item.teaching_view_title}, 2026 PDF page ${item.source_pdf_physical_pages.join(", ")}`,
      classification:
        handwrittenView
          ? "annotation"
          : item.classification === "coverage-gap"
            ? "coverage_gap"
            : "unchanged",
      content_layer: contentLayer,
      comparison_basis:
        contentLayer === "handwriting"
          ? "handwriting-only teaching view; no printed curriculum claim"
          : contentLayer === "annotated_printed"
            ? "unchanged printed slide with separately identified handwriting"
            : item.coverage_interpretation,
      source_note: item.coverage_interpretation,
      baseline_occurrence_ids: [
        ...new Set([
          ...item.exact_baseline_occurrence_ids,
          ...(item.related_2021_speech_occurrence_ids ?? []),
        ]),
      ],
      explanation: item.teaching_explanation,
      key_points: item.key_points,
      exam_signal: {
        points: [
          item.exam_focus.rationale,
          `Study priority: ${item.exam_focus.priority}.`,
        ],
        evidence_basis: item.exam_focus.status.replaceAll("-", " "),
        official_scope: "unknown",
      },
      self_test: [item.self_test.prompt],
      handwritten_note: handwritten.include
        ? handwritten.display_note
        : undefined,
    });
  }
  for (const deck of decks) {
    deck.slides.sort(
      (left, right) =>
        (left.deck_slide ?? left.pdf_pages[0]) -
          (right.deck_slide ?? right.pdf_pages[0]) ||
        left.pdf_pages[0] - right.pdf_pages[0],
    );
  }
}

async function annotationCards(audit, deckId) {
  const annotations = [];
  for (const annotation of audit.handwriting_catalog.filter(
    (item) => item.deck_id === deckId,
  )) {
    const sourceImage = path.join(
      projectRoot,
      "tmp",
      "pdfs",
      "lecture-2026",
      deckId,
      `page-${pad(annotation.pdf_page)}.png`,
    );
    const targetImage = path.join(
      publicRoot,
      deckId,
      `annotation-${pad(annotation.pdf_page)}.png`,
    );
    await preserveAsset(sourceImage, targetImage);
    annotations.push({
      pdf_page: annotation.pdf_page,
      description: annotation.description,
      interpretation: annotation.interpretation,
      study_value:
        annotation.interpretation.toLowerCase().includes("session") ||
        annotation.interpretation.toLowerCase().includes("incidental")
          ? "incidental"
          : "useful",
      image: `./generated/course/2026/${deckId}/annotation-${pad(annotation.pdf_page)}.png`,
    });
  }
  return annotations;
}

const audit13 = await readJson("chapters-1-3.json");
const supplement13 = await readJson("supplements-1-3.json");
const supplement4 = await readJson("supplements-chapter4.json");
const audit56 = await readJson("chapters-5-6.json");
const supplement56 = await readJson("supplements-5-6.json");
const audit78 = await readJson("chapters-7-8-qsort.json");
const supplement78 = await readJson("supplements-8-qsort.json");

const decks = [
  chapterDeck({
    audit: audit13,
    chapterId: "chapter1",
    number: 1,
    title: "Introduction and Relational Foundations",
    subtitle:
      "The 2026 printed introduction is stable. Extra PDF pages are progressive reveal states and handwritten teaching layers, not new curriculum.",
    chapterIds: ["01-foundations-and-relational-model"],
    status: "verified_unchanged",
    statusLabel: "Printed content unchanged",
    verdict: "Keep the 2021 per-slide teaching sequence.",
    confidenceNote:
      "All 19 logical printed slides have exact 2021 visual matches.",
    studyTreatment: [
      "Use the existing 2021 speech-derived explanations as the primary teaching source.",
      "Treat the four extra physical PDF pages as progressive states of existing slides.",
      "Keep handwriting visibly labeled as annotation rather than printed material.",
    ],
    findings: (_counts, chapter) => [
      {
        title: "Nineteen printed slides match",
        detail:
          "Every logical 2026 slide has exact captured 2021 evidence, so no duplicate current-year sequence is needed.",
        classification: "unchanged",
        confidence: "high",
      },
      {
        title: "Four extra pages are build states",
        detail: `${chapter.printed_deck_slide_count} logical printed slides are stable across ${chapter.physical_page_count} physical PDF pages; the four additional pages are progressive or annotated states, not new printed curriculum.`,
        classification: "unchanged",
        confidence: "high",
      },
    ],
  }),
  chapterDeck({
    audit: audit13,
    chapterId: "chapter2",
    number: 2,
    title: "Storage",
    subtitle:
      "Storage architecture, memory hierarchy, buffering, segments, and update strategies retain the same printed 2026 content.",
    chapterIds: [
      "02-storage-architecture-and-memory-hierarchy",
      "03-buffer-management",
      "04-segments-space-and-update-strategies",
    ],
    status: "verified_unchanged",
    statusLabel: "All 36 slides unchanged",
    verdict: "The 2021 explanations remain current for this deck.",
    confidenceNote:
      "Every 2026 storage slide has exact 2021 visual evidence.",
    studyTreatment: [
      "Continue using the existing chapter 2–4 learning cards.",
      "Use the cleaner PDF only as an alternate visual when a recording frame is hard to read.",
      "Do not duplicate unchanged slides or imply a syllabus change.",
    ],
    findings: () => [
      {
        title: "Complete printed match",
        detail:
          "All 36 current printed slides map to captured 2021 occurrences.",
        classification: "unchanged",
        confidence: "high",
      },
    ],
  }),
  chapterDeck({
    audit: audit13,
    chapterId: "chapter3",
    number: 3,
    title: "Access Paths",
    subtitle:
      "Most tuple, B+-tree, and extendible-hashing material remains stable, while the current deck continues into FSST and additional specialized access methods that the old recordings did not capture.",
    chapterIds: [
      "05-slotted-pages-and-record-layout",
      "06-compression-and-long-records",
      "07-btree-fundamentals-and-operations",
      "08-advanced-btree-techniques",
      "09-hash-and-specialized-indexes",
    ],
    status: "mixed",
    statusLabel: "19 printed slides not captured in 2021",
    verdict: "Reuse matched teaching cards and add only the uncovered 2026 continuation.",
    confidenceNote:
      "The audit found 63 exact printed matches, one build state, 19 uncaptured printed slides, and two handwriting-only pages.",
    studyTreatment: [
      "Keep existing explanations for matched slotted-page, B+-tree, and hashing slides.",
      "Add fresh slide-level teaching for FSST and pages 68–85 without inventing professor speech.",
      "Treat the two handwriting-only pages as optional board-note evidence, not printed curriculum changes.",
    ],
    findings: () => [
      {
        title: "FSST compression appears in the current deck",
        detail:
          "PDF page 23 introduces FSST string compression and has no exact captured 2021 slide occurrence.",
        classification: "coverage_gap",
        confidence: "medium",
        pdf_pages: [23],
      },
      {
        title: "Specialized access-method continuation",
        detail:
          "PDF pages 68–85 cover linear hashing, multi-level extendible hashing, bitmap indexes, small materialized aggregates, and multi-dimensional indexing beyond the captured old sequence.",
        classification: "coverage_gap",
        confidence: "medium",
        pdf_pages: Array.from({ length: 18 }, (_, index) => index + 68),
      },
      {
        title: "Two handwriting-only teaching pages",
        detail:
          "Pages 58 and 59 contain hashing and string-search board notes. They can supplement learning but cannot establish a printed curriculum change.",
        classification: "uncertain",
        confidence: "medium",
        pdf_pages: [58, 59],
      },
    ],
  }),
];

await attachEarlySupplements(decks, supplement13);

decks.splice(3, 0, {
  id: "chapter4",
  number: 4,
  title: "Transactions and Recovery",
  subtitle:
    "The 119-slide printed sequence shows no credible curriculum change. Seventy slides lack captured 2021 visuals because two recording spans are missing, so they are treated as coverage gaps rather than new material.",
  source_file: "chapter4_260717_153133.pdf",
  source_year: 2026,
  physical_page_count: 119,
  logical_slide_count: 119,
  chapter_ids: [
    "10-transaction-foundations",
    "11-recovery-and-aries",
  ],
  status: "mixed",
  status_label: "70 printed slides not captured in 2021",
  coverage_basis: "printed_comparison",
  official_exam_scope: "unknown",
  verdict:
    "Reuse the 49 exact recording matches and fill the missing capture span from the printed source.",
  confidence_note:
    "The audit found 49 exact captured visual matches, 70 recording-coverage gaps, no useful handwriting, and no credible printed curriculum additions.",
  study_treatment: [
    "Keep existing speech-derived teaching cards wherever an exact 2021 visual occurrence exists.",
    "Add printed-source study cards for the missing transaction/scheduler span without inventing professor speech.",
    "Treat Dirty Read and Checkpoints (3) as visual capture gaps even though related 2021 speech exists.",
    "Keep official exam scope unknown; use protocols only to prioritize practice.",
  ],
  findings: [
    {
      title: "Forty-nine exact captured matches",
      detail:
        "Slides around the start of transactions and the recovery/ARIES continuation have exact 2021 visual occurrences.",
      classification: "unchanged",
      confidence: "high",
    },
    {
      title: "Seventy recording-coverage gaps",
      detail:
        "PDF page 10, pages 14–81, and page 116 lack exact captured 2021 visuals. The large middle span corresponds to missing recordings, not a proven curriculum addition.",
      classification: "coverage_gap",
      confidence: "high",
      pdf_pages: [10, ...Array.from({ length: 68 }, (_, index) => index + 14), 116],
    },
    {
      title: "No credible printed curriculum addition",
      detail:
        "Sequence, global slide positions, surrounding exact matches, and related speech support continuity with the old course; handwriting was not found in this deck.",
      classification: "unchanged",
      confidence: "high",
    },
  ],
  annotations: [],
  slides: [],
});

await attachEarlySupplements(decks, supplement4);

decks.push(
  chapterDeck({
    audit: audit56,
    chapterId: "chapter5",
    number: 5,
    title: "Set-Oriented Query Processing",
    subtitle:
      "All 34 printed slides remain stable against the captured 2021 sequence. Five handwritten views clarify iterator and blockwise execution state.",
    chapterIds: [
      "12-set-oriented-execution-models",
      "13-pipelining-and-parallelization",
    ],
    status: "verified_unchanged",
    statusLabel: "All 34 printed slides unchanged",
    verdict: "Keep the 2021 teaching sequence and add only useful annotations.",
    confidenceNote:
      "All printed pages map to captured 2021 occurrences in global slide positions 255–288.",
    studyTreatment: [
      "Reuse the existing speech-derived explanations for every printed slide.",
      "Add five annotated study views for iterator state, blockwise compaction, and cross-product state.",
      "Prioritize iterator/push tracing and pipeline boundaries for practice without presenting them as guaranteed exam scope.",
    ],
    findings: () => [
      {
        title: "Complete printed match",
        detail:
          "All 34 printed slides map to the captured 2021 set-oriented and operator recordings.",
        classification: "unchanged",
        confidence: "high",
      },
      {
        title: "Five useful annotated views",
        detail:
          "Pages 16, 17, 19, 20, and 22 add handwriting that clarifies iterator or blockwise runtime state; it remains separate from printed curriculum.",
        classification: "annotation",
        confidence: "high",
        pdf_pages: [16, 17, 19, 20, 22],
      },
    ],
  }),
  chapterDeck({
    audit: audit56,
    chapterId: "chapter6",
    number: 6,
    title: "Algebraic Operators",
    subtitle:
      "All 38 printed operator slides remain stable against the captured 2021 sequence. Two handwritten views clarify external hash-join phases.",
    chapterIds: [
      "14-relational-operators-and-joins",
      "15-sort-group-and-set-operations",
    ],
    status: "verified_unchanged",
    statusLabel: "All 38 printed slides unchanged",
    verdict: "Keep the 2021 teaching sequence and add two hash-join annotations.",
    confidenceNote:
      "All printed pages map to captured 2021 occurrences in global slide positions 289–326.",
    studyTreatment: [
      "Reuse the existing speech-derived explanations for scans, joins, sort, grouping, and set operations.",
      "Add two annotated study views for external hash-join partitioning and right-side streaming.",
      "Use past recollections only to prioritize non-inner join and aggregation drills, not to assert official scope.",
    ],
    findings: () => [
      {
        title: "Complete printed match",
        detail:
          "All 38 printed slides map to the captured 2021 operator and code-generation recordings.",
        classification: "unchanged",
        confidence: "high",
      },
      {
        title: "Two useful annotated views",
        detail:
          "Pages 15 and 18 add handwritten phase diagrams for external hash join; the printed slides themselves are unchanged.",
        classification: "annotation",
        confidence: "high",
        pdf_pages: [15, 18],
      },
    ],
  }),
);

await attachEarlySupplements(decks, supplement56);

const auditChapter7 = audit78.decks.find((deck) => deck.id === "chapter7");
const auditChapter8 = audit78.decks.find((deck) => deck.id === "chapter8");
const chapter8Study = supplement78.decks.find((deck) => deck.id === "chapter8");
const qsortStudy = supplement78.decks.find((deck) => deck.id === "qsort");

decks.push({
  id: "chapter7",
  number: 7,
  title: "Code Generation and Parallel Query Execution",
  subtitle:
    "Every printed 2026 slide has an exact 2021 occurrence; two pages add handwriting over otherwise unchanged visuals.",
  source_file: "chapter7_260717_153118.pdf",
  source_year: 2026,
  physical_page_count: 24,
  logical_slide_count: 24,
  chapter_ids: ["16-query-compilation", "17-parallel-query-execution"],
  status: "verified_unchanged",
  status_label: "All 24 slides unchanged",
  coverage_basis: "printed_comparison",
  official_exam_scope: "unknown",
  verdict: "Keep the existing speech-derived teaching cards.",
  confidence_note:
    "The audit visually confirmed exact 2021 occurrences for every page.",
  study_treatment: [
    "Reuse the complete 2021 explanations and timestamps.",
    "Offer pages 16 and 22 only as optional annotated current-year views.",
    "Do not duplicate the full current deck.",
  ],
  findings: [
    {
      title: "Complete exact match",
      detail:
        "Pages 1–13 map to query compilation and pages 14–24 map to parallel query execution without printed changes.",
      classification: "unchanged",
      confidence: "high",
    },
  ],
  annotations: await annotationCards(audit78, "chapter7"),
  slides: [],
});

decks.push({
  id: "chapter8",
  number: 8,
  title: "Main-Memory Databases",
  subtitle:
    "The old recording stopped before teaching this section. The user reports that all 29 logical slides were covered in 2026, so the historical non-exam label is no longer a valid current-course instruction.",
  source_file: "chapter8_260717_153116.pdf",
  source_year: 2026,
  physical_page_count: 33,
  logical_slide_count: 29,
  chapter_ids: ["17-parallel-query-execution"],
  status: "user_reported_covered",
  status_label: "Fully covered in 2026 · user report",
  coverage_basis: "user_report",
  official_exam_scope: "unknown",
  verdict: "Add a full current-year supplement after chapter 17.",
  confidence_note:
    "Coverage status comes from the user's direct report. The supplied files contain no official statement guaranteeing exam weighting.",
  study_treatment: [
    "Replace the stale 2021 non-exam message with a historical-status warning.",
    "Teach all 29 logical slides from the current printed source.",
    "Consolidate the five HyPer snapshot animation pages into one navigable logical slide.",
    "Mark Data Blocks slides 26–29 as definitively new relative to the old 375-slide deck.",
  ],
  findings: [
    {
      title: "Historical 2021 exclusion is stale",
      detail:
        "The 2021 professor stopped before this section and called it non-examinable then; the user reports full 2026 teaching coverage.",
      classification: "uncertain",
      confidence: "medium",
      occurrence_ids: ["dbimpl-13-codegen-051", "dbimpl-13-codegen-054"],
    },
    {
      title: "Twenty-one old-deck positions lack captured teaching",
      detail:
        "Slides 1–25 structurally occupied the old deck, but only logical slides 1, 2, 3, and 7 have exact recorded visual occurrences.",
      classification: "coverage_gap",
      confidence: "high",
    },
    {
      title: "Data Blocks is genuinely new",
      detail:
        "Logical slides 26–29 sit beyond the old 375-slide deck and cover compressed data blocks, scan modes, layout metadata, and vectorized evaluation.",
      classification: "new",
      confidence: "high",
      pdf_pages: [30, 31, 32, 33],
    },
  ],
  annotations: await annotationCards(audit78, "chapter8"),
  slides: await supplementSlides(chapter8Study, auditChapter8),
});

decks.push({
  id: "qsort",
  number: 9,
  title: "3-Way QuickSort in Umbra",
  subtitle:
    "A standalone Thomas Neumann deep dive, dated 2020, connects runtime-generated comparison logic with three-way quicksort and CPU behavior.",
  source_file: "qsort_260717_153127.pdf",
  source_year: 2020,
  physical_page_count: 22,
  logical_slide_count: 22,
  chapter_ids: [
    "15-sort-group-and-set-operations",
    "16-query-compilation",
  ],
  status: "supplementary",
  status_label: "Supplementary · exam status unconfirmed",
  coverage_basis: "supplement",
  official_exam_scope: "unknown",
  verdict: "Add as an optional deep dive, not silent core material.",
  confidence_note:
    "No exact 2021 occurrence exists. The deck itself is dated 2020, and no supplied instructor statement establishes current exam scope.",
  study_treatment: [
    "Teach the conceptual progression before the C++ listings and disassembly.",
    "Present benchmark values as measurements from this deck, not universal guarantees.",
    "Cross-link sorting with query compilation and modern CPU cost.",
  ],
  findings: [
    {
      title: "New to the recorded-course corpus",
      detail:
        "No 2021 occurrence covers generated quicksort, equal-key partitioning, Bentley–McIlroy, Hoare/lazy partitioning, or branch-free Lomuto.",
      classification: "supplementary",
      confidence: "high",
    },
    {
      title: "Not newly authored in 2026",
      detail:
        "The title page dates the standalone Umbra deck to May 28, 2020.",
      classification: "uncertain",
      confidence: "high",
      pdf_pages: [1],
    },
  ],
  annotations: [],
  slides: await supplementSlides(qsortStudy, undefined),
});

const payload = {
  generated_at: "2026-07-26",
  title: "2026 Course Update",
  warning:
    "Printed source content, captured 2021 professor speech, and handwritten annotations of unverified authorship are separate evidence layers. Handwriting is never treated as a printed curriculum change, and no professor speech is invented for uncaptured current slides.",
  baseline_note:
    "“New” means new relative to the captured 2021 corpus or, where the old deck boundary proves it, new relative to the old deck. A missing 2021 recording is labeled as a coverage gap rather than silently treated as a change.",
  methodology: [
    "Rendered every supplied PDF page and inspected it visually.",
    "Used the PDF text layer to compare printed content without flattened handwriting.",
    "Required exact occurrence IDs for claims of unchanged captured material.",
    "Separated current-course coverage reports from official exam guarantees.",
  ],
  decks,
};

await mkdir(path.dirname(outputFile), { recursive: true });
await writeFile(outputFile, `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `Wrote ${decks.length} audited 2026 decks and ${decks.reduce(
    (total, deck) => total + deck.slides.length,
    0,
  )} current study slides to ${outputFile}`,
);
