import { useMemo } from "react";

import { ExpandableImage } from "../ExpandableImage";
import type { Course2026Collection, Course2026Deck } from "./types";

type ChapterRef = {
  id: string;
  number: number;
  title: string;
  occurrence_ids: string[];
};

type EvidenceRef = {
  occurrence_id: string;
  title: string;
  recording_id: string;
  start: string;
  end: string;
};

function CurrentBadge({
  classification,
}: {
  classification: string;
}) {
  const label = classification.replaceAll("_", " ");
  return (
    <span className="atlas-current-badge" data-kind={classification}>
      {label}
    </span>
  );
}

function formatPageList(pages: number[]) {
  if (!pages.length) return "";
  const sorted = [...new Set(pages)].sort((left, right) => left - right);
  const ranges: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];
  for (const page of sorted.slice(1)) {
    if (page === previous + 1) {
      previous = page;
      continue;
    }
    ranges.push(start === previous ? String(start) : `${start}–${previous}`);
    start = page;
    previous = page;
  }
  ranges.push(start === previous ? String(start) : `${start}–${previous}`);
  return ranges.join(", ");
}

function sourceLabels(
  deck: Course2026Deck,
  slide: Course2026Deck["slides"][number],
) {
  if (slide.content_layer === "handwriting") {
    return {
      index: `Handwritten study view · PDF page${slide.pdf_pages.length === 1 ? " " : "s "}${slide.pdf_pages.join(", ")}`,
      visual: "Handwritten source view",
      badge: "handwriting · authorship unverified",
      synthesis:
        "This study explanation uses the supplied handwritten view and related course concepts. The handwriting is not treated as a printed curriculum change or as professor speech.",
    };
  }
  if (slide.content_layer === "annotated_printed") {
    return {
      index: `Annotated slide ${slide.deck_slide} · PDF page${slide.pdf_pages.length === 1 ? " " : "s "}${slide.pdf_pages.join(", ")}`,
      visual: "Printed slide with handwriting",
      badge: `${deck.source_year} print + annotation`,
      synthesis:
        "This explanation separates the printed slide from handwritten annotations of unverified authorship. The annotation is supplemental evidence, not a printed curriculum change or invented professor speech.",
    };
  }
  return {
    index: `Supplied deck slide ${slide.deck_slide} · PDF page${slide.pdf_pages.length === 1 ? " " : "s "}${slide.pdf_pages.join(", ")}`,
    visual: "Supplied source visual",
    badge: `${deck.source_year} printed source`,
    synthesis:
      "This explanation is derived from the supplied printed slide. It does not invent professor speech where no current recording was supplied.",
  };
}

