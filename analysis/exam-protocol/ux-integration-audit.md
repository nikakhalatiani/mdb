# Exam protocol UX integration audit

## Recommendation

Add a localhost-only **Exam Practice** mode beside the existing **Lecture Guide**. Keep the lecture guide as the source of truth for course content, and treat the exam PDF only as a student-compiled collection of recalled question patterns.

The highest-value first version is a curated bank of approximately 34 top-level recalled prompts, presented one at a time with:

1. the question and its expected response format;
2. a private scratchpad;
3. an explicit **Reveal answer** action;
4. lecture-grounded expected points and worked reasoning;
5. the protocol's recollected answer in a separate, lower-trust panel;
6. exact links to the relevant chapter, slide or whiteboard interval, and timestamp;
7. a self-rating that updates a local practice queue.

Do not add runtime LLM grading, generated "correct" answers without evidence, or a full spaced-repetition system in the first version. Those features would add false authority and substantial complexity without improving the core active-recall loop.

## What exists now

The current React app is well suited to act as the evidence layer:

- It has 17 semantic chapters and 527 ordered visual intervals.
- Every interval already has a clarified teaching explanation tied to the exact aligned speech.
- Raw transcript and OCR are collapsed inside each card.
- Search covers titles, OCR, transcript, clarified explanations, and notes.
- Each chapter already has objectives, an exam checklist, a mental model, common mistakes, and self-test prompts.
- Localhost is already detected through `localSources`.

The current experience is still primarily a reading timeline. It lacks an attempt state, answer reveal, practice queue, question-level provenance, confidence distinctions, and a way to connect an exam recollection to several precise lecture intervals.

The app is a single page with no routing framework and loads static JSON with `fetch`. A realistic integration should preserve that architecture instead of introducing a backend or a large state framework.

## What the exam source actually is

`Final Klausur DBImpl.pdf` is a 17-page A4 compilation of questions and answers gathered from several files. The extracted text contains 34 top-level question bullets across 14 topic headings. The document is not an official exam or official answer key. Its own footnote warns that the answers are likely wrong or incomplete.

The visual PDF carries reliability information that plain-text extraction loses:

- yellow: TODO or incomplete;
- cyan: based on assumptions;
- red: impossible to know.

Some red entries contain only a remembered topic and a question mark. Some cyan entries reconstruct missing details. Other uncoloured answers are still recollections, not verified truth. This means the UI must never present the PDF's answer text under an unqualified label such as "Correct answer."

The protocol also has topic bias. A topic absent from these recollections is not necessarily absent from the exam. Conversely, timestamp synchronization and multiple-granularity locking appear in the protocol, but the current lecture atlas has no corresponding recordings: recording IDs 08 and 09 are absent. These must appear as explicit coverage gaps, not be weakly forced into the transaction-foundations chapter.

## Information architecture

### Top-level mode

Add a compact mode switch in the top bar:

- **Lecture Guide**
- **Exam Practice**

Only show Exam Practice when all three conditions hold:

- `import.meta.env.DEV` is true;
- the hostname is `localhost` or `127.0.0.1`;
- the local exam endpoint loads successfully.

In production, the mode is absent and no exam question data or PDF is included in the build.

### Exam Practice landing state

The exam mode should begin with:

- a persistent source warning: "Student recollections, not an official exam or answer key";
- queue counts: Unseen, Needs review, Attempted, Solid, Coverage gaps;
- three session choices:
  - **Continue review**: prioritise unseen and needs-review items;
  - **Focus by chapter/topic**;
  - **Mixed exam practice**;
- a small "Coverage audit" link listing protocol topics that have no lecture evidence.

Do not render all answers in a long scroll. The main practice view should show one question at a time to enforce retrieval rather than recognition.

### Contextual sidebar

In Lecture Guide mode, preserve the current chapter sidebar.

In Exam Practice mode, replace it with:

- readiness status;
- chapter/topic;
- question format;
- source flag;
- evidence coverage.

Keep the number of simultaneously visible filters small. Secondary filters can sit in a collapsible "More filters" panel.

## Practice card and reveal flow

### Before reveal

Show:

- question wording;
- badge: **Recalled exam question**;
- source page and question-fidelity label;
- expected response format, such as calculation, diagram, pseudocode, comparison, explanation, recognition, or plan transformation;
- associated chapter names, but not the answer-bearing slide titles if those would give away the solution;
- scratchpad textarea;
- **Reveal answer** and **Skip**.

