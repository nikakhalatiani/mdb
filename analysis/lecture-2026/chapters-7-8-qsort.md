# 2026 lecture audit: chapter 7, chapter 8, and Q-sort

Date: 2026-07-26

This audit compares three supplied PDFs with the 2021 lecture evidence already present under `public/generated/course`. Every one of the 79 physical PDF pages was rendered at 144 dpi and visually inspected. Extracted text was used only as a second channel; all page classification and handwriting decisions were checked against the rendered page.

The machine-readable companion is `analysis/lecture-2026/chapters-7-8-qsort.json`.

## Executive conclusion

| Deck | Result | Confidence | Site treatment |
|---|---|---:|---|
| Chapter 7 | Printed material is unchanged from the 2021 recorded course. Every page has an exact 2021 occurrence. | High | Keep chapters 16 and 17. Use the new PDF only as cleaner alternate evidence; do not duplicate the teaching sequence. |
| Chapter 8 | Logical slides 1-25 occupy the old 2021 deck positions, but only four were actually visible in the recording. The professor explicitly stopped before teaching the section and said it would not be examined in 2021. The user directly reports that the full section was taught in 2026, so the old label is stale for current teaching coverage. Logical slides 26-29, “Data Blocks,” are genuinely new relative to the old deck total. | High for source comparison and 2026 coverage; low for official current exam status | Add a separate, clearly marked 2026 supplement after chapter 17. State that it was fully covered in 2026, that the 2021 non-exam statement is historical, and that the supplied sources contain no official 2026 exam guarantee. |
| Q-sort | No exact 2021 occurrence. It is new to the recorded-course corpus, but the deck itself is dated 2020 and reads like a standalone Umbra engineering talk. | High for corpus status; low for current exam status | Optional deep dive under chapter 15, cross-linked from chapter 16. Do not present its code or benchmark numbers as core exam material without an instructor statement. |

No printed page was classified as `clarified/updated` or `cosmetic/reordered`: chapter 7 has exact matches; chapter 8's uncaptured old-deck positions do not provide enough evidence for a content-level comparison; and Q-sort has no old counterpart.

## Evidence rules

- `unchanged` means the same printed slide has an exact 2021 visual occurrence.
- `uncertain` means there is strong structural evidence that the slide occupied the 2021 deck, but no captured 2021 occurrence exists to compare its printed contents.
- `new` means the printed material has no exact 2021 counterpart and, where deck numbering permits, is beyond the old deck boundary.
- Handwriting is catalogued separately. It is never treated as a curriculum change.
- A PDF's presence is not evidence that its contents are examined.

## Chapter 7

### Deck-level finding

The deck is an exact restatement of the final two core sections from `dbimpl-13-codegen`:

- PDF pages 1-13 map to site chapter `16-query-compilation`.
- PDF pages 14-24 map to site chapter `17-parallel-query-execution`.
- Two pages contain handwriting. Their printed slides are still unchanged.
- No printed topic was added, removed, or de-emphasized.

### Page map

