# Chapter 4 — 2026 lecture audit

Source: `/Users/nkhalatiani/Downloads/chapter4_260717_153133.pdf`

## Verdict

- 119 physical pages = 119 logical printed slides.
- 49 slides have exact captured 2021 occurrence matches.
- 70 slides are baseline coverage gaps; none is defensibly established as new curriculum.
- 0 pages contain flattened handwriting. The full page was inspected, including diagrams and white space; repeated crash/lightning zigzags in recovery diagrams are printed artwork.
- No site files were edited.

The 70 gaps are page 10 (`Dirty Read`), pages 14–81 (the supplied recording corpus has no dbimpl-08 or dbimpl-09), and page 116 (`Checkpoints (3)`). Page 10's explanation is present in `dbimpl-07-transactions-057`; page 116's action-consistent checkpoint explanation is present in `dbimpl-10-recovery-037`. Those two need a current printed visual attached to already-captured speech, not a claim of new teaching.

## Exam-preparation signal

Transaction histories on pages 17–40 are the strongest practice target because the exact final exercise and an independent older-exam recollection converge on conflicts, precedence graphs, serializability, RC, ACA, and strictness. MGL (pages 64–73) and timestamp ordering (pages 74–78) are current printed coverage and also appear in incomplete student protocols. All such signals are study priorities only; official exam scope is unknown.

## Page audit