The scratchpad is not automatically graded. It is stored only in local storage.

### After reveal

Reveal four visually separate sections:

1. **Expected answer points**
   A concise rubric derived from lecture evidence. Each claim must cite at least one interval.

2. **Worked reasoning**
   A teachable solution only when the lecture evidence is sufficient.

3. **What the protocol recollects**
   The PDF answer, collapsed by default and labelled with its original reliability flag. Never merge this prose into the lecture-grounded answer.

4. **Evidence and remaining uncertainty**
   Exact slide/board links, timestamps, mapping rationale, and any unresolved assumptions or missing recordings.

Only mount the answer sections after reveal. Visually hiding pre-rendered answer text would leak it to browser search, screen readers, and accidental selection.

After review, offer:

- **Again**: answer was missing or substantially wrong;
- **Hard**: answer was partial or uncertain;
- **Good**: answer covered the required points.

These ratings update a simple queue and are explicitly self-assessments, not correctness scores.

## Provenance and confidence model

Do not use one generic confidence percentage. It would combine unrelated uncertainties and create false precision. Keep these dimensions separate:

| Dimension | Meaning | Suggested values |
|---|---|---|
| Question fidelity | How complete the recalled question wording is | as-recorded, paraphrased, partial, topic-only |
| Protocol flag | Original PDF reliability marking | none, incomplete, assumption-based, impossible-to-know |
| Answer basis | What supports the displayed answer | lecture-supported, protocol-recollection, assumption-based, unavailable |
| Mapping status | Strength of the chapter/slide link | verified, probable, weak, coverage-gap |
| Review status | Whether a human checked the curated item | unreviewed, lecture-checked, disputed |

Every question should retain its PDF page, source document, and source kind. Every lecture-supported answer claim should retain occurrence IDs, timestamps, and a short mapping rationale.

### Safeguards

- The global recollection warning remains visible throughout exam mode.
- A red or unknown protocol item must never receive a polished "correct answer" solely from the protocol text.
- When lecture evidence is missing, say **Not grounded in the current lecture atlas**.
- Never infer that a protocol topic is examinable with certainty; call it a recalled pattern.
- Never infer that a topic absent from the protocol is safe to skip.
- Keep the raw protocol answer collapsed until after the user's attempt.
- Preserve the original reliability label in text, not colour alone.

## Topic-to-chapter mapping

Mappings should be curated, not accepted from keyword search without review.

| Protocol topic | Primary lecture mapping | Notes |
|---|---|---|
| Buffer Manager | Chapter 03 | Strong coverage, including FIFO, LRU, LFU, Second Chance, and 2Q |
| Slotted Pages / Record Layout | Chapter 05 | Strong coverage; questions often require drawing or decoding |
| Trees | Chapters 07-09 | B/B+-trees in 07-08; radix and specialised indexes in 09 |
| Join Algorithms | Chapter 14 | May also cite execution-model intervals in 12-13 |
| Extendible / Linear Hashing | Chapter 09 | Keep separate from hash-join questions |
| Operators | Chapters 12-15 | Map to the specific operator and interface, not only the broad chapter |
| LLVM / Query Engine / Code Generation | Chapter 16 | Strong direct coverage |
| Parallelization / Exchange | Chapters 13 and 17 | Chapter 17 is primary for exchange and morsel-driven execution |
| Timestamp Synchronization | Coverage gap | Missing lecture recording(s); chapter 10 is context only |
| Multiple Granularity Locking | Coverage gap | Missing lecture recording(s); do not imply direct support |
| General matching / fill-in questions | Mixed or unmapped | Preserve as format examples until wording is known |

The exam protocol contains no remembered question for every chapter. The practice dashboard should therefore show both **Protocol practice coverage** and **Lecture chapter mastery** rather than treating them as the same metric.

## Localhost-only implementation

### Data boundary

Do not place the PDF or derived question bank under `public/`; Vite would publish it with GitHub Pages.

Use a gitignored local file such as:

`local-data/exam-protocol.json`

Add a small Vite development-server middleware that exposes:

- `/__local/exam-protocol` for the curated JSON;
- optionally `/__local/exam-source?page=12` for the local PDF.