| PDF page | Printed title | Exact 2021 occurrence(s) | Class | Confidence |
|---:|---|---|---|---:|
| 1 | Code Generation | `dbimpl-13-codegen-015` | unchanged | High |
| 2 | Motivation | `dbimpl-13-codegen-016` | unchanged | High |
| 3 | LLVM | `dbimpl-13-codegen-017`, `-018` | unchanged | High |
| 4 | Compiling Scalar Expressions | `dbimpl-13-codegen-019` | unchanged | High |
| 5 | Data-Centric Query Execution | `dbimpl-13-codegen-020` | unchanged | High |
| 6 | Data-Centric Query Execution (2) | `dbimpl-13-codegen-021` | unchanged | High |
| 7 | Data-Centric Query Execution (3) | `dbimpl-13-codegen-022`, `-024`, `-027` | unchanged | High |
| 8 | Data-Centric Query Execution (4) | `dbimpl-13-codegen-023`, `-025`, `-032` | unchanged | High |
| 9 | Producing the Code | `dbimpl-13-codegen-026`, `-028` | unchanged | High |
| 10 | Producing the Code (2) | `dbimpl-13-codegen-029`, `-030` | unchanged | High |
| 11 | Producing the Code (3) | `dbimpl-13-codegen-031` | unchanged | High |
| 12 | Producing the Code (4) | `dbimpl-13-codegen-033` | unchanged | High |
| 13 | Producing the Code (5) | `dbimpl-13-codegen-034` | unchanged | High |
| 14 | Parallel Query Execution | `dbimpl-13-codegen-035` | unchanged | High |
| 15 | Parallelism | `dbimpl-13-codegen-036` | unchanged | High |
| 16 | Vertical Parallelism: Exchange Operator | `dbimpl-13-codegen-037` | unchanged | High |
| 17 | Exchange Operator Variants | `dbimpl-13-codegen-038` | unchanged | High |
| 18 | Aggregation with Exchange Operators | `dbimpl-13-codegen-039`, `-043` | unchanged | High |
| 19 | Join with Exchange Operators | `dbimpl-13-codegen-040`, `-042` | unchanged | High |
| 20 | Disadvantages of Exchange Operators | `dbimpl-13-codegen-041`, `-044` | unchanged | High |
| 21 | Parallel Query Engine | `dbimpl-13-codegen-045` | unchanged | High |
| 22 | Morsel-Driven Query Execution | `dbimpl-13-codegen-046`, `-048` | unchanged | High |
| 23 | Dynamic Scheduling | `dbimpl-13-codegen-047`, `-049` | unchanged | High |
| 24 | Parallel In-Memory Hash Join | `dbimpl-13-codegen-050` | unchanged | High |

Repeated occurrence IDs reflect the professor revisiting the same slide in the recording; they are not duplicate PDF pages.

### Recommended site treatment

Keep the existing per-slide explanations and occurrence history. The 2026 PDF can supply a clean initial visual where the current recording frame is blurry, but the recording frames remain valuable for the professor's annotations and speech. For page 16 and page 22, expose the handwriting only as an optional “annotated view.”

## Chapter 8

### What the 2021 evidence actually proves

The 2021 recording contains these exact visual occurrences:

| 2026 PDF page | 2021 canonical slide | Exact occurrence |
|---:|---:|---|
| 1 | 351 | `dbimpl-13-codegen-051` |
| 2 | 352 | `dbimpl-13-codegen-052` |
| 3 | 353 | `dbimpl-13-codegen-053` |
| 7 | 357 | `dbimpl-13-codegen-054` |

The occurrence metadata says the old deck total was 375 slides. Therefore the 2026 deck's logical pages 1-25 align exactly with old canonical positions 351-375. That is strong evidence that these slides existed in the old deck, but it is not proof that their printed contents are unchanged unless a 2021 frame exists.

The transcript spanning occurrences `dbimpl-13-codegen-051` through `-054` is decisive about the 2021 teaching status: the professor stopped before the main-memory section and, at `dbimpl-13-codegen-054`, explicitly said it would not be asked in the exam. This is stronger evidence than the mere existence of the old slide positions.

### Physical-page map

The HyPer snapshot slide is exported as five animation states, so 29 logical slides become 33 physical PDF pages.

