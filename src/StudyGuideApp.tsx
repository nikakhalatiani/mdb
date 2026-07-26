"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ExpandableImage } from "./ExpandableImage";
import { ExamPractice } from "./exam/ExamPractice";
import type { ExamBank } from "./exam/types";
import { ExerciseLabs } from "./exercises/ExerciseLabs";
import type {
  ExerciseLab,
  ExerciseLabCollection,
} from "./exercises/types";

type EvidenceFrame = {
  timestamp_s: number;
  timestamp: string;
  role: "initial" | "progress" | "final";
  image: string;
};

type Transcript = {
  text?: string;
  word_count?: number;
};

type Quote = {
  text: string;
  start: string;
  end: string;
  mean_word_confidence?: number | null;
};

type StudyNotes = {
  professor_explanation: string[];
  key_points?: string[];
  exam_focus?: string[];
  quotes?: Quote[];
};

type SlideExplanation = {
  method: string;
  status: "substantive" | "brief" | "transition" | "silent";
  explanation: string[];
  source_transcript_word_count: number;
  selected_sentence_count: number;
  ocr_warning: boolean;
};

type SlideExplanationCollection = {
  method: string;
  notice: string;
  coverage: {
    interval_count: number;
    explanation_count: number;
    gpt_edited_count: number;
    statuses: Record<string, number>;
  };
  records: Record<string, SlideExplanation>;
};

type VisualRecord = {
  occurrence_id: string;
  recording_id: string;
  sequence: number;
  canonical_slide_id: string;
  source_file: string;
  start_s: number;
  end_s: number;
  start: string;
  end: string;
  duration_s: number;
  title: string;
  screen_kind?: "slide" | "board_or_application";
  slide_number?: number | null;
  chapter_header?: string;
  slide_text_ocr?: string;
  initial_image: string;
  annotated_image: string;
  evidence_frames?: EvidenceFrame[];
  transcript?: Transcript;
  notes?: StudyNotes;
  study?: SlideExplanation;
};

type SourceRange = {
  recording_id: string;
  source_file: string;
  start_s: number;
  end_s: number;
  start: string;
  end: string;
  visual_interval_count: number;
};

type Chapter = {
  id: string;
  number: number;
  title: string;
  summary: string;
  objectives: string[];
  exam_checklist: string[];
  occurrence_ids: string[];
  sources: SourceRange[];
  stats: {
    visual_interval_count: number;
    slide_interval_count: number;
    board_interval_count: number;
    board_duration_s: number;
    board_evidence_frame_count: number;
    word_count: number;
  };
};

type ChapterStudyBrief = {
  core_idea: string[];
  mental_model: string[];
  exam_patterns: string[];
  common_mistakes: string[];
  self_test: string[];
};

type StudyBriefCollection = {
  method: string;
  notice: string;
  chapters: Record<string, ChapterStudyBrief>;
};

type CourseGuide = {
  title: string;
  subtitle: string;
  methodology: {
    visual_detection: string;
    board_capture: string;
    transcription: string;
    notes: string;
  };
  stats: {
    recording_count: number;
    duration_hours: number;
    chapter_count: number;
    visual_interval_count: number;
    slide_interval_count: number;
    board_interval_count: number;
    word_count: number;
  };
  chapters: Chapter[];
};

type LoadedGuide = {
  guide: CourseGuide;
  records: VisualRecord[];
  studyBriefs: StudyBriefCollection;
  slideExplanations: SlideExplanationCollection;
  examBank: ExamBank;
  exerciseLabs: ExerciseLabCollection;
};

type Filter = "all" | "slide" | "board";
type Mode = "lecture" | "exam" | "exercise";

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="10.75" cy="10.75" r="6.25" />
      <path d="m15.5 15.5 4 4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6.5 9 5.5 5.5L17.5 9" />
    </svg>
  );
}

