# Algebraic Operators — audit notes

## Best learning format

Use this project as a single **implementation lab** with chapter-specific entry points, not as a source-code dump. Its strongest teaching value is the connection between operator semantics, iterator state, pipeline behavior, and exam pseudocode.

The page should contain:

1. A compact `open → next* → close` lifecycle trace with the stable-register-pointer rule.
2. Operator cards for Projection, Select, Sort, HashJoin, HashAggregation, and the set/bag operators.
3. A plan trace using the benchmark pipeline: Projection → Sort → HashAggregation → HashJoin → Select.
4. A multiplicity workbench for UNION/INTERSECT/EXCEPT with and without `ALL`.
5. Exam drills for UNION, right anti-join, the ambiguous remembered “full anti join,” and pipeline coloring.
6. Evidence buttons into the exact lecture intervals listed in the JSON audit.

Primary chapters: `12-set-oriented-execution-models`, `13-pipelining-and-parallelization`, `14-relational-operators-and-joins`, and `15-sort-group-and-set-operations`.

## What is verified

- The README explicitly requires out-of-line tuple passing: Register locations are obtained once during `open()`, then `next()` overwrites those locations ([README.md](/Users/nkhalatiani/Downloads/algebraic-operators/README.md:29)).
- Projection and Select reuse child Register pointers and stream without copying tuple values ([algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:350), [algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:407)).
- Sort consumes all input, stores flat rows, sorts row offsets, and emits through stable owned storage ([algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:450)).
- HashJoin is a build-left/probe-right inner equi-join, but the assignment explicitly assumes unique left keys ([algebra.h](/Users/nkhalatiani/Downloads/algebraic-operators/include/moderndbs/algebra.h:302), [algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:530)).
- HashAggregation implements generic hash grouping with MIN, MAX, SUM, and COUNT ([algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:695)).
- The bonus operators correctly encode set versus bag multiplicities in the submitted implementation and tests ([iterator_model_test.cc](/Users/nkhalatiani/Downloads/algebraic-operators/test/iterator_model_test.cc:482)).

## Important teaching cautions

- Do not generalize the submission’s `key → one left offset` hash table. Duplicate build keys require `key → list of tuples`; otherwise rows are lost.
- The report’s “blocking operators” summary is too broad. `UnionAll` is streaming here. A hash join must finish its build side, but can normally stream probe matches; this submission chooses to materialize all joined output.
- The join-plus-two-key-COUNT fusion is a guarded benchmark optimization ([algebra.cc](/Users/nkhalatiani/Downloads/algebraic-operators/src/algebra.cc:601)). It is useful for discussing operator fusion, but it should not replace the generic exam pseudocode.
- The type system has no NULL, and the tests do not define empty-input SQL aggregation behavior. Present this as the assignment’s simplified model.
- The report says 19 focused tests passed, but the included tester is an ARM64 Linux ELF and cannot be run on this macOS host; `cmake` is also unavailable. Record the claim as report evidence, not independent verification.

## Highest-value exam connections

- `protocol-q-026`: implement UNION in the iterator model.
- `protocol-q-027`: implement a right anti-join.
- `supplement-full-anti-join`: define the nonstandard phrase before implementing marker-based unmatched output.
- Pipeline coloring: use the benchmark’s Select → HashJoin → HashAggregation → Sort → Projection plan.

The exact occurrence mappings, pseudocode patterns, worked multiplicity trace, code/test references, and site-ready card content are in `algebraic-operators.json`.