| PDF page | Printed page | Printed title/state | 2021 mapping | Class | Confidence |
|---:|---:|---|---|---|---:|
| 1 | 1/29 | Main-Memory Databases | exact `-051`, slide 351 | unchanged | High |
| 2 | 2/29 | Motivation | exact `-052`, slide 352 | unchanged | High |
| 3 | 3/29 | Recap: Database Workloads | exact `-053`, slide 353 | unchanged | High |
| 4 | 4/29 | Online Transaction Processing | inferred slide 354 | uncertain | Medium |
| 5 | 5/29 | Online Transaction Processing (2) | inferred slide 355 | uncertain | Medium |
| 6 | 6/29 | Physical Data Layout in Main Memory | inferred slide 356 | uncertain | Medium |
| 7 | 7/29 | Physical Data Layout in Main Memory (2) | exact `-054`, slide 357 | unchanged | High |
| 8 | 8/29 | New Systems: Examples | inferred slide 358 | uncertain | Medium |
| 9 | 9/29 | New Systems: OLTP | inferred slide 359 | uncertain | Medium |
| 10 | 10/29 | Hekaton | inferred slide 360 | uncertain | Medium |
| 11 | 11/29 | New Systems: OLAP | inferred slide 361 | uncertain | Medium |
| 12 | 12/29 | New Systems: Hybrid OLTP and OLAP | inferred slide 362 | uncertain | Medium |
| 13 | 13/29 | HyPer snapshots: base state | inferred slide 363 | uncertain | Medium |
| 14 | 13/29 | HyPer snapshots: forked snapshot | inferred slide 363 | uncertain | Medium |
| 15 | 13/29 | HyPer snapshots: OLAP reads C | inferred slide 363 | uncertain | Medium |
| 16 | 13/29 | HyPer snapshots: copy-on-write update | inferred slide 363 | uncertain | Medium |
| 17 | 13/29 | HyPer snapshots: concurrent snapshot reads | inferred slide 363 | uncertain | Medium |
| 18 | 14/29 | In-Memory Index Structures | inferred slide 364 | uncertain | Medium |
| 19 | 15/29 | Radix Trees | inferred slide 365 | uncertain | Medium |
| 20 | 16/29 | Adaptive Radix Trees | inferred slide 366 | uncertain | Medium |
| 21 | 17/29 | Exploiting HTM for OLTP | inferred slide 367 | uncertain | Medium |
| 22 | 18/29 | Exploiting HTM for OLTP (2) | inferred slide 368 | uncertain | Medium |
| 23 | 19/29 | Implementing DB transactions with HTM | inferred slide 369 | uncertain | Medium |
| 24 | 20/29 | NUMA-Aware Data Processing | inferred slide 370 | uncertain | Medium |
| 25 | 21/29 | NUMA-Aware Data Processing: Hash Join | inferred slide 371 | uncertain | Medium |
| 26 | 22/29 | Compaction | inferred slide 372 | uncertain | Medium |
| 27 | 23/29 | Compaction: Hot/Cold Clustering | inferred slide 373 | uncertain | Medium |
| 28 | 24/29 | Compaction: Hot/Cold Clustering | inferred slide 374 | uncertain | Medium |
| 29 | 25/29 | Compaction: Hot/Cold Clustering | inferred slide 375 | uncertain | Medium |
| 30 | 26/29 | Data Blocks | beyond old deck | new | High |
| 31 | 27/29 | Data Blocks - Scan Types | beyond old deck | new | High |
| 32 | 28/29 | Data Blocks - Layout | beyond old deck | new | High |
| 33 | 29/29 | Data Blocks - Vectorized Evaluation | beyond old deck | new | High |

### Main-memory and modern-CPU coverage

The supplied deck now makes a substantial coherent module available:

1. Workload and physical-layout recap.
2. In-memory OLTP/OLAP systems, including Hekaton, SAP HANA, and HyPer.
3. In-memory indexes: hash, radix, and adaptive radix trees.
4. HTM-assisted OLTP.
5. NUMA-aware processing and hash join.
6. Hot/cold compaction.
7. New Data Blocks material: compressed blocks, scan modes, metadata/layout, positional SMAs, and vectorized evaluation.

This is far more coverage than the 2021 recording taught. The user directly reports that the full section was covered in 2026, so the 2021 non-exam label must not be presented as current. Coverage still does not amount to an official exam guarantee. The safe UI wording is:

> Fully covered in the 2026 course (user report). The 2021 recording's non-exam statement is historical; no official 2026 exam guarantee is present in the supplied sources.

### Recommended site treatment

- Add one fully covered 2026 supplement after chapter 17 instead of mixing these slides silently into the 2021 chapter.
- Group physical pages 13-17 into one interactive HyPer snapshot sequence.
- Make “Data Blocks” a visibly new subsection.
- Add concise teaching explanations because there is no professor speech aligned to most of these pages in the 2021 source.
- Treat any future 2026 lecture transcript or official instructor exam statement as the authority for adding a stronger exam-status claim.

## Q-sort

### Source status

The deck title is “3-Way QuickSort in Umbra,” authored by Thomas Neumann and dated May 28, 2020. It is not an exact part of the supplied 2021 recording corpus:

- No exact title, slide, Bentley-McIlroy, Lomuto, Hoare-partition, or generated-quicksort occurrence was found.
- `dbimpl-13-codegen-004` is only a conceptual bridge. It says carefully implemented quicksort is a fast in-memory run-generation choice and compares it with replacement-selection heap sort.
- The Q-sort deck goes much further: runtime-generated partitioning, duplicate handling, disassembly/profiles, lazy three-way partitioning, branch misses, and benchmark comparisons.

