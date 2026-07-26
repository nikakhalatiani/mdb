import { useEffect, useMemo, useState } from "react";

import { ExpandableImage } from "../ExpandableImage";
import type {
  ExamBank,
  ExamChapterRef,
  ExamEvidenceRef,
  ExamQuestion,
  ExamSourceKind,
  ExamVerification,
} from "./types";
import { useExamProgress } from "./useExamProgress";

type PracticeFilter =
  | "all"
  | "high_priority"
  | "exact_exercise"
  | "needs_review"
  | "coverage_gap";

type ExamPracticeProps = {
  bank: ExamBank;
  chapters: ExamChapterRef[];
  chapterId: string;
  evidence: ExamEvidenceRef[];
  query: string;
  onOpenEvidence: (chapterId: string, occurrenceId: string) => void;
};

const verificationLabels: Record<ExamVerification, string> = {
  verified: "Lecture-checked",
  corrected: "Corrected from protocol",
  incomplete: "Partial recollection",
  unsupported: "Lecture coverage gap",
  not_answerable: "Missing exact artifact",
};

const sourceLabels: Record<ExamSourceKind, string> = {
  compiled_protocol: "Compiled protocol",
  student_recollection: "Student recollection",
  exercise: "Exact exercise task",
};

const COURSE_ROOT = "./generated/course";

function sourcePageLabel(pages?: number[]) {
  if (!pages?.length) return "";
  return ` · p. ${pages.join(", ")}`;
}

function questionMatchesFilter(
  question: ExamQuestion,
  filter: PracticeFilter,
  progressStatus: string,
) {
  if (filter === "all") return true;
  if (filter === "high_priority") return question.priority === "high";
  if (filter === "exact_exercise") {
    return question.sources.some((source) => source.kind === "exercise");
  }
  if (filter === "needs_review") {
    return progressStatus === "needs_review" || progressStatus === "unseen";
  }
  return (
    question.verification === "unsupported" ||
    question.verification === "not_answerable"
  );
}

function practiceRank(question: ExamQuestion) {
  if (question.sources.some((source) => source.kind === "exercise")) return 0;
  if (
    question.priority === "high" &&
    question.verification !== "unsupported" &&
    question.verification !== "not_answerable"
  ) {
    return 1;
  }
  if (
    question.verification === "verified" ||
    question.verification === "corrected"
  ) {
    return 2;
  }
  if (question.verification === "incomplete") return 3;
  return 4;
}

