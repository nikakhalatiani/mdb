# 2026 lecture audit — chapters 5–6

## Verdict

All **72 printed pages** are unchanged against the captured 2021 evidence: chapter 5 follows global slides 255–288 and chapter 6 follows 289–326. No printed new, reordered, clarified/updated, or removed/de-emphasized item is established. Handwriting was assessed separately and never used as curriculum-change evidence.

Seven handwritten teaching views are worth integrating: chapter 5 pages 16, 17, 19, 20, and 22; chapter 6 pages 15 and 18. Incidental arrows, question marks, underlines, ambiguous numeric shorthand, and lecture-end dates should be omitted.

## Exam-preparation treatment

- **High priority:** chapter 5 pages 14–25 (iterator/blockwise/push code), pages 32–34 (pipeline boundaries and parallelization), chapter 6 pages 23–25 (non-inner joins), and pages 30–31 (group-by). These overlap supplied recollections and the final exercise, but are not exam guarantees.
- **Implementation practice:** chapter 6 pages 13–21 (external hash join) and pages 26–29 (external sort). Ask for phase order, memory-fit invariants, skew/overflow behavior, and merge fanout.
- **Site placement:** pages map across existing chapters 12–15; use the per-page `intended_existing_site_chapter_id` in the JSON rather than creating new navigation chapters.

## Per-page audit

