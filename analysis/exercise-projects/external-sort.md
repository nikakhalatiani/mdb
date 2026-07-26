# External sort exercise audit

## Best learning format

Use this as Exercise Lab 04. The page should teach the algorithm and then make the student audit the implementation, because the submitted code is ordering-correct on the inspected tests but violates the assignment's most explicit systems constraint.

Recommended sequence:

1. form memory-bounded sorted runs;
2. prove the k-way heap invariant;
3. trace a concrete multi-run merge;
4. budget *all* simultaneous heap allocations;
5. calculate fan-in, levels, and I/O;
6. compare simple runs with replacement selection;
7. connect sorting to sort-merge join, grouping, and duplicate-sensitive operators.

Primary course home: `15-sort-group-and-set-operations`. Supporting links belong to `02-storage-architecture-and-memory-hierarchy` and `14-relational-operators-and-joins`.

## Verified assignment contract

- Input is `num_values` little-endian `uint64_t`s; output must contain the same multiset in ascending order (`external-sort/include/moderndbs/external_sort.h:12-22`).
- Use sorted runs and k-way merge (`external-sort/README.md:8-23`).
- The program **must not use more heap bytes than `mem_size`** (`README.md:15-18`). This is a hard ceiling, not a suggestion.
- The destination must be resized before block writes (`include/moderndbs/file.h:32-67`; enforced by `TestFile` at `test/external_sort_test.cc:68-90`).

## What the implementation actually does

- Computes `V = floor(mem_size / 8)` and creates simple runs of at most `V` values using `std::sort` (`src/external_sort.cc:49-88,238-260`).
- Stores each run in an anonymous temporary file and tracks `{File, num_values}` (`13-16,70-74`; `src/file/posix_file.cc:121-132`).
- Gives every run a buffered cursor. A min-heap of `{value, run_index}` keeps one frontier value per active run (`src/external_sort.cc:18-27,90-124,140-184`).
- Splits the advertised payload budget roughly half to output and half among input buffers (`133-160`).
- Merges in groups of at most `max(2, V/4)`, and also triggers a merge while forming runs whenever that threshold is reached (`79-84,198-216,251-267`).
- Copies the final temporary run into the caller's output with another `V`-value vector (`218-234`).

The core ordering invariant is sound: every run is sorted, the heap holds each run's smallest unseen value, and pop/refill therefore emits the global sequence in order while preserving duplicates.

## Hard heap-memory audit

The report's memory conclusion is not reliable.

At merge time, the implementation's input and output **payload vectors alone** consume approximately all `mem_size`. Outside that accounting it allocates:

- a `RunCursor` array;
- one vector allocation per cursor;
- the priority queue's `HeapEntry` vector and spare capacity;
- current and new `Run` vectors;
- one heap-allocated `PosixFile` per live run;
- allocator metadata and transient reallocation storage.

Record layouts on the audited 64-bit ABI:

- `Run`: 16 bytes;
- `HeapEntry`: 16 bytes;
- `RunCursor`: 64 bytes.

For `mem_size = 1024`, `V = 128`, and `k = 32`, a conservative simultaneous lower bound is:

- input payloads: `32 × 2 × 8 = 512` bytes;
- output payload: `64 × 8 = 512`;
- cursor array: `32 × 64 = 2048`;
- heap entries: at least `32 × 16 = 512`;
- existing Run array: at least `32 × 16 = 512`.

That is already 4096 bytes—4× the contract—before `PosixFile` objects, the destination Run, allocator headers, and vector growth.

I compiled the actual implementation with a harness that counts live sizes requested through global `operator new/new[]`. Input/output files were created before the baseline, and allocator headers were deliberately excluded. The peak additional request was:

```text
mem_size=1024
peak_additional_requested_heap=4888
ratio=4.77x
```

Run formation and final copying also allocate a payload vector of exactly `mem_size` while Run/File bookkeeping remains live. Therefore the code decisively violates the README's hard ceiling even under a generous accounting model.

## I/O scheduling audit

Periodic merging solves one real problem: it bounds the number of live temporary files. But it introduces a major I/O inefficiency.

When the run count reaches `k`, the implementation merges the *whole current set* down to one run. It then accumulates `k-1` fresh runs and merges the already-large accumulated run again. Old values are repeatedly read and written. With `k = 2`, every new initial run is merged into the whole prefix, giving quadratic rewrite work in the number of runs.