Accordingly every Q-sort page is `new` relative to the recorded corpus, but “new to the corpus” must not be misread as “newly authored in 2026” or “currently examinable.”

### Page map

| PDF page | Printed title | Main teaching point | Exact 2021 occurrence | Class |
|---:|---|---|---|---|
| 1 | 3-Way QuickSort in Umbra | Metadata/title; dated 2020 | none | new |
| 2 | Motivation | Runtime-dependent ORDER BY comparator | none | new |
| 3 | The Current Situation | `std::sort` repeatedly calls JITed comparison code | none | new |
| 4 | The Problem | Comparator-call profile | none | new |
| 5 | The Problem (2) | Comparator disassembly profile | none | new |
| 6 | The Obvious Solution | Weak-heap-sort implementation | none | new |
| 7 | The Obvious Solution - Weak Heap Sort | Fewer comparisons but slower in measured cases | none | new |
| 8 | New Idea - Generate Quick Sort | One generated call per partition, not comparison | none | new |
| 9 | Full (C++) Code | Generated quicksort framework | none | new |
| 10 | Partitioning - Traditional | Traditional Sedgewick partitioning | none | new |
| 11 | Equal Keys | Equal-key strategies A-C | none | new |
| 12 | Equal Keys (2) | Three-way partitioning strategy | none | new |
| 13 | Bentley-McIlroy 3-way Partitioning | Three-region invariant and relocation | none | new |
| 14 | 3-Way QuickSort by Sedgewick | Implementation | none | new |
| 15 | 3-Way QuickSort - Fixed Version | Pointer-crossing boundary fix | none | new |
| 16 | New Version | New implementation profile | none | new |
| 17 | New Version (2) | New implementation disassembly | none | new |
| 18 | Performance | Old versus generated | none | new |
| 19 | Hoare Partitioning | Lazy equal-partition construction | none | new |
| 20 | Performance (2) | Old/new/lazy comparison | none | new |
| 21 | Branch-Free Lomuto Partitioning | Swaps versus branch misses | none | new |
| 22 | Performance (3) | Final four-way benchmark comparison | none | new |

All Q-sort classifications have high confidence as a corpus comparison. The exam-status confidence is low because no current teaching or assessment statement accompanied the standalone deck.

### Recommended site treatment

Create an optional deep-dive card in `15-sort-group-and-set-operations`, with a cross-link from `16-query-compilation`:

- Start with a short explanation of the problem: query-specific comparison code makes a generic library sort pay call overhead.
- Teach the conceptual progression: weak heap sort → generated quicksort → three-way duplicate handling → Hoare/lazy variant → branch-free Lomuto.
- Keep the long C++ listings and disassembly behind an expandable “implementation detail” control.
- Present benchmark values as historical measurements from this deck, not general guarantees.
- Label the module “Supplementary — source deck dated 2020; not present in the 2021 recorded sequence; current exam status unconfirmed.”

## Handwriting catalogue

| Deck/page | Handwritten content | Interpretation | Curriculum change? |
|---|---|---|---|
| Chapter 7 p16 | Black exchange-tree expansion, including labels resembling `Xchg(3:1)` and `XchgHash(3:3)`, with lines over the printed diagram | Teaching annotation for fan-in/fan-out and hash repartitioning | No |
| Chapter 7 p22 | Small black operator tree: join over `T` and a nested join over `S` and `R` | Example plan sketched during morsel discussion | No |
| Chapter 8 p12 | Approximately “End 06/30,” two arrows, and a diagonal scribble | Session/date marker and incidental strokes | No |
| Chapter 8 p23 | Approximately “End 7/7,” two arrows, and a diagonal scribble | Session/date marker and incidental strokes | No |

The red and blue labels inside the HTM diagram on chapter 8 page 23 are part of the printed slide, not handwriting. No handwriting was found on the Q-sort pages.

## Implementation priority

1. Preserve chapter 7 as-is and reuse only cleaner visuals.
2. Add the chapter 8 supplement with the explicit 2021/current-status distinction.
3. Make Data Blocks the only section labeled definitively new relative to the old deck.
4. Add Q-sort as optional, never as silent core exam content.
5. Record Chapter 8 as fully covered in 2026 based on the user's direct report. If an official instructor exam statement becomes available, use it to resolve exam-status uncertainty; do not infer an exam guarantee from slide presence or coverage alone.