const COURSE_ROOT = "./generated/course";
const SOURCE_ROOT = "file:///MDB_SOURCE_FILES";
const EMPTY_EXERCISE_LABS: ExerciseLabCollection = {
  generated_at: "",
  title: "Implementation Exercise Labs",
  warning: "Exercise lab data is temporarily unavailable.",
  methodology: [],
  labs: [],
};

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Missing generated study data: ${path}`);
  }
  return response.json() as Promise<T>;
}

async function loadGuide(): Promise<LoadedGuide> {
  const [
    guide,
    evidence,
    notes,
    studyBriefs,
    slideExplanations,
    examBank,
    exerciseLabs,
  ] =
    await Promise.all([
    loadJson<CourseGuide>(`${COURSE_ROOT}/chapters.json`),
    loadJson<{ evidence: VisualRecord[] }>(`${COURSE_ROOT}/evidence-index.json`),
    loadJson<{ records: Record<string, StudyNotes> }>(
      `${COURSE_ROOT}/notes.json`,
    ),
    loadJson<StudyBriefCollection>(`${COURSE_ROOT}/study-briefs.json`),
    loadJson<SlideExplanationCollection>(
      `${COURSE_ROOT}/slide-explanations.json`,
    ),
    loadJson<ExamBank>(`${COURSE_ROOT}/exam-practice.json`),
    loadJson<ExerciseLabCollection>(
      `${COURSE_ROOT}/exercise-labs.json`,
    ).catch(() => EMPTY_EXERCISE_LABS),
  ]);
  return {
    guide,
    records: evidence.evidence.map((record) => ({
      ...record,
      notes: notes.records[record.occurrence_id],
      study: slideExplanations.records[record.occurrence_id],
    })),
    studyBriefs,
    slideExplanations,
    examBank,
    exerciseLabs,
  };
}

function mediaFragment(sourceFile: string, start: number, end: number) {
  return `${SOURCE_ROOT}/${sourceFile}#t=${Math.floor(start)},${Math.ceil(end)}`;
}

function recordImage(path: string) {
  return `${COURSE_ROOT}/${path}`;
}

function recordKind(record: VisualRecord) {
  return record.screen_kind === "board_or_application" ? "board" : "slide";
}

function compactTimestamp(value: string) {
  return value.replace(/\.000$/, "");
}

function durationLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}

