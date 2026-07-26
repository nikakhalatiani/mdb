# Slotted Pages Exercise Audit

## Recommended role in the site

Make this the implementation lab for Chapter 05, with supporting anchors in Chapters 03, 04, and 06. The best teaching order is:

1. draw the header, slots, contiguous gap, and record region;
2. compute total versus contiguous free space after deletes;
3. compact records without changing live slot IDs;
4. decode the tagged eight-byte slot;
5. trace one-hop resize redirection and target cleanup;
6. use the FSI as a conservative candidate filter, not an exact oracle;
7. contrast the project's point-access behavior with the fuller lecture scan/recovery contract.

This exercise has unusually high exam value because `protocol-q-006` asks for the final page after insert A, insert B, delete A, while `protocol-q-007` asks students to interpret page hexdumps, TIDs, redirects, and redirect targets.

## Verified implementation model

- `TID = (segment-local page << 16) | slot`; BufferManager page IDs reattach the segment in the high 16 bits.
- A 12-byte header is followed by eight-byte slots; record bytes grow backward from the page end.
- `free_space` is total reclaimable capacity after compaction. The current contiguous gap is `data_start - slot_end`; their difference is fragmentation.
- Allocation reuses `first_free_slot`, charges a new slot only when needed, and compacts only when total space is sufficient but the gap is not.
- Compaction keeps slot indices stable, memmoves local records by descending old offset, and updates their offsets.
- Same-page resize preserves the payload prefix and zero-fills growth.
- Cross-page resize leaves the original slot as one redirect. A later target move rewrites that original redirect and erases the old target.
- FSI packs two four-bit entries per byte and spans pages using `entries_per_page = page_size * 2`.
- Every candidate from a hint or FSI is checked against the actual page before allocation.

## Important corrections to the report

### “FSI persistence” is narrower than disk persistence

`FSIPersistence` destroys and recreates `FSISegment`, but keeps one `BufferManager`. The dummy manager stores pages in an in-memory map and explicitly performs no disk I/O or dirty handling (`src/buffer_manager.cc:4-8,26-38`). The test proves that FSI state lives in buffer-page bytes rather than the FSISegment object. It does not prove restart persistence.

### Conservative FSI encoding can waste substantial capacity

The encoding is safe because `decode(encode(x)) <= x`, but its fixed table jumps from 896 bytes to “completely empty page.” On a 1 KiB page, 1000 free bytes encode as 896, so `find(900)` returns no candidate. On the benchmark's 4 KiB pages, nearly every nonempty page with more than 896 bytes free still encodes as 896. Teach this as a correct but coarse lower-bound index.

### The marker alone does not implement stable scan identity

The code marks redirect targets, and point reads/writes preserve the original caller TID. However, the lecture says a sequential scan should skip forwarding stubs and report a relocated physical target under its original TID. The project neither stores the original TID with the target payload nor exposes a scan API. Use `dbimpl-03-access-tuples-015` for the full exam answer.

### Recovery/concurrency are out of scope in the implementation

The lecture header contains an LSN; this project's header does not. Redirect replacement touches source, old target, new target, FSI, and sometimes schema metadata in separate fix/unfix operations without WAL or crash atomicity. The dummy BufferManager has no latches and is not thread-safe.

## Best worked trace

For a 1024-byte page, allocate A=200 and B=200:

- A: slot 0, offset 824;
- B: slot 1, offset 624;
- after both, total and contiguous free space are 596.

Delete A:

- slot 0 becomes reusable;
- B stays at offset 624;
- total free space becomes 796;
- contiguous free space stays 596;
- fragmentation is 200.

Now allocate C=700. Reusing slot 0 needs no new slot bytes. Total space fits but the gap does not, so compaction moves B to offset 824 while preserving slot 1, then places C at offset 124 in slot 0. This is an excellent exam drawing because every header field has a reason.

## Strongest implementation/test anchors

- Page/TID/slot encoding: `include/moderndbs/slotted_page.h:14-98`
- Allocation and fragmentation: `src/slotted_page.cc:67-109`
- Relocate and prefix preservation: `src/slotted_page.cc:111-167`
- Erase and trailing slot trim: `src/slotted_page.cc:169-201`
- Compaction: `src/slotted_page.cc:203-233`
- FSI encoding/update/find: `src/fsi_segment.cc:54-142`
- Exact candidate verification/new page: `src/sp_segment.cc:178-240`
- Read/write redirect limit: `src/sp_segment.cc:242-308`
- Redirect replacement and cleanup: `src/sp_segment.cc:310-373`
- Fragmentation/payload regression tests: `test/slotted_page_test.cc:174-220`
- FSI persistence and spanning: `test/segment_test.cc:220-244,533-576`
- Repeated redirects/erase cleanup: `test/segment_test.cc:579-635`
- Deterministic fuzzing: `test/segment_test.cc:402-529`

## Exact lecture anchors

- Buffer frame contract: `dbimpl-01-storage-021`, `dbimpl-01-storage-023`
- FSI purpose/encoding/scan/hints: `dbimpl-02-storage-access-032` through `-035`
- Stable TID and point redirect: `dbimpl-03-access-tuples-001`
- Opposing growth and lazy compaction: `dbimpl-03-access-tuples-004`
- Header fields and first-free optimization: `dbimpl-03-access-tuples-005`
- Free slot versus zero-length record: `dbimpl-03-access-tuples-006`
- Undo motivation for slot-resident redirects: `dbimpl-03-access-tuples-007`, `-010`
- Tagged slot and scan-time original identity: `dbimpl-03-access-tuples-015`
- One-page record scope boundary: `dbimpl-03-access-tuples-045`, `dbimpl-04-access-btrees-003`, `-004`

## Verification performed

The full project suite could not be invoked because this checkout has no build directory and CMake is unavailable. I compiled and ran focused clang++ smoke programs instead:

- fragmented erase followed by compaction and byte-for-byte payload checks;
- grow/shrink relocation and zero-filled extension;
- FSI conservatism for every 0..1023 byte value;
- target page 2050 through the second FSI page;
- one-hop redirect creation, direct target replacement, old-target erase, and final source erase.

All of those focused checks passed. The JSON records the remaining persistence, scan, concurrency, recovery, range, and stale-TID gaps explicitly.
