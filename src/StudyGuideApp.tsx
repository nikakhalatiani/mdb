"use client";

import { useEffect, useMemo, useState } from "react";

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
};

type Filter = "all" | "slide" | "board";

const COURSE_ROOT = "./generated/course";
const SOURCE_ROOT = "file:///MDB_SOURCE_FILES";

async function loadJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Missing generated study data: ${path}`);
  }
  return response.json() as Promise<T>;
}

async function loadGuide(): Promise<LoadedGuide> {
  const [guide, evidence, notes, studyBriefs] = await Promise.all([
    loadJson<CourseGuide>(`${COURSE_ROOT}/chapters.json`),
    loadJson<{ evidence: VisualRecord[] }>(`${COURSE_ROOT}/evidence-index.json`),
    loadJson<{ records: Record<string, StudyNotes> }>(
      `${COURSE_ROOT}/notes.json`,
    ),
    loadJson<StudyBriefCollection>(`${COURSE_ROOT}/study-briefs.json`),
  ]);
  return {
    guide,
    records: evidence.evidence.map((record) => ({
      ...record,
      notes: notes.records[record.occurrence_id],
    })),
    studyBriefs,
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

  if (isBoard && frames.length > 0) {
    return (
      <>
        <p className="atlas-evidence-label">
          Progressive full-board evidence · {frames.length} frames
        </p>
        <div className="atlas-frame-strip">
          {frames.map((frame) => (
            <figure
              className="atlas-frame"
              key={`${record.occurrence_id}-${frame.timestamp_s}`}
            >
              <img
                alt={`${record.title}, ${frame.role} state at ${frame.timestamp}`}
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
      <img
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
  return (
    <article className="atlas-card" id={record.occurrence_id}>
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
          {notes?.key_points?.length ? (
            <section className="atlas-note-block">
              <h4>Slide facts and lecture cues</h4>
              <ul>
                {notes.key_points.map((point, index) => (
                  <li key={`${record.occurrence_id}-point-${index}`}>{point}</li>
                ))}
              </ul>
              <p className="atlas-study-hint">
                Use the chapter study synthesis above for the clean explanation;
                use this card to connect it to the professor’s exact visual.
              </p>
            </section>
          ) : (
            <section className="atlas-note-block">
              <h4>How to use this interval</h4>
              <p>
                Follow the visual state and timestamp as source evidence for the
                chapter explanation above.
              </p>
            </section>
          )}
          <section className="atlas-note-block atlas-source-evidence">
            <details>
              <summary>
                Lecture evidence · uncorrected transcript and OCR
              </summary>
              <div className="atlas-source-evidence-body">
                <p className="atlas-source-warning">
                  This material is preserved for traceability. It can contain
                  speech repetition, incomplete sentences, and transcription
                  errors; it is not the study explanation.
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
  localSources,
}: {
  chapter: Chapter;
  localSources: boolean;
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
          <p className="atlas-study-label">Primary learning resource</p>
          <h2 id="study-guide-title">Learn the chapter</h2>
        </div>
        <p>{notice}</p>
      </header>
      <div className="atlas-study-core">
        <h3>Clean study explanation</h3>
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
          <h3>Self-test before opening the evidence</h3>
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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [chapterId, setChapterId] = useState("");
  const [localSources, setLocalSources] = useState(false);

  useEffect(() => {
    let active = true;
    loadGuide()
      .then((data) => {
        if (!active) return;
        setLoaded(data);
        setChapterId(data.guide.chapters[0]?.id ?? "");
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
        <label className="atlas-mobile-chapter">
          <span>Chapter</span>
          <select
            aria-label="Select course chapter"
            onChange={(event) => {
              setChapterId(event.target.value);
              setQuery("");
            }}
            value={chapterId}
          >
            {(loaded?.guide.chapters ?? []).map((item) => (
              <option key={item.id} value={item.id}>
                {String(item.number).padStart(2, "0")} · {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="atlas-search">
          <span className="sr-only">Search this chapter</span>
          <input
            aria-label="Search slides, board work, and transcript"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search this chapter’s slides and spoken explanations…"
            type="search"
            value={query}
          />
        </label>
        <div className="atlas-processing">
          {loaded
            ? `${loaded.guide.stats.recording_count} lectures · audit passed`
            : "Loading evidence…"}
        </div>
      </header>

      <div className="atlas-layout">
        <aside className="atlas-sidebar">
          <p className="atlas-eyebrow">Course chapters</p>
          <h2>Database Implementation</h2>
          <p className="atlas-sidebar-note">
            {loaded
              ? `${loaded.guide.stats.duration_hours} hours grouped by concept, not by file.`
              : "Loading semantic chapter map…"}
          </p>
          <nav className="atlas-nav atlas-chapter-nav" aria-label="Course chapters">
            {(loaded?.guide.chapters ?? []).map((item) => (
              <button
                data-active={item.id === chapterId}
                key={item.id}
                onClick={() => {
                  setChapterId(item.id);
                  setQuery("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                type="button"
              >
                <span className="atlas-nav-code">
                  {String(item.number).padStart(2, "0")}
                </span>
                <span>{item.title}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="atlas-main">
          {chapter ? (
            <ChapterOverview
              chapter={chapter}
              localSources={localSources}
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
              <strong>How to use this page.</strong> Learn from the clean chapter
              synthesis first. Then use the slide and whiteboard timeline below
              as traceable evidence. Transcript selections remain uncorrected
              and are collapsed by default.
            </section>
          ) : null}
          <section className="atlas-evidence-heading">
            <div>
              <p className="atlas-study-label">Source-traceable appendix</p>
              <h2>Lecture evidence timeline</h2>
            </div>
            <p>
              Exact visuals, board progress, timestamps, transcript, and OCR for
              checking the study synthesis against the recording.
            </p>
          </section>
          <section className="atlas-controls" aria-label="Timeline filters">
            <div className="atlas-filter-group">
              {(
                [
                  ["all", "All evidence"],
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
        </main>
      </div>
    </div>
  );
}