function CurrentSlide({
  deck,
  evidence,
  occurrenceChapterById,
  onOpenEvidence,
  slide,
}: {
  deck: Course2026Deck;
  evidence: EvidenceRef[];
  occurrenceChapterById: Map<string, string>;
  onOpenEvidence: (chapterId: string, occurrenceId: string) => void;
  slide: Course2026Deck["slides"][number];
}) {
  const evidenceById = new Map(
    evidence.map((record) => [record.occurrence_id, record]),
  );
  const gallery = deck.slides.map((item) => ({
    alt: item.image_alt,
    label: `${deck.title} · ${item.deck_slide == null ? "handwritten view" : `slide ${item.deck_slide}`} · ${item.title}`,
    src: item.image,
  }));
  const labels = sourceLabels(deck, slide);

  return (
    <article className="atlas-card atlas-current-slide" id={slide.id}>
      <header className="atlas-card-header">
        <div>
          <p className="atlas-card-index">
            {labels.index}
          </p>
          <h3>{slide.title}</h3>
        </div>
        <CurrentBadge classification={slide.classification} />
      </header>
      <div className="atlas-card-grid">
        <div className="atlas-visual">
          <p className="atlas-evidence-label">{labels.visual}</p>
          <ExpandableImage
            alt={slide.image_alt}
            className="atlas-slide-image"
            gallery={gallery}
            initialIndex={deck.slides.findIndex((item) => item.id === slide.id)}
            loading="lazy"
            src={slide.image}
          />
          <p className="atlas-current-source-note">{slide.source_note}</p>
        </div>
        <div className="atlas-notes">
          <section className="atlas-note-block atlas-slide-teaching">
            <div className="atlas-slide-teaching-header">
              <div>
                <p className="atlas-card-study-label">
                  {slide.content_layer === "handwriting"
                    ? "Study explanation for this handwritten view"
                    : "Current-slide teaching explanation"}
                </p>
                <h4>What to understand</h4>
              </div>
              <span className="atlas-coverage-badge">{labels.badge}</span>
            </div>
            {slide.explanation.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <p className="atlas-synthesis-note">
              {labels.synthesis}
            </p>
          </section>
          <div className="atlas-current-study-grid">
            <section>
              <h4>Key points</h4>
              <ul>
                {slide.key_points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </section>
            <section>
              <h4>Study / exam-practice signal</h4>
              <ul>
                {slide.exam_signal.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
                <li>Evidence basis: {slide.exam_signal.evidence_basis}</li>
                <li>
                  Official exam scope: {slide.exam_signal.official_scope}
                </li>
              </ul>
            </section>
          </div>
          <section className="atlas-current-self-test">
            <h4>Check yourself</h4>
            <ol>
              {slide.self_test.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          </section>
          {slide.handwritten_note ? (
            <p className="atlas-current-handwriting">
              <strong>Handwriting:</strong> {slide.handwritten_note}
            </p>
          ) : null}
          {slide.baseline_occurrence_ids.length ? (
            <section className="atlas-current-baseline-links">
              <h4>Related 2021 recording evidence</h4>
              <div>
                {slide.baseline_occurrence_ids.map((occurrenceId) => {
                  const record = evidenceById.get(occurrenceId);
                  return (
                    <button
                      key={occurrenceId}
                      onClick={() =>
                        onOpenEvidence(
                          occurrenceChapterById.get(occurrenceId) ??
                            slide.chapter_id,
                          occurrenceId,
                        )
                      }
                      type="button"
                    >
                      {record
                        ? `${record.title} · ${record.start}–${record.end}`
                        : occurrenceId}
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function Course2026({
  chapters,
  collection,
  deckId,
  evidence,
  onOpenEvidence,
  query,
}: {
  chapters: ChapterRef[];
  collection: Course2026Collection;
  deckId: string;
  evidence: EvidenceRef[];
  onOpenEvidence: (chapterId: string, occurrenceId: string) => void;
  query: string;
}) {
  const deck =
    collection.decks.find((item) => item.id === deckId) ??
    collection.decks[0];
  const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
  const occurrenceChapterById = new Map(
    chapters.flatMap((chapter) =>
      chapter.occurrence_ids.map(
        (occurrenceId) => [occurrenceId, chapter.id] as const,
      ),
    ),
  );
  const normalizedQuery = query.trim().toLowerCase();
  const slides = useMemo(() => {
    if (!deck) return [];
    if (!normalizedQuery) return deck.slides;
    return deck.slides.filter((slide) =>
      [
        slide.title,
        slide.explanation.join(" "),
        slide.key_points.join(" "),
        slide.exam_signal.points.join(" "),
        slide.exam_signal.evidence_basis,
        slide.self_test.join(" "),
        slide.handwritten_note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [deck, normalizedQuery]);

  if (!deck) {
    return (
      <p className="atlas-empty">
        The 2026 course comparison is still being generated.
      </p>
    );
  }

  return (
    <>
      <section className="atlas-current-hero">
        <div>
          <p className="atlas-kicker">Supplied-deck audit · 2026 course set</p>
          <h1>{deck.title}</h1>
          <p className="atlas-hero-copy">{deck.subtitle}</p>
          <div className="atlas-current-status-line">
            <CurrentBadge classification={deck.status} />
            <span>{deck.status_label}</span>
          </div>
        </div>
        <dl className="atlas-current-source-facts">
          <div>
            <dt>Current source</dt>
            <dd>{deck.source_file}</dd>
          </div>
          <div>
            <dt>Source deck year</dt>
            <dd>{deck.source_year}</dd>
          </div>
          <div>
            <dt>Coverage basis</dt>
            <dd>{deck.coverage_basis.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt>Official exam scope</dt>
            <dd>{deck.official_exam_scope}</dd>
          </div>
          <div>
            <dt>Source pages</dt>
            <dd>
              {deck.logical_slide_count} logical slides ·{" "}
              {deck.physical_page_count} PDF pages
            </dd>
          </div>
          <div>
            <dt>Related study chapters</dt>
            <dd>
              {deck.chapter_ids
                .map((id) => chapterById.get(id)?.title)
                .filter(Boolean)
                .join(" · ") || "2026-only supplement"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="atlas-current-policy">
        <div>
          <p className="atlas-study-label">Source discipline</p>
          <h2>What the comparison means</h2>
        </div>
        <p>{collection.warning}</p>
        <p>{collection.baseline_note}</p>
      </section>

      <section className="atlas-current-verdict">
        <div>
          <p className="atlas-study-label">Verified deck verdict</p>
          <h2>{deck.verdict}</h2>
          <p>{deck.confidence_note}</p>
        </div>
        <ol>
          {deck.study_treatment.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      {deck.findings.length ? (
        <section className="atlas-current-findings">
          <header>
            <p className="atlas-study-label">Source audit</p>
            <h2>What changed, what did not, and what was missing</h2>
          </header>
          <div>
            {deck.findings.map((finding) => (
              <article key={`${deck.id}-${finding.title}`}>
                <CurrentBadge classification={finding.classification} />
                <h3>{finding.title}</h3>
                <p>{finding.detail}</p>
                <span>
                  {finding.confidence} confidence
                  {finding.pdf_pages?.length
                    ? ` · PDF ${formatPageList(finding.pdf_pages)}`
                    : ""}
                </span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {deck.annotations.length ? (
        <section className="atlas-current-annotations">
          <header>
            <p className="atlas-study-label">Handwriting audit</p>
            <h2>Notes kept separate from printed changes</h2>
          </header>
          <div>
            {deck.annotations.map((annotation) => (
              <article key={`${deck.id}-${annotation.pdf_page}`}>
                {annotation.image ? (
                  <ExpandableImage
                    alt={`Handwritten annotation on ${deck.title}, PDF page ${annotation.pdf_page}`}
                    loading="lazy"
                    src={annotation.image}
                  />
                ) : null}
                <p>PDF page {annotation.pdf_page}</p>
                <h3>{annotation.description}</h3>
                <span>{annotation.interpretation}</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {deck.slides.length ? (
        <>
          <section className="atlas-evidence-heading">
            <div>
              <p className="atlas-study-label">Supplied learning sequence</p>
              <h2>Slide-by-slide study guide</h2>
            </div>
            <p>
              Use the supplied visual as the source, then study the explanation
              beside it. Expanded view supports previous and next navigation
              across this deck.
            </p>
          </section>
          <p className="atlas-result-count atlas-current-result-count">
            {slides.length} matching study view{slides.length === 1 ? "" : "s"}
          </p>
          {slides.length ? (
            <section className="atlas-timeline">
              {slides.map((slide) => (
                <CurrentSlide
                  deck={deck}
                  evidence={evidence}
                  key={slide.id}
                  occurrenceChapterById={occurrenceChapterById}
                  onOpenEvidence={onOpenEvidence}
                  slide={slide}
                />
              ))}
            </section>
          ) : (
            <p className="atlas-empty">
              No supplied study view matches this search in the selected deck.
            </p>
          )}
        </>
      ) : (
        <section className="atlas-method-note">
          <strong>No duplicate slide sequence is needed.</strong> This deck
          remains represented by the 2021 teaching cards. The audit above tells
          you whether the current printed source changes how those cards should
          be used.
        </section>
      )}
    </>
  );
}