function PipelineExample({
  example,
}: {
  example: NonNullable<ExamQuestion["worked_example"]>;
}) {
  return (
    <section className="exam-pipeline-example">
      <div>
        <p className="exam-section-label">Worked visual</p>
        <h4>{example.title}</h4>
      </div>
      <div className="exam-pipeline-groups">
        {example.groups.map((group) => (
          <div
            className="exam-pipeline-group"
            data-tone={group.tone}
            key={group.label}
          >
            <strong>{group.label}</strong>
            <ol>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="exam-pipeline-note">{example.note}</p>
    </section>
  );
}

export function ExamPractice({
  bank,
  chapters,
  chapterId,
  evidence,
  query,
  onOpenEvidence,
}: ExamPracticeProps) {
  const [filter, setFilter] = useState<PracticeFilter>("all");
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedQuestionId, setRevealedQuestionId] = useState<string | null>(
    null,
  );
  const questionIds = useMemo(
    () => bank.questions.map((question) => question.id),
    [bank.questions],
  );
  const { itemFor, progress, rate, updateScratchpad } =
    useExamProgress(questionIds);
  const evidenceById = useMemo(
    () =>
      new Map(evidence.map((record) => [record.occurrence_id, record] as const)),
    [evidence],
  );
  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter] as const)),
    [chapters],
  );

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bank.questions
      .filter((question) => {
        if (
          chapterId !== "all" &&
          !question.chapter_ids.includes(chapterId)
        ) {
          return false;
        }
        if (
          !questionMatchesFilter(
            question,
            filter,
            progress[question.id]?.status ?? "unseen",
          )
        ) {
          return false;
        }
        if (!normalizedQuery) return true;
        const haystack = [
          question.topic,
          question.prompt,
          question.format,
          question.sources.map((source) => source.label).join(" "),
          question.signals?.join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .sort((left, right) => practiceRank(left) - practiceRank(right));
  }, [bank.questions, chapterId, filter, progress, query]);

  useEffect(() => {
    setActiveIndex(0);
    setRevealedQuestionId(null);
  }, [chapterId, filter, query]);

  const activeQuestion = filteredQuestions[activeIndex] ?? null;
  const activeProgress = activeQuestion ? itemFor(activeQuestion.id) : null;
  const isRevealed =
    activeQuestion?.id === revealedQuestionId && Boolean(activeQuestion);
  const solidCount = Object.values(progress).filter(
    (item) => item.status === "solid",
  ).length;
  const reviewCount = Object.values(progress).filter(
    (item) => item.status === "needs_review",
  ).length;
  const highPriorityCount = bank.questions.filter(
    (question) => question.priority === "high",
  ).length;
  const exactExerciseCount = bank.questions.filter((question) =>
    question.sources.some((source) => source.kind === "exercise"),
  ).length;

  function move(delta: number) {
    if (!filteredQuestions.length) return;
    setActiveIndex((current) => {
      const next = current + delta;
      if (next < 0) return filteredQuestions.length - 1;
      if (next >= filteredQuestions.length) return 0;
      return next;
    });
    setRevealedQuestionId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="exam-shell">
      <section className="exam-hero">
        <div>
          <p className="atlas-kicker">Active recall · evidence-aware</p>
          <h1>{bank.title}</h1>
          <p>{bank.warning}</p>
        </div>
        <div className="exam-hero-stats">
          <div>
            <strong>{bank.questions.length}</strong>
            <span>question families</span>
          </div>
          <div>
            <strong>{highPriorityCount}</strong>
            <span>cross-source signals</span>
          </div>
          <div>
            <strong>{exactExerciseCount}</strong>
            <span>exact exercise drills</span>
          </div>
          <div>
            <strong>{solidCount}</strong>
            <span>marked solid</span>
          </div>
        </div>
      </section>

      <section className="exam-warning" role="note">
        <strong>How to use this bank.</strong> Attempt the task before revealing
        the answer. Recollections show what students remember seeing, not what
        is guaranteed to appear. Checked answers are grounded in the lecture
        evidence; unresolved fragments remain unresolved.
      </section>

      <section className="exam-dashboard" aria-label="Practice controls">
        <div className="exam-filter-group">
          {(
            [
              ["all", "All"],
              ["high_priority", "High priority"],
              ["exact_exercise", "Last exercise"],
              ["needs_review", `Review queue (${reviewCount})`],
              ["coverage_gap", "Coverage gaps"],
            ] as const
          ).map(([value, label]) => (
            <button
              aria-pressed={filter === value}
              data-active={filter === value}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <span>
          {filteredQuestions.length
            ? `${activeIndex + 1} of ${filteredQuestions.length}`
            : "No matching questions"}
        </span>
      </section>

      {activeQuestion && activeProgress ? (
        <article className="exam-card">
          <header className="exam-card-header">
            <div className="exam-badges">
              <span data-kind="priority">{activeQuestion.priority} priority</span>
              <span data-kind={activeQuestion.verification}>
                {verificationLabels[activeQuestion.verification]}
              </span>
              <span>{activeQuestion.format.replace("_", " ")}</span>
            </div>
            <p className="exam-question-index">
              {activeQuestion.id} · {activeQuestion.topic}
            </p>
            <h2>{activeQuestion.prompt}</h2>
            {activeQuestion.prompt_code ? (
              <pre className="exam-prompt-code">
                {activeQuestion.prompt_code}
              </pre>
            ) : null}
            {activeQuestion.visuals?.prompt ? (
              <figure className="exam-task-visual">
                <ExpandableImage
                  alt={activeQuestion.visuals.prompt.alt}
                  src={`${COURSE_ROOT}/${activeQuestion.visuals.prompt.image}`}
                />
                <figcaption>
                  {activeQuestion.visuals.prompt.caption}
                </figcaption>
              </figure>
            ) : null}
            <div className="exam-source-strip">
              {activeQuestion.sources.map((source) => (
                <span
                  data-source={source.kind}
                  key={`${source.kind}-${source.label}-${source.pages?.join("-")}`}
                  title={source.detail}
                >
                  {sourceLabels[source.kind]}
                  {sourcePageLabel(source.pages)}
                </span>
              ))}
            </div>
            {activeQuestion.signals?.length ? (
              <p className="exam-signals">
                <strong>Why this is prioritised:</strong>{" "}
                {activeQuestion.signals.join(" · ")}
              </p>
            ) : null}
          </header>

          <section className="exam-attempt">
            <label htmlFor={`scratch-${activeQuestion.id}`}>
              <strong>Your answer</strong>
              <span>Private to this browser; no automatic grading.</span>
            </label>
            <textarea
              id={`scratch-${activeQuestion.id}`}
              onChange={(event) =>
                updateScratchpad(activeQuestion.id, event.target.value)
              }
              placeholder="Write the steps, draw a text diagram, or list the points you would give under exam conditions…"
              value={activeProgress.scratchpad}
            />
            <div className="exam-attempt-actions">
              <button
                aria-expanded={isRevealed}
                className="exam-reveal"
                onClick={() =>
                  setRevealedQuestionId(
                    isRevealed ? null : activeQuestion.id,
                  )
                }
                type="button"
              >
                {isRevealed ? "Hide checked answer" : "Reveal checked answer"}
              </button>
              <button onClick={() => move(1)} type="button">
                Skip for now
              </button>
            </div>
          </section>

          {isRevealed ? (
            <div className="exam-answer">
              <section>
                <p className="exam-section-label">Checked answer</p>
                <h3>What a strong answer should establish</h3>
                <p>{activeQuestion.answer}</p>
                <div className="exam-answer-basis">
                  Basis: {activeQuestion.answer_basis.replaceAll("_", " ")}
                </div>
              </section>

              {activeQuestion.visuals?.solution ? (
                <figure className="exam-task-visual exam-solution-visual">
                  <ExpandableImage
                    alt={activeQuestion.visuals.solution.alt}
                    src={`${COURSE_ROOT}/${activeQuestion.visuals.solution.image}`}
                  />
                  <figcaption>
                    {activeQuestion.visuals.solution.caption}
                  </figcaption>
                </figure>
              ) : null}

              {activeQuestion.worked_example ? (
                <PipelineExample example={activeQuestion.worked_example} />
              ) : null}

              {activeQuestion.assumptions.length ? (
                <section>
                  <p className="exam-section-label">Assumptions</p>
                  <ul>
                    {activeQuestion.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {activeQuestion.common_traps.length ? (
                <section className="exam-traps">
                  <p className="exam-section-label">Common traps</p>
                  <ul>
                    {activeQuestion.common_traps.map((trap) => (
                      <li key={trap}>{trap}</li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="exam-audit-note">
                <p className="exam-section-label">Protocol audit</p>
                <p>{activeQuestion.audit_note}</p>
              </section>

              <section className="exam-evidence-links">
                <p className="exam-section-label">Lecture evidence</p>
                {activeQuestion.citations.length ? (
                  activeQuestion.citations.map((citation) => (
                    <div
                      className="exam-evidence-group"
                      key={`${citation.chapter_id}-${citation.occurrence_ids.join("-")}`}
                    >
                      <p>
                        <strong>
                          {chapterById.get(citation.chapter_id)?.title ??
                            citation.chapter_id}
                        </strong>
                        <span>{citation.support_note}</span>
                      </p>
                      <div>
                        {citation.occurrence_ids.map((occurrenceId) => {
                          const record = evidenceById.get(occurrenceId);
                          return (
                            <button
                              key={occurrenceId}
                              onClick={() =>
                                onOpenEvidence(
                                  citation.chapter_id,
                                  occurrenceId,
                                )
                              }
                              type="button"
                            >
                              {record?.title ?? occurrenceId}
                              {record
                                ? ` · ${record.start.replace(/\.000$/, "")}`
                                : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="exam-coverage-gap">
                    Not grounded in the current lecture atlas. Use this only as
                    a task-format warning, not as a checked answer.
                  </p>
                )}
              </section>

              <section className="exam-self-rate">
                <div>
                  <p className="exam-section-label">Self-check</p>
                  <h3>How complete was your answer?</h3>
                </div>
                <div>
                  <button
                    aria-pressed={activeProgress.self_rating === "again"}
                    data-rating="again"
                    data-selected={activeProgress.self_rating === "again"}
                    onClick={() => rate(activeQuestion.id, "again")}
                    type="button"
                  >
                    Again
                  </button>
                  <button
                    aria-pressed={activeProgress.self_rating === "hard"}
                    data-rating="hard"
                    data-selected={activeProgress.self_rating === "hard"}
                    onClick={() => rate(activeQuestion.id, "hard")}
                    type="button"
                  >
                    Hard
                  </button>
                  <button
                    aria-pressed={activeProgress.self_rating === "good"}
                    data-rating="good"
                    data-selected={activeProgress.self_rating === "good"}
                    onClick={() => rate(activeQuestion.id, "good")}
                    type="button"
                  >
                    Good
                  </button>
                </div>
              </section>
            </div>
          ) : null}

          <footer className="exam-card-footer">
            <button onClick={() => move(-1)} type="button">
              ← Previous
            </button>
            <span>
              {activeProgress.status.replace("_", " ")}
              {activeProgress.attempt_count
                ? ` · ${activeProgress.attempt_count} review${activeProgress.attempt_count === 1 ? "" : "s"}`
                : ""}
            </span>
            <button onClick={() => move(1)} type="button">
              Next →
            </button>
          </footer>
        </article>
      ) : (
        <p className="atlas-empty">
          No practice question matches the current chapter, search, and filter.
        </p>
      )}
    </div>
  );
}
