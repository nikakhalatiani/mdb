# B+-Tree Exercise Audit

## Recommended role in the site

Present this as an implementation lab attached primarily to Chapter 07, with supporting links to Chapters 03, 04, and 08. It should not be a source-code dump. Its strongest learning sequence is:

1. derive the page layout and the tested capacity;
2. lock down the exact max-of-left separator convention;
3. trace recursive split propagation and root creation;
4. contrast the assignment-level erase with complete deletion;
5. explicitly replace the project's coarse mutex with the lecture's lock-coupling/safe-page/restart model for exam study.

The fifth point needs a visible warning. The README requires the concurrency techniques from `Concurrent Access (2)` and `(3)`, but the implementation serializes all public operations with `tree_mutex` (`include/moderndbs/btree.h:257-317,343-345`). It is race-safe for the visible multithread test, but it is not the intended algorithm and should never be taught as lock coupling.

## Verified implementation model

- A node is placement-constructed inside one fixed buffer frame.
- Child references are segment-qualified page IDs, not pointers.
- Leaf `count` is records; inner `count` is children, so valid inner keys are `count - 1`.
- The tested 1 KiB/64-bit instantiation has capacity 63 and a 1016-byte leaf/inner node.
- Separators use `separator[i] = max(child[i])`; equality descends left.
- Duplicate insert updates the existing value.
- Full leaves and inner pages split recursively; a root split creates a new two-child root.
- Erase only removes from a leaf. It does not redistribute, merge, release pages, or shrink the root.
- The optional leaf links are omitted, so the project does not support efficient range scans.

## Best worked example

Reuse `BTreeTest.InsertLeafNodeSplit` as a visual trace. Fill a 63-record root leaf with `0..62`, then insert `424242`:

- split to left `0..31` and right `32..62`;
- return separator `31`, the left maximum;
- insert `424242` into the right page;
- create a new level-1 root with key `31` and the two leaf page IDs.

This one trace makes page capacity, split balance, equality-left routing, split propagation, and height growth concrete.

## Tests as specifications

The strongest visible evidence is:

- `Capacity` (`test/btree_test.cc:21-39`) — compile-time layout, not a magic capacity;
- `LeafNodeSplit` (`:102-154`) — exact split counts and max-of-left separator;
- `InsertLeafNodeSplit` (`:197-227`) — root creation;
- `LookupMultipleSplits*` and `LookupRandom*` (`:287-395`) — recursive routing, insertion order, and duplicate updates;
- `Erase` (`:398-415`) — key disappearance only, not complete deletion;
- `MultithreadWriters` (`:417-444`) — basic safety under a global mutex, not scalable latch concurrency.

Important gaps: no direct inner-node unit tests, real I/O/eviction, reopen/persistence, delete rebalancing, mixed concurrent update schedules, or alternate comparator semantics.

## Exact lecture anchors

- Buffer pages/frames: `dbimpl-01-storage-021`, `dbimpl-01-storage-023`
- Segments/page allocation: `dbimpl-02-storage-access-001`, `dbimpl-02-storage-access-002`
- B-tree invariants: `dbimpl-04-access-btrees-018`
- B+-tree payload placement: `dbimpl-04-access-btrees-022`
- Page layout: `dbimpl-04-access-btrees-031`
- Lookup: `dbimpl-04-access-btrees-041`
- Insert/split: `dbimpl-05-access-btrees-003`
- Full deletion: `dbimpl-05-access-btrees-004`
- Range scan/leaf links: `dbimpl-05-access-btrees-005`
- Lock coupling: `dbimpl-05-access-btrees-008`
- Safe inner pages: `dbimpl-05-access-btrees-009`
- Restart strategy: `dbimpl-05-access-btrees-010`
- B-link alternative: `dbimpl-05-access-btrees-011`, `dbimpl-05-access-btrees-012`

## Exam transfer

This lab directly supports existing questions `protocol-q-010`, `protocol-q-013`, and especially `supplement-lock-coupling`. The highest-value drill is to repair flawed traversal pseudocode:

- latch parent;
- choose child;
- latch child before releasing parent;
- acquire in root-to-leaf order;
- never retain a child and acquire an ancestor;
- handle upward split risk with safe inner pages or release/restart.

The student's code is useful for page layout, separators, and split propagation. The lecture, not the code, is the authority for concurrency and complete deletion.

## Audit boundary

The prebuilt tester is a Linux AArch64 ELF without executable permission on this macOS host, and CMake is unavailable here, so this audit is static. The fake buffer manager itself states that it performs no I/O, ignores the frame limit, never evicts, and ignores dirty state (`src/buffer_manager.cc:4-7,28-65`). The JSON audit records these limitations explicitly.