| PDF | Page | Printed title | 2021 occurrence IDs | Printed classification | Handwriting treatment | Site chapter |
|---|---:|---|---|---|---|---|
| Ch5 | 1 | Set-Oriented Query Processing | dbimpl-10-recovery-042, dbimpl-11-setoriented-001 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 2 | Motivation | dbimpl-10-recovery-043, dbimpl-11-setoriented-002 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 3 | Motivation (2) | dbimpl-10-recovery-044, dbimpl-11-setoriented-003 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 4 | The Algebraic Model | dbimpl-10-recovery-045, dbimpl-10-recovery-047, dbimpl-11-setoriented-004 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 5 | Implementing the Algebraic Model | dbimpl-11-setoriented-005, dbimpl-11-setoriented-007 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 6 | Implementing the Algebraic Model (2) | dbimpl-11-setoriented-008 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 7 | Implementing the Algebraic Model (3) | dbimpl-11-setoriented-009 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 8 | Operator Composition | dbimpl-11-setoriented-010, dbimpl-12-operators-001 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 9 | Operator Interface | dbimpl-11-setoriented-011, dbimpl-12-operators-002 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 10 | Operator Interface (2) | dbimpl-11-setoriented-012, dbimpl-12-operators-003 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 11 | Operator Interface (3) | dbimpl-11-setoriented-013, dbimpl-11-setoriented-015, dbimpl-11-setoriented-018 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 12 | Operator Interface (4) | dbimpl-11-setoriented-014, dbimpl-11-setoriented-016, dbimpl-11-setoriented-017, dbimpl-11-setoriented-019 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 13 | Operator Interface (5) | dbimpl-11-setoriented-020, dbimpl-12-operators-005 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 14 | Operator Interface (6) | dbimpl-11-setoriented-021, dbimpl-12-operators-006 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 15 | Examples - Full Materialization | dbimpl-11-setoriented-022, dbimpl-12-operators-004, dbimpl-12-operators-007 | unchanged (high) | omit incidental note | 12-set-oriented-execution-models |
| Ch5 | 16 | Examples - Iterator Model | dbimpl-11-setoriented-023, dbimpl-12-operators-008 | unchanged (high) | include supplement | 12-set-oriented-execution-models |
| Ch5 | 17 | Examples - Iterator Model (2) | dbimpl-11-setoriented-024 | unchanged (high) | include supplement | 12-set-oriented-execution-models |
| Ch5 | 18 | Examples - Iterator Model (3) | dbimpl-11-setoriented-025 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 19 | Examples - Blockwise Processing | dbimpl-11-setoriented-026 | unchanged (high) | include supplement | 12-set-oriented-execution-models |
| Ch5 | 20 | Examples - Blockwise Processing (2) | dbimpl-11-setoriented-027 | unchanged (high) | include supplement | 12-set-oriented-execution-models |
| Ch5 | 21 | Examples - Blockwise Processing (3) | dbimpl-11-setoriented-028, dbimpl-11-setoriented-030, dbimpl-11-setoriented-032 | unchanged (high) | omit incidental note | 12-set-oriented-execution-models |
| Ch5 | 22 | Examples - Blockwise Processing (4) | dbimpl-11-setoriented-029, dbimpl-11-setoriented-031, dbimpl-11-setoriented-033, dbimpl-12-operators-009 | unchanged (high) | include supplement | 12-set-oriented-execution-models |
| Ch5 | 23 | Examples - Push | dbimpl-11-setoriented-034, dbimpl-12-operators-011 | unchanged (high) | none | 12-set-oriented-execution-models |
| Ch5 | 24 | Examples - Push (2) | dbimpl-12-operators-010, dbimpl-12-operators-012 | unchanged (high) | omit incidental note | 12-set-oriented-execution-models |
| Ch5 | 25 | Examples - Push (3) | dbimpl-12-operators-013 | unchanged (high) | omit incidental note | 12-set-oriented-execution-models |
| Ch5 | 26 | Additional Functionality | dbimpl-12-operators-014 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 27 | Implementing Subscripts | dbimpl-12-operators-015 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 28 | Implementing Subscripts (2) | dbimpl-12-operators-016 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 29 | Implementing Subscripts (3) | dbimpl-12-operators-017 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 30 | Implementing Subscripts (4) | dbimpl-12-operators-018 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 31 | Implementing Subscripts (5) | dbimpl-12-operators-019 | unchanged (high) | omit incidental note | 13-pipelining-and-parallelization |
| Ch5 | 32 | Pipelining | dbimpl-12-operators-020 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 33 | Pipelining (2) | dbimpl-12-operators-021 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch5 | 34 | Parallelization | dbimpl-12-operators-022 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch6 | 1 | Algebraic Operators | dbimpl-12-operators-023 | unchanged (high) | none | 13-pipelining-and-parallelization |
| Ch6 | 2 | Algebraic Operators | dbimpl-12-operators-024 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 3 | Table Scan | dbimpl-12-operators-025 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 4 | Selection | dbimpl-12-operators-026 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 5 | Map | dbimpl-12-operators-027 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 6 | Join | dbimpl-12-operators-028 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 7 | Nested-Loop Join | dbimpl-12-operators-029, dbimpl-12-operators-031 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 8 | Blockwise-Nested-Loop Join | dbimpl-12-operators-030, dbimpl-12-operators-032 | unchanged (high) | omit incidental note | 14-relational-operators-and-joins |
| Ch6 | 9 | Blockwise-Nested-Loop Join (2) | dbimpl-12-operators-033, dbimpl-12-operators-035 | unchanged (high) | omit incidental note | 14-relational-operators-and-joins |
| Ch6 | 10 | Sort-Merge Join | dbimpl-12-operators-034, dbimpl-12-operators-036 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 11 | Sort-Merge Join (2) | dbimpl-12-operators-037 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 12 | Sort-Merge Join (3) | dbimpl-12-operators-038, dbimpl-12-operators-040 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 13 | Hash-Join | dbimpl-12-operators-039, dbimpl-12-operators-041 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 14 | Hash-Join (2) | dbimpl-12-operators-042 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 15 | Hash-Join (3) | dbimpl-12-operators-043 | unchanged (high) | include supplement | 14-relational-operators-and-joins |
| Ch6 | 16 | Hash-Join (4) | dbimpl-12-operators-044 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 17 | Hash-Join (5) | dbimpl-12-operators-045 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 18 | Hash-Join (6) | dbimpl-12-operators-046, dbimpl-12-operators-048 | unchanged (high) | include supplement | 14-relational-operators-and-joins |
| Ch6 | 19 | Hash-Join (7) | dbimpl-12-operators-047, dbimpl-12-operators-049 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 20 | Hash-Join (8) | dbimpl-12-operators-050 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 21 | Hash-Join (9) | dbimpl-12-operators-051, dbimpl-12-operators-053 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 22 | Singleton Join | dbimpl-12-operators-052, dbimpl-12-operators-054 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 23 | Non-Inner Joins | dbimpl-12-operators-055, dbimpl-13-codegen-001 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 24 | Non-Inner Joins (2) | dbimpl-12-operators-056 | unchanged (high) | none | 14-relational-operators-and-joins |
| Ch6 | 25 | Non-Inner Joins (3) | dbimpl-12-operators-057 | unchanged (high) | omit incidental note | 14-relational-operators-and-joins |
| Ch6 | 26 | Sort | dbimpl-12-operators-058, dbimpl-13-codegen-002 | unchanged (high) | omit incidental note | 15-sort-group-and-set-operations |
| Ch6 | 27 | Sort (2) | dbimpl-13-codegen-003 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 28 | Sort (3) | dbimpl-13-codegen-004 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 29 | Sort (4) | dbimpl-13-codegen-005 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 30 | Group By | dbimpl-13-codegen-006 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 31 | Group By (2) | dbimpl-13-codegen-007 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 32 | Set Operations | dbimpl-13-codegen-008 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 33 | Set Operations (2) | dbimpl-13-codegen-009 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 34 | Set Operations (3) | dbimpl-13-codegen-010 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 35 | Set Operations (4) | dbimpl-13-codegen-011 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 36 | Set Operations (5) | dbimpl-13-codegen-012 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 37 | Set Operations (6) | dbimpl-13-codegen-013 | unchanged (high) | none | 15-sort-group-and-set-operations |
| Ch6 | 38 | Set Operations (7) | dbimpl-13-codegen-014 | unchanged (high) | none | 15-sort-group-and-set-operations |

## Method and limits

Printed text was extracted with Poppler, every page was rendered at 144 dpi and visually reviewed, and mappings were verified by title, text/pseudocode, sequence, and global slide position. The baseline is the captured 2021 recordings and occurrence index, not a proven complete 2021 master deck. Consequently, this audit does not infer removals from recording boundaries.

Machine-readable details and exact image paths are in `chapters-5-6.json`; site-ready teaching cards are in `supplements-5-6.json`.