A balanced plan instead merges disjoint groups of at most `k` at each level. For `R` initial runs, it needs roughly `ceil(log_k R)` merge levels, and each value is read and written once per full level.

Correct ordering does not imply an I/O-efficient merge schedule.

## Important corrections and caveats

- The report changes the hard requirement to “respect the memory limit as much as possible” (`external-sort-report.md:34-39`). That is not what the README says.
- The report claims `/4` leaves room for buffers (`413-429`). In reality, payload buffers already consume the budget and cursor/heap/run/file storage is additional.
- The report says a memory-sized phase-1 chunk stays within memory (`483-485`), ignoring simultaneous Run/File allocations.
- The optional `LimitedMemory` test is enclosed by `RUN_LIMITED_MEMORY_TEST`, a macro the supplied CMake files never define (`test/external_sort_test.cc:217-299`; `test/local.cmake:9-18`). Even enabled, its tighter check permits about `2 × mem_size` plus output storage.
- For nonempty input and `mem_size < 8`, the function truncates output to zero (`src/external_sort.cc:238-249`). This is an incorrect result, not a valid defensive behavior.
- Offset/size multiplications are unchecked for overflow.
- The public format is little-endian, but the code uses native `uint64_t` representation and assumes a little-endian host.

## Test-derived lessons

- `EmptyFile`, `OneValue`: ordinary base cases (`test/external_sort_test.cc:105-128`).
- `SmallNoPartialRun`, `SmallPartialLastRun`: three-value runs, repeated merging, and a short final run (`131-182`).
- Parameterized descending/random tests: compare full output with `std::sort` across in-memory and external cases (`303-337,357-372`).
- `SortEqualNumbers`: confirms bag multiplicity is preserved (`340-354`).
- `AdvancedExternalSortTest`: correctness when initial run count greatly exceeds fan-in (`375-385`). It does not assert balanced I/O.
- `LimitedMemory`: an optional loose guard, not a proof of the hard contract (`217-299`).

The command-line tool was compiled with the core implementation. Sorting 50 descending values with `mem_size = 24` produced exactly 1 through 50. This confirms a representative correctness path, not memory compliance.

## Worked trace worth putting on the site

For input `[10,5,2,9,3,8,1,4,6,7]` and `mem_size = 24`, the code uses `V=3`, `k=2`:

1. A = `[2,5,10]`, B = `[3,8,9]`; threshold reached, merge to C = `[2,3,5,8,9,10]`.
2. D = `[1,4,6]`; merge C+D to E = `[1,2,3,4,5,6,8,9,10]`.
3. Partial F = `[7]`; merge E+F to G = `[1,2,3,4,5,6,7,8,9,10]`.
4. Copy G to output.

This trace simultaneously teaches heap correctness and exposes repeated rewriting of C and E.

## Exact lecture anchors

- `dbimpl-01-storage-016`, `017`, `018`, `019`: memory hierarchy, disk latency, and block transfer.
- `dbimpl-13-codegen-002`: external-sort purpose and run/merge overview.
- `dbimpl-13-codegen-003`: in-memory accumulation, full and partial run flush, merge before forwarding.
- `dbimpl-13-codegen-004`: quicksort runs versus replacement selection.
- `dbimpl-13-codegen-005`: parallel run heads, priority queue/loser tree, fan-in, and partial merge levels.
- `dbimpl-12-operators-036`, `037`, `038`: sort-merge join as a downstream consumer.

Do not use `dbimpl-12-operators-058` as a substantive explanation; its aligned explanation says it only announces the next lecture.

## High-value exam drills

- Prove the one-head-per-run heap invariant.
- Compute `R`, `k`, merge levels, and page I/O with clear counting conventions.
- Audit the `/4` memory claim using simultaneous live allocations.
- Explain why early whole-set merging is correct but I/O-heavy.
- Compare simple quicksort runs with replacement selection.
- Debug the `mem_size < 8` behavior.

## Evidence quality

README and public API define the hard contract. Tests were used as functional specifications. Source, tool, benchmark, report, and git history were inspected. The report is useful for structure and development history but materially wrong about memory compliance and incomplete about I/O scheduling.

Complete renderer-ready data and every source/lecture reference are in `analysis/exercise-projects/external-sort.json`.
