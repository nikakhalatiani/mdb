# Buffer manager exercise audit

## Best learning format

Use this as Exercise Lab 01, centered on a worked `fix_page`/eviction trace rather than a source-code dump. The strongest teaching sequence is:

1. page vs. frame vs. page-table entry;
2. pin (`fix_count`) vs. page latch vs. dirty state;
3. the assignment's resident FIFO/LRU version of 2Q;
4. miss handling and dirty eviction;
5. lock scope and per-segment I/O;
6. tests as specifications;
7. exam drills that require pseudocode, tracing, and debugging.

Primary course home: `03-buffer-management`. Supporting links belong to `02-storage-architecture-and-memory-hierarchy`, `04-segments-space-and-update-strategies`, and `11-recovery-and-aries`.

## Verified assignment contract

- Implement a configurable, concurrent buffer manager using 64-bit page ids and 2Q replacement (`buffer-manager/README.md:8-21`).
- Page id layout is `[16-bit segment id | 48-bit segment-local page id]`; each segment is a file named by the segment id (`buffer-manager/README.md:13-21`, `include/moderndbs/buffer_manager.h:124-134`).
- `fix_page` returns a shared- or exclusive-latched frame; `unfix_page` releases the fix and optionally marks it dirty (`include/moderndbs/buffer_manager.h:96-112`).
- A full pool must never evict a fixed frame; if all frames are fixed, throw `buffer_full_error` (`src/buffer_manager.cc:152-166`, `test/buffer_manager_test.cc:91-104`).
- Slow I/O and ordinary waits for a page latch must not retain the global manager mutex (`README.md:39-51`, `src/buffer_manager.cc:175-256`, `test/buffer_manager_test.cc:203-266`).

## What the implementation actually does

- Preallocates a fixed vector of frames and uses a hash page table (`src/buffer_manager.cc:24-35`; `include/moderndbs/buffer_manager.h:62-68`).
- New pages enter FIFO. A hit promotes FIFO → LRU or refreshes the LRU tail. Victim selection scans the FIFO head-first and then LRU, skipping `fix_count > 0` (`src/buffer_manager.cc:126-166,178-219`).
- A miss reserves and exclusively latches a frame under `manager_mutex`, publishes the new metadata, releases `manager_mutex`, writes a dirty victim, and reads the requested page. Other callers may find the new mapping but cannot observe partial bytes because they wait on the frame latch (`src/buffer_manager.cc:168-238`).
- `thread_local fixed_pages` remembers each thread's original latch mode and nested-fix count because `unfix_page` does not receive the mode (`src/buffer_manager.cc:9-18,241-286`).
- The manager caches one `File` object per segment and uses a per-segment `shared_mutex` to coordinate cached size, resize, and block I/O (`src/buffer_manager.cc:57-124`; `include/moderndbs/file.h:28-67`).
- Dirty pages are written on eviction or manager destruction. No WAL, page LSN, transaction, background writer, or explicit flush protocol exists.

## Critical invariants to teach

- Every resident page has exactly one page-table mapping and one queue membership.
- `fix_count > 0` forbids eviction.
- A dirty victim is written using its old page id before its bytes are overwritten.
- A frame remains exclusively latched while its advertised new page is loaded.
- Queue metadata changes under `manager_mutex`.
- The global manager mutex is released before disk I/O and before normal hit-path page-latch waits.
- Cached segment size is inspected/changed under the segment mutex.

## Important corrections and caveats

- **Simplified 2Q:** this is the course assignment's resident FIFO + resident LRU design. It has no A1out ghost-history queue or explicit queue-size targets. Do not present it as the only canonical 2Q design.
- **Nested lock upgrade bug:** if one thread fixes a page shared and then fixes it exclusive before unfixing, `src/buffer_manager.cc:241-245` returns without upgrading the latch.
- **I/O exception safety:** after metadata publication, a thrown file open/read/write/resize can leave the raw frame latch locked and the mapping inconsistent (`src/buffer_manager.cc:194-228`).
- **Lock wording:** “do not hold latches during I/O” is too broad. The implementation correctly avoids the *global manager* latch, but intentionally retains the frame latch and a per-segment shared latch so no thread sees half-loaded bytes and resize remains coordinated.
- **Recovery boundary:** dirty write-back alone is not transactional crash safety. Connect to WAL at `dbimpl-10-recovery-016`.
- Destructor write-back assumes no concurrent users.

## Test-derived lessons

- `FixSingle`, `MoveToLRU`, `LRURefresh`: lifecycle and replacement transitions (`test/buffer_manager_test.cc:15-35,108-140`).
- `PersistentRestart`, `FIFOEvict`: segment-aware persistence and FIFO victim order (`39-87`).
- `BufferFull`, `MultithreadBufferFull`: pinned frames and bounded capacity (`91-104,269-299`).
- `MultithreadExclusiveAccess`: detects lost updates if the page latch is wrong (`170-200`).
- `BlockedThreadsHoldsNoLocks`: most important concurrency-design test; an unrelated page must progress (`203-266`).
- `MultithreadManyPages`, `MultithreadReaderWriter`: skew, scans, read/write contention, retry/abort behavior, and liveness (`303-455`). Passing stress tests is evidence, not a proof of race freedom.

The benchmark adds a ten-thread mixed workload with 70% reads over five segments and retries on `buffer_full_error` (`bench/bm_buffer_manager.cc:13-46`).

## Exact lecture anchors

- `dbimpl-01-storage-019`, `dbimpl-01-storage-020`: page granularity, storage latency, read-ahead/write-back.
- `dbimpl-01-storage-021`: `FIX(page, mode)` / `UNFIX(page, dirty)`.
- `dbimpl-01-storage-022`: buffer hash table and frames.
- `dbimpl-01-storage-023`: frame metadata and per-page latching.
- `dbimpl-01-storage-024`: clean vs. dirty victim handling.
- `dbimpl-01-storage-025`, `026`, `030`, `031`, `032`: FIFO, LRU, clock, 2Q, and hints.
- `dbimpl-02-storage-access-001`, `002`: segment abstraction.
- `dbimpl-02-storage-access-016`: steal/force consequences.
- `dbimpl-10-recovery-008`, `009`, `016`: recovery replacement/write policy and WAL.

## High-value exam drills

- Write the concurrent `fix_page` miss path and explain which state is protected by each latch.
- Trace FIFO/LRU after `1, 2, 1, 3, 4` with three frames.
- Explain pin count vs. shared/exclusive page latch.
- Debug a nested shared → exclusive fix.
- Compare this implementation with a ghost-queue 2Q description.
- Explain why dirty eviction requires WAL in a transactional DBMS.

## Evidence quality

README and tests were treated as authoritative for the assignment. Headers and implementation were audited against them. The retrospective report was used only where its claims matched source/tests/git history. Both core `.cc` files compiled warning-free under C++20; the full legacy gtest suite was not rerun because the CMake build downloads old Google dependencies.

The complete renderer-ready data and all source references are in `analysis/exercise-projects/buffer-manager.json`.