| PDF page | Printed title | Classification | Exact 2021 occurrence IDs | Related 2021 speech | Existing site chapter |
|---:|---|---|---|---|---|
| 1 | Transactions and Recovery | unchanged | dbimpl-07-transactions-049 | — | 10-transaction-foundations |
| 2 | Transactions and Recovery | unchanged | dbimpl-07-transactions-050 | — | 10-transaction-foundations |
| 3 | Why Transactions? | unchanged | dbimpl-07-transactions-051 | — | 10-transaction-foundations |
| 4 | Operations | unchanged | dbimpl-07-transactions-052 | — | 10-transaction-foundations |
| 5 | ACID | unchanged | dbimpl-07-transactions-053 | — | 10-transaction-foundations |
| 6 | Transactions and Recovery | unchanged | dbimpl-07-transactions-054 | — | 10-transaction-foundations |
| 7 | Technical Aspects | unchanged | dbimpl-07-transactions-055 | — | 10-transaction-foundations |
| 8 | Multi User Synchronization | unchanged | dbimpl-07-transactions-056 | — | 10-transaction-foundations |
| 9 | Lost Update | unchanged | dbimpl-07-transactions-057 | — | 10-transaction-foundations |
| 10 | Dirty Read | coverage-gap | — | dbimpl-07-transactions-057 | 10-transaction-foundations |
| 11 | Non-Repeatable Read | unchanged | dbimpl-07-transactions-058, dbimpl-07-transactions-060, dbimpl-07-transactions-062 | — | 10-transaction-foundations |
| 12 | Phantom Problem | unchanged | dbimpl-07-transactions-059, dbimpl-07-transactions-061, dbimpl-07-transactions-063 | — | 10-transaction-foundations |
| 13 | Serial Execution | unchanged | dbimpl-07-transactions-064 | — | 10-transaction-foundations |
| 14 | Formal Definition of a Transaction | coverage-gap | — | — | 10-transaction-foundations |
| 15 | Formal Definition of a Transaction (2) | coverage-gap | — | — | 10-transaction-foundations |
| 16 | Example | coverage-gap | — | — | 10-transaction-foundations |
| 17 | Schedules | coverage-gap | — | — | 10-transaction-foundations |
| 18 | Conflicting Operations | coverage-gap | — | — | 10-transaction-foundations |
| 19 | Definition of a Schedule | coverage-gap | — | — | 10-transaction-foundations |
| 20 | Example | coverage-gap | — | — | 10-transaction-foundations |
| 21 | (Conflict-)Equivalence | coverage-gap | — | — | 10-transaction-foundations |
| 22 | Example | coverage-gap | — | — | 10-transaction-foundations |
| 23 | Serializability | coverage-gap | — | — | 10-transaction-foundations |
| 24 | Serializability (2) | coverage-gap | — | — | 10-transaction-foundations |
| 25 | Serializability (3) | coverage-gap | — | — | 10-transaction-foundations |
| 26 | Serializability Graph | coverage-gap | — | — | 10-transaction-foundations |
| 27 | Example | coverage-gap | — | — | 10-transaction-foundations |
| 28 | Example (2) | coverage-gap | — | — | 10-transaction-foundations |
| 29 | Example (3) | coverage-gap | — | — | 10-transaction-foundations |
| 30 | Example (4) | coverage-gap | — | — | 10-transaction-foundations |
| 31 | Example (5) | coverage-gap | — | — | 10-transaction-foundations |
| 32 | Additional Properties of a Schedule | coverage-gap | — | — | 10-transaction-foundations |
| 33 | Additional Properties of a Schedule (2) | coverage-gap | — | — | 10-transaction-foundations |
| 34 | Recoverability | coverage-gap | — | — | 10-transaction-foundations |
| 35 | Recoverability (2) | coverage-gap | — | — | 10-transaction-foundations |
| 36 | Cascading Aborts | coverage-gap | — | — | 10-transaction-foundations |
| 37 | Cascading Aborts (2) | coverage-gap | — | — | 10-transaction-foundations |
| 38 | Strictness | coverage-gap | — | — | 10-transaction-foundations |
| 39 | Strictness (2) | coverage-gap | — | — | 10-transaction-foundations |
| 40 | Classification of Schedules | coverage-gap | — | — | 10-transaction-foundations |
| 41 | Scheduler | coverage-gap | — | — | 10-transaction-foundations |
| 42 | Pessimistic Scheduler | coverage-gap | — | — | 10-transaction-foundations |
| 43 | Optimistic Scheduler | coverage-gap | — | — | 10-transaction-foundations |
| 44 | Lock-based Scheduling | coverage-gap | — | — | 10-transaction-foundations |
| 45 | Two-Phase Locking | coverage-gap | — | — | 10-transaction-foundations |
| 46 | Definition | coverage-gap | — | — | 10-transaction-foundations |
| 47 | Two Phases | coverage-gap | — | — | 10-transaction-foundations |
| 48 | Concurrency with 2PL | coverage-gap | — | — | 10-transaction-foundations |
| 49 | Strict 2PL | coverage-gap | — | — | 10-transaction-foundations |
| 50 | Strict 2PL (2) | coverage-gap | — | — | 10-transaction-foundations |
| 51 | Lock Manager | coverage-gap | — | — | 10-transaction-foundations |
| 52 | Lock Manager (2) | coverage-gap | — | — | 10-transaction-foundations |
| 53 | Lock Manager (3) | coverage-gap | — | — | 10-transaction-foundations |
| 54 | Reducing the Lock Size | coverage-gap | — | — | 10-transaction-foundations |
| 55 | Reducing the Lock Size (2) | coverage-gap | — | — | 10-transaction-foundations |
| 56 | Deadlocks | coverage-gap | — | — | 10-transaction-foundations |
| 57 | Deadlock Detection | coverage-gap | — | — | 10-transaction-foundations |
| 58 | Waits-for graph | coverage-gap | — | — | 10-transaction-foundations |
| 59 | Implementing Deadlock Detection | coverage-gap | — | — | 10-transaction-foundations |
| 60 | Online Cycle Detection | coverage-gap | — | — | 10-transaction-foundations |
| 61 | Online Cycle Detection (2) | coverage-gap | — | — | 10-transaction-foundations |
| 62 | Online Cycle Detection (3) | coverage-gap | — | — | 10-transaction-foundations |
| 63 | Online Cycle Detection (4) | coverage-gap | — | — | 10-transaction-foundations |
| 64 | Multi-Granularity Locking | coverage-gap | — | — | 10-transaction-foundations |
| 65 | MGL | coverage-gap | — | — | 10-transaction-foundations |
| 66 | Additional Lock Modes for MGL | coverage-gap | — | — | 10-transaction-foundations |
| 67 | Compatibility Matrix | coverage-gap | — | — | 10-transaction-foundations |
| 68 | Protocol | coverage-gap | — | — | 10-transaction-foundations |
| 69 | Example | coverage-gap | — | — | 10-transaction-foundations |
| 70 | Example (2) | coverage-gap | — | — | 10-transaction-foundations |
| 71 | Example (3) | coverage-gap | — | — | 10-transaction-foundations |
| 72 | Using MGL for Lock Management | coverage-gap | — | — | 10-transaction-foundations |
| 73 | Preventing Phantom Problems without MGL | coverage-gap | — | — | 10-transaction-foundations |
| 74 | Timestamp Based Approaches | coverage-gap | — | — | 10-transaction-foundations |
| 75 | Timestamps | coverage-gap | — | — | 10-transaction-foundations |
| 76 | Timestamps (2) | coverage-gap | — | — | 10-transaction-foundations |
| 77 | Commit Order | coverage-gap | — | — | 10-transaction-foundations |
| 78 | Limitations | coverage-gap | — | — | 10-transaction-foundations |
| 79 | Snapshot Isolation | coverage-gap | — | — | 10-transaction-foundations |
| 80 | Snapshot Isolation (2) | coverage-gap | — | — | 10-transaction-foundations |
| 81 | Snapshot Isolation (3) | coverage-gap | — | — | 10-transaction-foundations |
| 82 | Recovery | unchanged | dbimpl-10-recovery-001 | — | 11-recovery-and-aries |
| 83 | Recovery (2) | unchanged | dbimpl-10-recovery-002 | — | 11-recovery-and-aries |
| 84 | System Failure | unchanged | dbimpl-10-recovery-003 | — | 11-recovery-and-aries |
| 85 | Main Memory Loss | unchanged | dbimpl-10-recovery-004 | — | 11-recovery-and-aries |
| 86 | Aborting a Transaction | unchanged | dbimpl-10-recovery-005 | — | 11-recovery-and-aries |
| 87 | Classification of Failures | unchanged | dbimpl-10-recovery-006 | — | 11-recovery-and-aries |
| 88 | Storage Hierarchy | unchanged | dbimpl-10-recovery-007 | — | 11-recovery-and-aries |
| 89 | Storage Hierarchy (2) | unchanged | dbimpl-10-recovery-008 | — | 11-recovery-and-aries |
| 90 | Storage Hierarchy (3) | unchanged | dbimpl-10-recovery-009 | — | 11-recovery-and-aries |
| 91 | Effects on Recovery | unchanged | dbimpl-10-recovery-010 | — | 11-recovery-and-aries |
| 92 | Update Strategies | unchanged | dbimpl-10-recovery-011 | — | 11-recovery-and-aries |
| 93 | System Configuration | unchanged | dbimpl-10-recovery-012 | — | 11-recovery-and-aries |
| 94 | ARIES | unchanged | dbimpl-10-recovery-013 | — | 11-recovery-and-aries |
| 95 | Writing the Log | unchanged | dbimpl-10-recovery-014 | — | 11-recovery-and-aries |
| 96 | Writing the Log (2) | unchanged | dbimpl-10-recovery-015 | — | 11-recovery-and-aries |
| 97 | Writing the Log (3) | unchanged | dbimpl-10-recovery-016 | — | 11-recovery-and-aries |
| 98 | Writing the Log (4) | unchanged | dbimpl-10-recovery-017 | — | 11-recovery-and-aries |
| 99 | Restart after Failure | unchanged | dbimpl-10-recovery-018 | — | 11-recovery-and-aries |
| 100 | Restart Phases | unchanged | dbimpl-10-recovery-019 | — | 11-recovery-and-aries |
| 101 | Restart Phases (2) | unchanged | dbimpl-10-recovery-020, dbimpl-10-recovery-022 | — | 11-recovery-and-aries |
| 102 | Structure of Log Entries | unchanged | dbimpl-10-recovery-021 | — | 11-recovery-and-aries |
| 103 | Structure of Log Entries (2) | unchanged | dbimpl-10-recovery-023 | — | 11-recovery-and-aries |
| 104 | Structure of Log Entries (3) | unchanged | dbimpl-10-recovery-024 | — | 11-recovery-and-aries |
| 105 | Example | unchanged | dbimpl-10-recovery-025, dbimpl-10-recovery-028 | — | 11-recovery-and-aries |
| 106 | The Phases - Analysis | unchanged | dbimpl-10-recovery-026 | — | 11-recovery-and-aries |
| 107 | The Phases - Redo | unchanged | dbimpl-10-recovery-027, dbimpl-10-recovery-029 | — | 11-recovery-and-aries |
| 108 | The Phases - Undo | unchanged | dbimpl-10-recovery-030 | — | 11-recovery-and-aries |
| 109 | Idempotent Restart | unchanged | dbimpl-10-recovery-031 | — | 11-recovery-and-aries |
| 110 | Idempotent Restart (2) | unchanged | dbimpl-10-recovery-032 | — | 11-recovery-and-aries |
| 111 | Log Entries after Restart | unchanged | dbimpl-10-recovery-033 | — | 11-recovery-and-aries |
| 112 | CLR | unchanged | dbimpl-10-recovery-034 | — | 11-recovery-and-aries |
| 113 | Partial Rollback | unchanged | dbimpl-10-recovery-035 | — | 11-recovery-and-aries |
| 114 | Checkpoints | unchanged | dbimpl-10-recovery-036 | — | 11-recovery-and-aries |
| 115 | Checkpoints (2) | unchanged | dbimpl-10-recovery-037 | — | 11-recovery-and-aries |
| 116 | Checkpoints (3) | coverage-gap | — | dbimpl-10-recovery-037 | 11-recovery-and-aries |
| 117 | Checkpoints (4) | unchanged | dbimpl-10-recovery-038 | — | 11-recovery-and-aries |
| 118 | Checkpoints (5) | unchanged | dbimpl-10-recovery-039, dbimpl-10-recovery-040 | — | 11-recovery-and-aries |
| 119 | Fuzzy Checkpoints | unchanged | dbimpl-10-recovery-041 | — | 11-recovery-and-aries |

## Site-ready supplements

`analysis/lecture-2026/supplements-chapter4.json` contains 70 items, one for every printed coverage-gap slide. It follows the same `items` schema as `supplements-1-3.json`, includes the source image path, two teaching paragraphs, key points, conservative exam signal, self-test, and existing chapter destination. No handwriting-only supplement was created because no material handwriting exists in this deck.