The middleware must exist only in `serve` mode. The production build should have no route and no exam source asset. If serving the PDF is unnecessary, show the filename and page number instead; direct `file://` links from an HTTP page are unreliable in modern browsers.

### React integration

Keep `StudyGuideApp` as the owner of:

- `mode`;
- loaded lecture data;
- current chapter;
- the action that opens an evidence interval.

Move exam-specific UI into a small module rather than making the already large component larger:

- `src/exam/ExamPractice.tsx`
- `src/exam/types.ts`
- `src/exam/useExamProgress.ts`

The exam component receives the existing chapters and evidence records. An evidence action should:

1. preserve the current attempt in local storage;
2. switch to Lecture Guide;
3. select the cited chapter;
4. scroll to the cited occurrence ID.

Deep-link state can be represented with query parameters such as:

`?mode=exam&question=buffer-2q-001`

No router library is required.

### Local progress

Store only user-generated practice state in a versioned local-storage key, for example:

`mdb.examPractice.v1`

Persist:

- attempt status;
- scratchpad;
- attempt count;
- last attempt timestamp;
- self-rating.

Do not mutate the curated question JSON. Validate loaded progress against current question IDs so an updated bank cannot leave orphaned state or crash the app.

## MVP scope

### Include

- manually curated top-level prompts;
- question-at-a-time practice;
- reveal flow;
- self-rating and simple queue;
- chapter/topic/source/evidence filters;
- exact lecture links;
- visible coverage gaps;
- local persistence;
- localhost-only data loading.

### Defer

- automatic free-text grading;
- runtime LLM calls;
- OCR-based automatic question import;
- a full SM-2 spaced-repetition scheduler;
- timed mock-exam scoring;
- PDF annotation or editing;
- multi-user accounts and synchronization.

## Key implementation risks

1. **False authority from the source**
   The polished UI can make student recollections look official. Repeated provenance labels and separated answer sources are mandatory.

2. **Colour metadata loss**
   The text extraction does not retain the PDF's yellow, cyan, and red meaning. Import must be curated against rendered pages, not text alone.

3. **Incorrect topic mapping**
   Keyword overlap can attach a question to a plausible but irrelevant slide. Require mapping rationale and human review.

4. **Missing lecture coverage**
   Timestamp synchronization and MGL are present in the protocol but absent from the current recordings. Coverage-gap behavior must be a first-class state.

5. **Answer contamination**
   A protocol recollection can bias a synthesized answer. Build lecture-supported rubrics from the lecture evidence independently, then display the recollection separately.

6. **Static-site privacy leakage**
   Anything under `public/` is deployable. The source and derived bank must remain outside the production asset graph.

7. **State and component growth**
   Adding practice logic directly to `StudyGuideApp.tsx` would make the current large component harder to maintain. Isolate the mode.

8. **Stale occurrence links**
   Regenerating slide boundaries can invalidate IDs. Add a validation step that checks every mapped occurrence against the evidence index and its chapter.

## Acceptance checks

### Data and provenance

- Every question has a stable ID, PDF page, source kind, question fidelity, and original protocol flag.
- Every answer section declares its basis.
- Every lecture-supported expected point cites at least one existing occurrence ID.
- Every cited occurrence belongs to the declared chapter.
- Coverage gaps render without a fabricated answer.
- Red/cyan/yellow meaning is preserved as text labels.
- No PDF or exam JSON is present in the production `dist/`.

### Practice behavior

- Answer content is not mounted before reveal.
- Drafts and ratings survive reload locally.
- Moving to the next question resets reveal state.
- Again/Hard/Good changes the queue predictably.
- Filters combine correctly and show the resulting count.
- Unseen, Needs review, Attempted, Solid, and Coverage gap are visually distinct without relying only on colour.
- Opening evidence selects the correct chapter and scrolls to the exact card.
- Returning to exam mode restores the same question and draft.

### Safety and accessibility

- Every question displays the student-recollection warning.
- Protocol recollections never use the heading "Correct answer."
- The reveal action and rating controls work by keyboard.
- Confidence and status badges have readable text labels.
- Mobile layout keeps the prompt, scratchpad, reveal action, and evidence links in a logical order.

### Regression

- Lecture Guide mode remains unchanged when local exam data is absent.
- Production loading does not request local exam endpoints.
- Existing chapter search and slide/board filters still work.
- The normal audit verifies all exam occurrence links when a local bank is present.