function VisualEvidence({ record }: { record: VisualRecord }) {
  const isBoard = recordKind(record) === "board";
  const frames = record.evidence_frames ?? [];
  const frameGallery = frames.map((frame) => ({
    alt: `${record.title}, ${frame.role} state at ${frame.timestamp}`,
    label: `${compactTimestamp(frame.timestamp)} · ${frame.role}`,
    src: recordImage(frame.image),
  }));

  if (isBoard && frames.length > 0) {
    return (
      <>
        <p className="atlas-evidence-label">
          Progressive full-board evidence · {frames.length} frames
        </p>
        <div className="atlas-frame-strip">
          {frames.map((frame, index) => (
            <figure
              className="atlas-frame"
              key={`${record.occurrence_id}-${frame.timestamp_s}`}
            >
              <ExpandableImage
                alt={`${record.title}, ${frame.role} state at ${frame.timestamp}`}
                gallery={frameGallery}
                initialIndex={index}
                loading="lazy"
                src={recordImage(frame.image)}
              />
              <figcaption>
                {compactTimestamp(frame.timestamp)} · {frame.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <p className="atlas-evidence-label">Completed annotation state</p>
      <ExpandableImage
        className="atlas-slide-image"
        alt={`${record.title}, final annotated state`}
        loading="lazy"
        src={recordImage(record.annotated_image)}
      />
    </>
  );
}

function RecordCard({
  record,
  localSources,
}: {
  record: VisualRecord;
  localSources: boolean;
}) {
  const isBoard = recordKind(record) === "board";
  const spoken = record.transcript?.text?.trim();
  const notes = record.notes;
  const study = record.study;
  return (
    <article className="atlas-card" id={record.occurrence_id} tabIndex={-1}>
      <header className="atlas-card-header">
        <div>
          <p className="atlas-card-index">
            {isBoard ? "Board interval" : `Slide ${record.slide_number ?? "—"}`}
            {" · "}
            {record.source_file}
          </p>
          <h3>{record.title}</h3>
        </div>
        {localSources ? (
          <a
            className="atlas-time-link"
            href={mediaFragment(record.source_file, record.start_s, record.end_s)}
            title={`Open ${record.source_file} at this interval`}
          >
            {compactTimestamp(record.start)}–{compactTimestamp(record.end)}
          </a>
        ) : (
          <span
            className="atlas-time-link"
            title={`Source: ${record.source_file}`}
          >
            {compactTimestamp(record.start)}–{compactTimestamp(record.end)}
          </span>
        )}
      </header>
      <div className="atlas-card-grid">
        <div className="atlas-visual">
          <VisualEvidence record={record} />
        </div>
        <div className="atlas-notes">
          <section
            className="atlas-note-block atlas-slide-teaching"
            data-status={study?.status ?? "silent"}
          >
            <div className="atlas-slide-teaching-header">
              <div>
                <p className="atlas-card-study-label">
                  {isBoard
                    ? "Teaching explanation · this whiteboard interval"
                    : "Teaching explanation · this slide"}
                </p>
                <h4>What the professor is explaining</h4>
              </div>
              <span className="atlas-coverage-badge">
                {study?.status === "transition"
                  ? "brief transition"
                  : study?.status === "silent"
                    ? "visual only"
                    : `${study?.source_transcript_word_count ?? 0} spoken words`}
              </span>
            </div>
            {(study?.explanation?.length
              ? study.explanation
              : [
                  "No clarified explanation is available for this interval yet. Open the source evidence below to inspect the aligned speech.",
                ]
            ).map((paragraph, index) => (
              <p key={`${record.occurrence_id}-study-${index}`}>{paragraph}</p>
            ))}
            <p className="atlas-synthesis-note">
              Clarified from the speech aligned to exactly{" "}
              {compactTimestamp(record.start)}–
              {compactTimestamp(record.end)}. Repetition and obvious
              transcription errors are removed; the visual remains the reference
              for diagrams and notation.
            </p>
          </section>
          <section className="atlas-note-block atlas-source-evidence">
            <details>
              <summary>
                Check the source · transcript, OCR, and evidence details
              </summary>
              <div className="atlas-source-evidence-body">
                <p className="atlas-source-warning">
                  This material is preserved for traceability. It can contain
                  speech repetition, incomplete sentences, and transcription
                  errors. Mathematical OCR can be especially unreliable: read
                  notation from the slide image, not from the OCR text.
                </p>
                <h4>Extractive transcript highlights</h4>
                {notes?.professor_explanation?.length ? (
                  notes.professor_explanation.map((paragraph, index) => (
                    <p key={`${record.occurrence_id}-explanation-${index}`}>
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p>
                    {spoken ||
                      "No spoken words were detected during this visual interval."}
                  </p>
                )}
                {notes?.quotes?.length ? (
                  <>
                    <h4>Timestamped quotation candidate</h4>
                    {notes.quotes.map((quote, index) => (
                      <blockquote
                        key={`${record.occurrence_id}-quote-${index}`}
                      >
                        <p>“{quote.text}”</p>
                        <cite>
                          {compactTimestamp(quote.start)}–
                          {compactTimestamp(quote.end)}
                          {quote.mean_word_confidence
                            ? ` · ${Math.round(quote.mean_word_confidence * 100)}% mean word confidence`
                            : ""}
                        </cite>
                      </blockquote>
                    ))}
                  </>
                ) : null}
                {spoken ? (
                  <>
                    <h4>
                      Full aligned transcript ·{" "}
                      {record.transcript?.word_count ?? 0} words
                    </h4>
                    <pre>{spoken}</pre>
                  </>
                ) : null}
                {record.slide_text_ocr ? (
                  <>
                    <h4>Printed slide OCR</h4>
                    <pre>{record.slide_text_ocr}</pre>
                  </>
                ) : null}
                <h4>Evidence status</h4>
                <p>
                  {isBoard
                    ? `The full drawing surface is preserved over ${durationLabel(record.duration_s)}; footer visibility is not required for detection.`
                    : "The final annotated frame is retained together with the initial state and exact recording interval."}
                </p>
              </div>
            </details>
          </section>
        </div>
      </div>
    </article>
  );
}

function ChapterOverview({
  chapter,
  examQuestionCount,
  relatedExercises,
  localSources,
  onOpenExam,
  onOpenExercise,
}: {
  chapter: Chapter;
  examQuestionCount: number;
  relatedExercises: ExerciseLab[];
  localSources: boolean;
  onOpenExam: () => void;
  onOpenExercise: (exerciseId: string) => void;
}) {
  return (
    <>
      <section className="atlas-hero">
        <div>
          <p className="atlas-kicker">
            Chapter {String(chapter.number).padStart(2, "0")} · semantic grouping
          </p>
          <h1>{chapter.title}</h1>
          <p className="atlas-hero-copy">{chapter.summary}</p>
          {examQuestionCount ? (
            <button
              className="atlas-exam-cta"
              onClick={onOpenExam}
              type="button"
            >
              Practice {examQuestionCount} recalled exam task
              {examQuestionCount === 1 ? "" : "s"} for this chapter →
            </button>
          ) : null}
          {relatedExercises.length ? (
            <div className="atlas-exercise-cta-group">
              <span>Build the concepts:</span>
              {relatedExercises.map((exercise) => (
                <button
                  key={exercise.id}
                  onClick={() => onOpenExercise(exercise.id)}
                  type="button"
                >
                  {exercise.title} →
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="atlas-hero-stats" aria-label="Chapter statistics">
          <div className="atlas-stat">
            <strong>{chapter.stats.visual_interval_count}</strong>
            <span>visual intervals</span>
          </div>
          <div className="atlas-stat">
            <strong>{chapter.stats.board_interval_count}</strong>
            <span>board intervals</span>
          </div>
          <div className="atlas-stat">
            <strong>{chapter.stats.word_count.toLocaleString()}</strong>
            <span>aligned words</span>
          </div>
          <div className="atlas-stat">
            <strong>{chapter.sources.length}</strong>
            <span>source files</span>
          </div>
        </div>
      </section>
      <section className="atlas-chapter-brief">
        <div>
          <h2>Learning objectives</h2>
          <ul>
            {chapter.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Exam checklist</h2>
          <ul>
            {chapter.exam_checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="atlas-source-list">
          <h2>Source intervals</h2>
          {chapter.sources.map((source) =>
            localSources ? (
              <a
                href={mediaFragment(
                  source.source_file,
                  source.start_s,
                  source.end_s,
                )}
                key={source.recording_id}
              >
                <strong>{source.source_file}</strong>
                <span>
                  {compactTimestamp(source.start)}–
                  {compactTimestamp(source.end)}
                </span>
              </a>
            ) : (
              <div className="atlas-source-entry" key={source.recording_id}>
                <strong>{source.source_file}</strong>
                <span>
                  {compactTimestamp(source.start)}–
                  {compactTimestamp(source.end)}
                </span>
              </div>
            ),
          )}
        </div>
      </section>
    </>
  );
}

function ChapterStudyGuide({
  brief,
  notice,
}: {
  brief: ChapterStudyBrief;
  notice: string;
}) {
  return (
    <section className="atlas-study-guide" aria-labelledby="study-guide-title">
      <header className="atlas-study-guide-header">
        <div>
          <p className="atlas-study-label">Chapter orientation</p>
          <h2 id="study-guide-title">Chapter roadmap</h2>
        </div>
        <p>
          Use this overview to see the chapter’s structure. The complete teaching
          sequence is below, where every slide and whiteboard interval has its own
          explanation derived from the speech at that timestamp. {notice}
        </p>
      </header>
      <div className="atlas-study-core">
        <h3>Chapter-level synthesis</h3>
        {brief.core_idea.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <div className="atlas-study-grid">
        <section>
          <h3>Mental model</h3>
          <ol>
            {brief.mental_model.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
        <section>
          <h3>How it appears on the exam</h3>
          <ul>
            {brief.exam_patterns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="atlas-study-mistakes">
          <h3>Common mistakes</h3>
          <ul>
            {brief.common_mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section className="atlas-study-test">
          <h3>Questions to answer after the teaching sequence</h3>
          <ol>
            {brief.self_test.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>
      </div>
    </section>
  );
}

export function StudyGuideApp() {
  const [loaded, setLoaded] = useState<LoadedGuide | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<Mode>("lecture");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [chapterId, setChapterId] = useState("");
  const [examChapterId, setExamChapterId] = useState("all");
  const [exerciseId, setExerciseId] = useState("");
  const [localSources, setLocalSources] = useState(false);
  const [pendingEvidenceId, setPendingEvidenceId] = useState("");
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    loadGuide()
      .then((data) => {
        if (!active) return;
        setLoaded(data);
        setChapterId(data.guide.chapters[0]?.id ?? "");
        setExerciseId(data.exerciseLabs.labs[0]?.id ?? "");
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load the generated course guide.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setLocalSources(
      window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1",
    );
  }, []);

  const chapter = loaded?.guide.chapters.find((item) => item.id === chapterId);
  const studyBrief = chapter
    ? loaded?.studyBriefs.chapters[chapter.id]
    : undefined;
  const examQuestionCountByChapter = useMemo(() => {
    const counts = new Map<string, number>();
    for (const question of loaded?.examBank.questions ?? []) {
      for (const id of question.chapter_ids) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [loaded]);
  const exercisesByChapter = useMemo(() => {
    const exercises = new Map<string, ExerciseLab[]>();
    for (const lab of loaded?.exerciseLabs.labs ?? []) {
      for (const id of lab.chapter_ids) {
        exercises.set(id, [...(exercises.get(id) ?? []), lab]);
      }
    }
    return exercises;
  }, [loaded]);
  const chapterRecords = useMemo(() => {
    if (!loaded || !chapter) return [];
    const byId = new Map(
      loaded.records.map((record) => [record.occurrence_id, record]),
    );
    return chapter.occurrence_ids
      .map((occurrenceId) => byId.get(occurrenceId))
      .filter((record): record is VisualRecord => Boolean(record));
  }, [chapter, loaded]);

  const records = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return chapterRecords.filter((record) => {
      const kind = recordKind(record);
      const matchesKind =
        filter === "all" ||
        (filter === "slide" && kind === "slide") ||
        (filter === "board" && kind === "board");
      if (!matchesKind) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        record.title,
        record.chapter_header,
        record.slide_text_ocr,
        record.transcript?.text,
        record.study?.explanation?.join(" "),
        record.notes?.professor_explanation?.join(" "),
        record.notes?.key_points?.join(" "),
        record.start,
        record.end,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [chapterRecords, filter, query]);

  useEffect(() => {
    if (mode !== "lecture" || !pendingEvidenceId) return;
    const target = document.getElementById(pendingEvidenceId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    target.focus({ preventScroll: true });
    setPendingEvidenceId("");
  }, [chapterId, loaded, mode, pendingEvidenceId]);

  function openEvidence(targetChapterId: string, occurrenceId: string) {
    setMode("lecture");
    setChapterId(targetChapterId);
    setQuery("");
    setFilter("all");
    setPendingEvidenceId(occurrenceId);
  }

  function focusMain() {
    window.requestAnimationFrame(() => {
      mainRef.current?.focus({ preventScroll: true });
    });
  }

  function openExercise(targetExerciseId: string) {
    setMode("exercise");
    setExerciseId(targetExerciseId);
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusMain();
  }

  return (
    <div className="atlas-shell">
      <header className="atlas-topbar">
        <div className="atlas-brand">
          <div className="atlas-mark">MDB</div>
          <div>
            <strong>Lecture Atlas</strong>
            <span>source-traceable study guide</span>
          </div>
        </div>
        <nav className="atlas-mode-switch" aria-label="Study mode">
          <button
            aria-pressed={mode === "lecture"}
            data-active={mode === "lecture"}
            onClick={() => {
              setMode("lecture");
              setQuery("");
              window.scrollTo({ top: 0, behavior: "smooth" });
              focusMain();
            }}
            type="button"
          >
            Lecture guide
          </button>
          <button
            aria-pressed={mode === "exam"}
            data-active={mode === "exam"}
            onClick={() => {
              setMode("exam");
              setQuery("");
              setExamChapterId(
                chapterId &&
                  (examQuestionCountByChapter.get(chapterId) ?? 0) > 0
                  ? chapterId
                  : "all",
              );
              window.scrollTo({ top: 0, behavior: "smooth" });
              focusMain();
            }}
            type="button"
          >
            Exam practice
          </button>
          <button
            aria-pressed={mode === "exercise"}
            data-active={mode === "exercise"}
            onClick={() =>
              openExercise(
                exerciseId || loaded?.exerciseLabs.labs[0]?.id || "",
              )
            }
            type="button"
          >
            Exercise labs
          </button>
        </nav>
        <label className="atlas-mobile-chapter">
          <span className="atlas-mobile-chapter-label">
            {mode === "exercise" ? "Exercise" : "Chapter"}
          </span>
          <span className="atlas-select-control">
            <select
              aria-label={
                mode === "exercise"
                  ? "Select implementation exercise"
                  : "Select course chapter"
              }
              onChange={(event) => {
                if (mode === "exam") {
                  setExamChapterId(event.target.value);
                } else if (mode === "exercise") {
                  openExercise(event.target.value);
                } else {
                  setChapterId(event.target.value);
                }
                if (mode !== "exercise") setQuery("");
              }}
              value={
                mode === "exam"
                  ? examChapterId
                  : mode === "exercise"
                    ? exerciseId
                    : chapterId
              }
            >
              {mode === "exercise" ? (
                (loaded?.exerciseLabs.labs ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {String(item.number).padStart(2, "0")} · {item.title}
                  </option>
                ))
              ) : (
                <>
                  {mode === "exam" ? (
                    <option value="all">All topics</option>
                  ) : null}
                  {(loaded?.guide.chapters ?? []).map((item) => (
                    <option key={item.id} value={item.id}>
                      {String(item.number).padStart(2, "0")} · {item.title}
                      {mode === "exam"
                        ? ` (${examQuestionCountByChapter.get(item.id) ?? 0})`
                        : ""}
                    </option>
                  ))}
                </>
              )}
            </select>
            <span className="atlas-select-icon">
              <ChevronDownIcon />
            </span>
          </span>
        </label>
        <label className="atlas-search">
          <span className="sr-only">
            {mode === "exam"
              ? "Search exam tasks"
              : mode === "exercise"
                ? "Search this exercise"
                : "Search this chapter"}
          </span>
          <span className="atlas-search-icon">
            <SearchIcon />
          </span>
          <input
            aria-label={
              mode === "exam"
                ? "Search exam practice questions"
                : mode === "exercise"
                  ? "Search exercise concepts, tests, decisions, and drills"
                : "Search slides, board work, teaching explanations, and transcript"
            }
            onChange={(event) => setQuery(event.target.value)}
            placeholder={
              mode === "exam"
                ? "Search recalled tasks and exercise drills…"
                : mode === "exercise"
                  ? "Search this exercise’s algorithms, tests, and exam drills…"
                : "Search this chapter’s slides and teaching explanations…"
            }
            type="search"
            value={query}
          />
        </label>
        <div className="atlas-processing">
          {loaded
            ? mode === "exam"
              ? `${loaded.examBank.questions.length} audited tasks`
              : mode === "exercise"
                ? `${loaded.exerciseLabs.labs.length} implementation labs`
              : `${loaded.guide.stats.recording_count} lectures · ${loaded.records.length} learning units`
            : "Loading evidence…"}
        </div>
      </header>

      <div className="atlas-layout">
        <aside className="atlas-sidebar">
          <p className="atlas-eyebrow">
            {mode === "exam"
              ? "Practice topics"
              : mode === "exercise"
                ? "Programming assignments"
                : "Course chapters"}
          </p>
          <h2>
            {mode === "exam"
              ? "Exam Practice Lab"
              : mode === "exercise"
                ? "Exercise Labs"
                : "Database Implementation"}
          </h2>
          <p className="atlas-sidebar-note">
            {loaded
              ? mode === "exam"
                ? "Past recollections, exact exercise drills, and lecture-checked answers."
                : mode === "exercise"
                  ? "Six audited implementations turned into algorithm and pseudocode practice."
                : `${loaded.guide.stats.duration_hours} hours grouped by concept, not by file.`
              : "Loading semantic chapter map…"}
          </p>
          <nav
            className="atlas-nav atlas-chapter-nav"
            aria-label={
              mode === "exercise"
                ? "Programming exercises"
                : "Course chapters"
            }
          >
            {mode === "exercise"
              ? (loaded?.exerciseLabs.labs ?? []).map((lab) => (
                  <button
                    aria-pressed={lab.id === exerciseId}
                    data-active={lab.id === exerciseId}
                    key={lab.id}
                    onClick={() => openExercise(lab.id)}
                    type="button"
                  >
                    <span className="atlas-nav-code">
                      {String(lab.number).padStart(2, "0")}
                    </span>
                    <span>{lab.title}</span>
                  </button>
                ))
              : null}
            {mode === "exam" ? (
              <button
                aria-pressed={examChapterId === "all"}
                data-active={examChapterId === "all"}
                onClick={() => {
                  setExamChapterId("all");
                  setQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                type="button"
              >
                <span className="atlas-nav-code">ALL</span>
                <span>All practice topics</span>
              </button>
            ) : null}
            {mode !== "exercise"
              ? (loaded?.guide.chapters ?? []).map((item) => (
              <button
                aria-pressed={
                  mode === "exam"
                    ? item.id === examChapterId
                    : item.id === chapterId
                }
                data-active={
                  mode === "exam"
                    ? item.id === examChapterId
                    : item.id === chapterId
                }
                key={item.id}
                onClick={() => {
                  if (mode === "exam") {
                    setExamChapterId(item.id);
                  } else {
                    setChapterId(item.id);
                  }
                  setQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                type="button"
              >
                <span className="atlas-nav-code">
                  {String(item.number).padStart(2, "0")}
                </span>
                <span>
                  {item.title}
                  {mode === "exam"
                    ? ` · ${examQuestionCountByChapter.get(item.id) ?? 0}`
                    : ""}
                </span>
              </button>
                ))
              : null}
          </nav>
        </aside>

        <main className="atlas-main" ref={mainRef} tabIndex={-1}>
          {mode === "exercise" && loaded ? (
            <ExerciseLabs
              chapters={loaded.guide.chapters}
              collection={loaded.exerciseLabs}
              evidence={loaded.records}
              exerciseId={exerciseId}
              onOpenEvidence={openEvidence}
              query={query}
            />
          ) : mode === "exam" && loaded ? (
            <ExamPractice
              bank={loaded.examBank}
              chapterId={examChapterId}
              chapters={loaded.guide.chapters}
              evidence={loaded.records}
              onOpenEvidence={openEvidence}
              query={query}
            />
          ) : (
            <>
          {chapter ? (
            <ChapterOverview
              chapter={chapter}
              examQuestionCount={
                examQuestionCountByChapter.get(chapter.id) ?? 0
              }
              relatedExercises={exercisesByChapter.get(chapter.id) ?? []}
              localSources={localSources}
              onOpenExam={() => {
                setExamChapterId(chapter.id);
                setMode("exam");
                setQuery("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onOpenExercise={openExercise}
            />
          ) : null}
          {studyBrief && loaded ? (
            <ChapterStudyGuide
              brief={studyBrief}
              notice={loaded.studyBriefs.notice}
            />
          ) : null}
          {chapter ? (
            <section className="atlas-method-note">
              <strong>How to study this chapter.</strong> Use the roadmap for
              orientation, then work through the teaching sequence below. Every
              visual interval now explains what the professor taught while that
              exact slide or board state was on screen. Raw transcript and OCR
              remain collapsed for source checking.
            </section>
          ) : null}
          <section className="atlas-evidence-heading">
            <div>
              <p className="atlas-study-label">Primary learning sequence</p>
              <h2>Slide-by-slide teaching guide</h2>
            </div>
            <p>
              Each card combines the exact visual with a clean explanation
              derived from the professor’s speech during that interval. Source
              transcript and OCR stay available inside the card for verification.
            </p>
          </section>
          <section className="atlas-controls" aria-label="Timeline filters">
            <div className="atlas-filter-group">
              {(
                [
                  ["all", "All learning units"],
                  ["slide", "Slides"],
                  ["board", "Board work"],
                ] as const
              ).map(([value, label]) => (
                <button
                  className="atlas-filter"
                  data-active={filter === value}
                  key={value}
                  onClick={() => setFilter(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="atlas-result-count">
              {records.length} matching interval{records.length === 1 ? "" : "s"}
            </span>
          </section>

          {error ? <p className="atlas-empty">{error}</p> : null}
          {!loaded && !error ? (
            <p className="atlas-loading">
              Loading 170,951 words of timestamped lecture evidence…
            </p>
          ) : null}
          {loaded && records.length === 0 ? (
            <p className="atlas-empty">
              No evidence matches this search and filter in the current chapter.
            </p>
          ) : null}
          <section className="atlas-timeline">
            {records.map((record) => (
              <RecordCard
                key={record.occurrence_id}
                localSources={localSources}
                record={record}
              />
            ))}
          </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
