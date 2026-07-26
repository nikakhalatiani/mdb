# Exam protocol question map

The analysis is split into two stable maps and three evidence classes:

- `question-map.json` contains 38 possible past-exam prompts from the color-coded `compiled_student_protocol`. The protocol is fallible student recollection, not ground truth.
- `supplement-question-map.json` contains 8 additional `student_recollection` items from WhatsApp. These corroborate themes but do not preserve exact wording or inputs.
- The supplement also contains 5 `course_exercise_practice` tasks from `exercise-slides.pdf`. These are strong evidence for authentic practice formats, but they do **not** prove past or future exam occurrence.

The color legend is preserved exactly: yellow means incomplete, cyan assumption-based, and red impossible to know. No actual prompt was yellow; 11 were wholly red, 3 wholly cyan, and one had only a red sub-fragment. Unmarked text remains fallible.

## Important ambiguities

- Radix trees, timestamp ordering, and multiple-granularity locking have no direct occurrence in the current 527-slide atlas. They are mapped only to chapter context or left unmapped.
- Red prompts lack the input needed to solve them: hexdumps, schemas, code, histories, hash values, or operator fragments must not be invented.
- “FULL anti join” is nonstandard recollection wording and may mean unmatched tuples from both sides; orientation must be verified from any actual code.
- The exercise transaction task strongly matches the recollected history format, but the remembered commit-order variation is not in the exercise slides.
- The exercise photos corroborate the walkthroughs for generated-code reversal, exchange placement, and transaction-history analysis.

Validation target: compiled-protocol IDs are contiguous in document order from `protocol-q-001` through `protocol-q-038`; supplement IDs are contiguous in source order from `supplement-q-001` through `supplement-q-013`. Every referenced occurrence ID must exist in `evidence-index.json` and belong to the stated chapter.
