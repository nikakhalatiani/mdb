import { useMemo } from "react";

import { ExpandableImage } from "../ExpandableImage";
import type {
  ExerciseChapterRef,
  ExerciseEvidenceRef,
  ExerciseLabCollection,
  ExerciseSourceRef,
} from "./types";

const COURSE_ROOT = "./generated/course";

type ExerciseLabsProps = {
  collection: ExerciseLabCollection;
  exerciseId: string;
  query: string;
  chapters: ExerciseChapterRef[];
  evidence: ExerciseEvidenceRef[];
  onOpenEvidence: (chapterId: string, occurrenceId: string) => void;
};

function SourceRefs({ refs }: { refs: ExerciseSourceRef[] }) {
  if (!refs.length) return null;
  return (
    <details className="exercise-source-details">
      <summary>Implementation evidence · {refs.length} reference{refs.length === 1 ? "" : "s"}</summary>
      <ul>
        {refs.map((ref) => (
          <li key={`${ref.path}-${ref.lines ?? ""}-${ref.symbol ?? ""}`}>
            <code>
              {ref.path}
              {ref.lines ? `:${ref.lines}` : ""}
            </code>
            {ref.symbol ? <strong>{ref.symbol}</strong> : null}
            <span>{ref.note}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

function matchesQuery(query: string, values: Array<string | string[] | undefined>) {
  if (!query) return true;
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value ?? ""]))
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function ExerciseLabs({
  collection,
  exerciseId,
  query,
  chapters,
  evidence,
  onOpenEvidence,
}: ExerciseLabsProps) {
  const lab =
    collection.labs.find((item) => item.id === exerciseId) ??
    collection.labs[0];
  const normalizedQuery = query.trim().toLowerCase();
  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter] as const)),
    [chapters],
  );
  const evidenceById = useMemo(
    () =>
      new Map(evidence.map((record) => [record.occurrence_id, record] as const)),
    [evidence],
  );

  if (!lab) {
    return <p className="atlas-empty">No exercise lab is available.</p>;
  }

  const concepts = lab.concepts.filter((concept) =>
    matchesQuery(normalizedQuery, [
      concept.title,
      concept.takeaway,
      concept.explanation,
      concept.pseudocode,
      concept.invariants,
      concept.pitfalls,
    ]),
  );
  const decisions = lab.decisions.filter((decision) =>
    matchesQuery(normalizedQuery, [
      decision.title,
      decision.rationale,
      decision.tradeoff,
    ]),
  );
  const tests = lab.tests.filter((test) =>
    matchesQuery(normalizedQuery, [
      test.name,
      test.proves,
      test.failure_mode,
    ]),
  );
  const drills = lab.drills.filter((drill) =>
    matchesQuery(normalizedQuery, [
      drill.prompt,
      drill.answer,
      drill.checklist,
      drill.format,
    ]),
  );
  const hasMatches =
    concepts.length > 0 ||
    decisions.length > 0 ||
    tests.length > 0 ||
    drills.length > 0;
  const lectureAnchorCount = lab.lecture_links.reduce(
    (count, link) => count + link.occurrence_ids.length,
    0,
  );
  const hasReportArtifact = lab.artifacts.some((artifact) =>
    /report/i.test(artifact),
  );

  return (
    <div className="exercise-shell">
      <section className="exercise-hero">
        <div>
          <p className="atlas-kicker">
            Exercise {String(lab.number).padStart(2, "0")} · implementation lab
          </p>
          <h1>{lab.title}</h1>
          <p>{lab.subtitle}</p>
          <div className="exercise-chapter-links" aria-label="Related chapters">
            {lab.chapter_ids.map((chapterId) => {
              const chapter = chapterById.get(chapterId);
              return chapter ? (
                <span key={chapterId}>
                  Ch. {String(chapter.number).padStart(2, "0")} · {chapter.title}
                </span>
              ) : null;
            })}
          </div>
        </div>
        <div className="exercise-hero-stats">
          <div>
            <strong>{lab.concepts.length}</strong>
            <span>core concepts</span>
          </div>
          <div>
            <strong>{lab.tests.length}</strong>
            <span>test lessons</span>
          </div>
          <div>
            <strong>{lab.drills.length}</strong>
            <span>exam drills</span>
          </div>
          <div>
            <strong>{lectureAnchorCount}</strong>
            <span>lecture anchors</span>
          </div>
        </div>
      </section>

      <section className="exercise-trust-note" role="note">
        <strong>How this material was audited.</strong> {collection.warning} The
        assignment README and tests define expected behavior; submitted code
        {lab.report_status === "available"
          ? " and report claims are used only where they agree"
          : " is used only where it agrees"}{" "}
        with that evidence.
      </section>

      <section className="exercise-orientation">
        <article>
          <p className="exercise-section-label">Assignment in 60 seconds</p>
          {lab.assignment_brief.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </article>
        <article>
          <p className="exercise-section-label">What you should learn</p>
          <ul>
            {lab.learning_outcomes.map((outcome) => (
              <li key={outcome}>{outcome}</li>
            ))}
          </ul>
        </article>
        <article>
          <p className="exercise-section-label">Artifacts inspected</p>
          <ul>
            {lab.artifacts.map((artifact) => (
              <li key={artifact}>{artifact}</li>
            ))}
            {!hasReportArtifact ? (
              <li>
                {lab.report_status === "available"
                  ? "Student implementation report (cross-checked)"
                  : "No student report was provided"}
              </li>
            ) : null}
          </ul>
        </article>
      </section>

      {normalizedQuery && !hasMatches ? (
        <p className="atlas-empty">
          No concepts, tests, decisions, or drills in this exercise match the
          current search.
        </p>
      ) : null}

      {concepts.length ? (
        <section className="exercise-section">
          <header className="exercise-section-header">
            <div>
              <p className="exercise-section-label">Algorithm playbook</p>
              <h2>Understand the mechanism, not just the code</h2>
            </div>
            <p>
              These explanations translate the concrete C++ project into the
              algorithm, state, and invariants you should be able to reproduce.
            </p>
          </header>
          <div className="exercise-concept-list">
            {concepts.map((concept, index) => (
              <article className="exercise-concept-card" key={concept.title}>
                <div className="exercise-concept-number">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3>{concept.title}</h3>
                  <p className="exercise-takeaway">{concept.takeaway}</p>
                  {concept.explanation.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {concept.pseudocode?.length ? (
                    <div className="exercise-pseudocode">
                      <span>Pseudocode skeleton</span>
                      <pre>{concept.pseudocode.join("\n")}</pre>
                    </div>
                  ) : null}
                  <div className="exercise-concept-grid">
                    <div>
                      <h4>Invariants to protect</h4>
                      <ul>
                        {concept.invariants.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4>Failure modes</h4>
                      <ul>
                        {concept.pitfalls.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <SourceRefs refs={concept.source_refs} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!normalizedQuery ? (
        <section className="exercise-trace">
          <div>
            <p className="exercise-section-label">Worked execution trace</p>
            <h2>{lab.trace.title}</h2>
            <p>{lab.trace.setup}</p>
          </div>
          <ol>
            {lab.trace.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="exercise-trace-result">
            <strong>Result.</strong> {lab.trace.result}
          </p>
        </section>
      ) : null}

      {decisions.length || tests.length ? (
        <section className="exercise-two-column">
          {decisions.length ? (
            <div>
              <header>
                <p className="exercise-section-label">Implementation judgment</p>
                <h2>Decisions and trade-offs</h2>
              </header>
              <div className="exercise-compact-list">
                {decisions.map((decision) => (
                  <article key={decision.title}>
                    <h3>{decision.title}</h3>
                    <p>{decision.rationale}</p>
                    <p className="exercise-tradeoff">
                      <strong>Trade-off:</strong> {decision.tradeoff}
                    </p>
                    <SourceRefs refs={decision.source_refs} />
                  </article>
                ))}
              </div>
            </div>
          ) : null}
          {tests.length ? (
            <div>
              <header>
                <p className="exercise-section-label">Tests as specifications</p>
                <h2>Edge cases you must understand</h2>
              </header>
              <div className="exercise-compact-list">
                {tests.map((test) => (
                  <article key={test.name}>
                    <h3><code>{test.name}</code></h3>
                    <p>{test.proves}</p>
                    <p className="exercise-failure">
                      <strong>If this fails:</strong> {test.failure_mode}
                    </p>
                    <SourceRefs refs={test.source_refs} />
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {drills.length ? (
        <section className="exercise-section exercise-drills">
          <header className="exercise-section-header">
            <div>
              <p className="exercise-section-label">Exam transfer</p>
              <h2>Turn implementation knowledge into answers</h2>
            </div>
            <p>
              Attempt each prompt on paper first. Then reveal the model answer
              and check whether you covered the decisive invariants.
            </p>
          </header>
          <div className="exercise-drill-grid">
            {drills.map((drill, index) => (
              <article key={drill.prompt}>
                <span className="exercise-drill-format">{drill.format}</span>
                <h3>
                  {index + 1}. {drill.prompt}
                </h3>
                <details>
                  <summary>Reveal answer and marking checklist</summary>
                  <p>{drill.answer}</p>
                  <ul>
                    {drill.checklist.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </details>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {!normalizedQuery ? (
        <section className="exercise-lecture-map">
          <header className="exercise-section-header">
            <div>
              <p className="exercise-section-label">Return to the lecture</p>
              <h2>Exact visual anchors</h2>
            </div>
            <p>
              Use these links when an implementation detail feels mechanical:
              they reopen the professor’s slide or board explanation at the
              relevant interval.
            </p>
          </header>
          <div className="exercise-lecture-grid">
            {lab.lecture_links.map((link) => {
              const chapter = chapterById.get(link.chapter_id);
              const linkedRecords = link.occurrence_ids
                .map((occurrenceId) => evidenceById.get(occurrenceId))
                .filter(
                  (record): record is ExerciseEvidenceRef => Boolean(record),
                );
              const leadRecord = linkedRecords[0];
              const gallery = linkedRecords.map((record) => ({
                alt: `${record.title}, lecture evidence at ${record.start}`,
                label: `${record.title} · ${record.start}`,
                src: `${COURSE_ROOT}/${record.annotated_image}`,
              }));
              return (
                <article key={`${link.chapter_id}-${link.note}`}>
                  {leadRecord ? (
                    <figure>
                      <ExpandableImage
                        alt={`${leadRecord.title}, lecture evidence at ${leadRecord.start}`}
                        gallery={gallery}
                        initialIndex={0}
                        loading="lazy"
                        src={`${COURSE_ROOT}/${leadRecord.annotated_image}`}
                      />
                      <figcaption>
                        Representative lecture visual · {leadRecord.title} ·{" "}
                        {leadRecord.start}
                      </figcaption>
                    </figure>
                  ) : null}
                  <h3>
                    {chapter
                      ? `Chapter ${String(chapter.number).padStart(2, "0")} · ${chapter.title}`
                      : link.chapter_id}
                  </h3>
                  <p>{link.note}</p>
                  <div>
                    {link.occurrence_ids.map((occurrenceId) => {
                      const record = evidenceById.get(occurrenceId);
                      return record ? (
                        <button
                          key={occurrenceId}
                          onClick={() =>
                            onOpenEvidence(link.chapter_id, occurrenceId)
                          }
                          type="button"
                        >
                          {record.title} · {record.start} →
                        </button>
                      ) : (
                        <span key={occurrenceId}>
                          Missing lecture reference: {occurrenceId}
                        </span>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {!normalizedQuery && lab.limitations.length ? (
        <section className="exercise-limitations">
          <p className="exercise-section-label">Audit boundaries</p>
          <ul>
            {lab.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
