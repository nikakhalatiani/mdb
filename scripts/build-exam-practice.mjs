import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const analysisRoot = path.join(root, "analysis", "exam-protocol");
const outputPath = path.join(
  root,
  "public",
  "generated",
  "course",
  "exam-practice.json",
);

const answerAudit = JSON.parse(
  fs.readFileSync(path.join(analysisRoot, "answer-audit.json"), "utf8"),
);
const questionMap = JSON.parse(
  fs.readFileSync(path.join(analysisRoot, "question-map.json"), "utf8"),
);

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "for",
  "from",
  "given",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
]);

function tokens(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 1 && !stopWords.has(token)),
  );
}

function overlapScore(left, right) {
  const leftTokens = tokens(left);
  const rightTokens = tokens(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) intersection += 1;
  }
  return intersection / Math.min(leftTokens.size, rightTokens.size);
}

function bestQuestionMap(record) {
  const exact = questionMap.questions.find(
    (question) => question.id === record.id,
  );
  if (exact) return exact;

  const candidates = questionMap.questions.filter((question) =>
    question.pages.some((page) => record.pages.includes(page)),
  );
  return candidates
    .map((question) => ({
      question,
      score:
        overlapScore(record.prompt, question.prompt) +
        (question.section.toLowerCase().includes(record.topic.toLowerCase())
          ? 0.2
          : 0),
    }))
    .sort((left, right) => right.score - left.score)[0]?.question;
}

function protocolFlag(mapRecord) {
  const color = mapRecord?.pdf_confidence?.color;
  if (color === "red") return "impossible_to_know";
  if (color === "cyan") return "assumption_based";
  if (color === "yellow" || color === "mixed") return "incomplete";
  return "none";
}

function questionFidelity(mapRecord) {
  if (!mapRecord) return "paraphrased";
  if (mapRecord.prompt_type === "exact_question") return "as_recorded";
  if (mapRecord.prompt_type === "unknowable_fragment") return "topic_only";
  if (mapRecord.prompt_type.includes("fragment")) return "partial";
  return "paraphrased";
}

function answerBasis(record) {
  if (record.classification === "not-answerable") return "unavailable";
  if (record.evidenceBasis.includes("external")) {
    return "external_general_knowledge";
  }
  if (record.evidenceBasis.includes("reasoning")) {
    return "lecture_plus_reasoning";
  }
  if (record.evidence?.length) return "lecture_supported";
  return "external_general_knowledge";
}

const formatOverrides = {
  "protocol-q-001": "recognition",
  "protocol-q-002": "fill_in",
  "protocol-q-003": "comparison",
  "protocol-q-004": "trace",
  "protocol-q-005": "explanation",
  "protocol-q-006": "diagram",
  "protocol-q-007": "trace",
  "protocol-q-008": "calculation",
  "protocol-q-009": "calculation",
  "protocol-q-010": "explanation",
  "protocol-q-011": "explanation",
  "protocol-q-012": "comparison",
  "protocol-q-013": "calculation",
  "protocol-q-014": "diagram",
  "protocol-q-015": "diagram",
  "protocol-q-016": "recognition",
  "protocol-q-017": "comparison",
  "protocol-q-018": "trace",
  "protocol-q-019": "calculation",
  "protocol-q-020": "pseudocode",
  "protocol-q-021": "explanation",
  "protocol-q-022": "trace",
  "protocol-q-023": "recognition",
  "protocol-q-024": "pseudocode",
  "protocol-q-025": "trace",
  "protocol-q-026": "pseudocode",
  "protocol-q-027": "pseudocode",
  "protocol-q-028": "recognition",
  "protocol-q-029": "recognition",
  "protocol-q-030": "plan_transformation",
  "protocol-q-031": "plan_transformation",
  "protocol-q-032": "explanation",
  "protocol-q-033": "plan_transformation",
  "protocol-q-034": "plan_transformation",
};

const corroboration = [
  {
    ids: ["protocol-q-002"],
    detail:
      "A separate two-year exam recollection also reports a fill-in task about disk, RAM, pages, and data.",
    signal: "Independent recollection reports the same fill-in format",
  },
  {
    ids: ["protocol-q-010"],
    detail:
      "A separate recollection reports B+-tree lock coupling, deadlock avoidance, and repairing flawed code.",
    signal: "B+-tree concurrency independently recalled",
  },
  {
    ids: ["protocol-q-018", "protocol-q-019", "protocol-q-020"],
    detail:
      "A separate recollection reports extendible hashing with global/local depths; the last exercise contains an exact insertion trace.",
    signal: "Protocol + separate recollection + exact last exercise",
  },
  {
    ids: ["protocol-q-023"],
    detail:
      "A separate recollection also reports reading LLVM, recovering a formula, and optimizing known globals.",
    signal: "LLVM task independently recalled",
  },
  {
    ids: ["protocol-q-027", "protocol-q-028"],
    detail:
      "A separate recollection reports an iterator-model anti-join task using match marks.",
    signal: "Anti-join implementation independently recalled",
  },
  {
    ids: ["protocol-q-030", "protocol-q-031", "protocol-q-032"],
    detail:
      "A separate recollection reports push-model code-to-plan reconstruction; the last exercise contains an exact version.",
    signal: "Protocol + separate recollection + exact last exercise",
  },
  {
    ids: ["protocol-q-033", "protocol-q-034"],
    detail:
      "A separate recollection reports exchange operators around grouped inputs feeding a join; the last exercise contains an exact plan.",
    signal: "Protocol + separate recollection + exact last exercise",
  },
];

function corroborationFor(id) {
  return corroboration.find((entry) => entry.ids.includes(id));
}

const protocolQuestions = answerAudit.records.map((record) => {
  const mapped = bestQuestionMap(record);
  const extra = corroborationFor(record.id);
  const citations = (record.evidence ?? []).map((item) => ({
    chapter_id: item.chapterId,
    occurrence_ids: item.occurrenceIds,
    support_note: item.supportNote,
    mapping_status: "verified",
  }));
  const chapterIds = [...new Set(citations.map((item) => item.chapter_id))];
  const isReference =
    record.classification === "not-answerable" ||
    record.classification === "unsupported";
  return {
    id: record.id,
    topic: record.topic,
    prompt: record.prompt,
    format: formatOverrides[record.id] ?? "explanation",
    question_fidelity: questionFidelity(mapped),
    protocol_flag: protocolFlag(mapped),
    verification: record.classification.replace("-", "_"),
    priority: extra ? "high" : isReference ? "reference" : "medium",
    chapter_ids: chapterIds,
    sources: [
      {
        kind: "compiled_protocol",
        label: "Final Klausur DBImpl",
        detail:
          "Student-compiled recollection. The source itself warns that answers may be incomplete or wrong.",
        pages: record.pages,
        reliability: "recollection",
      },
      ...(extra
        ? [
            {
              kind: "student_recollection",
              label: "Independent two-year recollection",
              detail: extra.detail,
              reliability: "reported_pattern",
            },
          ]
        : []),
    ],
    answer: record.examReadyAnswer,
    answer_basis: answerBasis(record),
    audit_note: record.protocolAnswerAssessment,
    assumptions: record.assumptions ?? [],
    common_traps: record.commonTraps ?? [],
    citations,
    signals: extra ? [extra.signal] : [],
  };
});

const exerciseSource = (pages, detail) => ({
  kind: "exercise",
  label: "Last exercise · 14 July 2026",
  detail,
  pages,
  reliability: "exact_exercise",
});

const recollectionSource = (detail) => ({
  kind: "student_recollection",
  label: "Independent two-year recollection",
  detail,
  reliability: "reported_pattern",
});

const supplementalQuestions = [
  {
    id: "supplement-lock-coupling",
    topic: "B+-Tree Concurrency",
    prompt:
      "Explain safe B+-tree lock coupling, how a split can create an upward-latch deadlock risk, and what must be corrected in flawed traversal code.",
    format: "pseudocode",
    question_fidelity: "paraphrased",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: [
      "07-btree-fundamentals-and-operations",
      "08-advanced-btree-techniques",
    ],
    sources: [
      recollectionSource(
        "The exact code is missing, but lock coupling, deadlock prevention, and a code repair were independently recalled.",
      ),
    ],
    answer:
      "During descent, latch the parent, choose the child, latch that child, and only then release the parent. The consistent root-to-leaf acquisition order is deadlock-free for ordinary traversal. Inserts are harder because a split can propagate upward: never keep a child latch and then acquire an ancestor in reverse order. Use the lecture's safe-page strategy (split a full inner page while its parent is still latched) or release and restart with a deliberately controlled full-path strategy. In code, the critical repair is that the parent must remain latched until child acquisition succeeds, and every exit/error path must release latches exactly once.",
    answer_basis: "lecture_supported",
    audit_note:
      "The remembered code fragment is unavailable, so only the invariant and repair checklist—not line-level edits—can be verified.",
    assumptions: [
      "“Lock” in the recollection refers to short-lived page latches used by the lecture.",
      "Traversal acquires latches from root toward the leaves.",
    ],
    common_traps: [
      "Releasing the parent before the child latch is acquired.",
      "Acquiring a parent while still holding a child latch.",
      "Confusing page latches with transaction-level logical locks.",
    ],
    citations: [
      {
        chapter_id: "07-btree-fundamentals-and-operations",
        occurrence_ids: [
          "dbimpl-05-access-btrees-008",
          "dbimpl-05-access-btrees-009",
          "dbimpl-05-access-btrees-010",
        ],
        support_note:
          "Lock coupling, split propagation, safe inner pages, and restart.",
        mapping_status: "verified",
      },
      {
        chapter_id: "08-advanced-btree-techniques",
        occurrence_ids: ["dbimpl-05-access-btrees-011"],
        support_note:
          "B-link trees as the lower-contention alternative to holding parent and child.",
        mapping_status: "verified",
      },
    ],
    signals: ["Independently recalled as an exam task"],
  },
  {
    id: "supplement-full-anti-join",
    topic: "Iterator Operators",
    prompt:
      "Implement the remembered “FULL anti join” with match markers, but first define the intended output semantics.",
    format: "pseudocode",
    question_fidelity: "partial",
    protocol_flag: "assumption_based",
    verification: "incomplete",
    priority: "high",
    chapter_ids: [
      "12-set-oriented-execution-models",
      "14-relational-operators-and-joins",
    ],
    sources: [
      recollectionSource(
        "The phrase “FULL anti join” is nonstandard; the recollection mentions a hash structure, marking, and iterating marked/unmarked tuples.",
      ),
    ],
    answer:
      "State the semantics before coding. If “full anti join” means all unmatched tuples from both inputs, build one side in a hash table with a matched bit. Scan the other side, probe every candidate using the full predicate, mark every matching build tuple, and emit or buffer the probe tuple only when no candidate matches. After the probe ends, scan the build table and emit every unmarked tuple. If the examiner actually means a left or right anti join, emit unmatched tuples from that side only. The iterator must not emit after the first nonmatching candidate; it must establish that no candidate matches.",
    answer_basis: "lecture_plus_reasoning",
    audit_note:
      "The task wording is ambiguous. A polished one-sided answer would be unsafe unless the actual code or operator symbol fixes the orientation.",
    assumptions: [
      "A full two-sided anti result means unmatched tuples from both inputs.",
      "The hash key can have collisions, so the residual predicate still runs.",
    ],
    common_traps: [
      "Treating “full anti join” as a standard operator without defining it.",
      "Marking only the first matching duplicate.",
      "Emitting a tuple after one nonmatching candidate.",
    ],
    citations: [
      {
        chapter_id: "12-set-oriented-execution-models",
        occurrence_ids: [
          "dbimpl-11-setoriented-012",
          "dbimpl-11-setoriented-013",
          "dbimpl-11-setoriented-023",
        ],
        support_note: "Iterator open/next/close contract and binary state.",
        mapping_status: "verified",
      },
      {
        chapter_id: "14-relational-operators-and-joins",
        occurrence_ids: [
          "dbimpl-12-operators-055",
          "dbimpl-12-operators-056",
          "dbimpl-12-operators-057",
        ],
        support_note: "Non-inner join marking and unmatched tuple production.",
        mapping_status: "verified",
      },
    ],
    signals: ["Anti-join implementation independently recalled"],
  },
  {
    id: "exercise-extendible-hashing",
    topic: "Extendible Hashing",
    prompt:
      "Insert the six supplied tuples into an extendible hash table with bucket capacity two. Draw every split and label the final global and local depths.",
    format: "trace",
    question_fidelity: "as_recorded",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: ["09-hash-and-specialized-indexes"],
    sources: [
      exerciseSource(
        [2, 3, 4, 5, 6, 7, 8, 9],
        "Exact exercise prompt and progressive worked solution.",
      ),
      recollectionSource(
        "Extendible hashing and global/local depth were independently recalled from an earlier exam.",
      ),
    ],
    visuals: {
      prompt: {
        image: "exam-assets/exercise-hashing-prompt.png",
        alt: "Exercise prompt with six tuple hashes and an initially empty extendible hash directory",
        caption: "Exact last-exercise prompt · attempt the insertion trace first.",
      },
      solution: {
        image: "exam-assets/exercise-hashing-solution.png",
        alt: "Worked extendible hashing directory after all six insertions",
        caption: "Exercise solution state after all insertions.",
      },
    },
    answer:
      "Use the leading hash bits, because that is the convention shown. The final global depth is g=3. Directory entries 000 and 001 share the Schulz bucket (local depth 2); 010 points to the Müller/Krause bucket (local depth 3); 011 points to the Schmidt bucket (local depth 3); and 100, 101, 110, and 111 share the Meier/Kaufmann bucket (local depth 1). Double the directory only when the overflowing bucket already has local depth equal to global depth; otherwise split the bucket and redirect only the affected entries.",
    answer_basis: "lecture_supported",
    audit_note:
      "This is an exact exercise task and solution, not proof that the same values will appear on the exam.",
    assumptions: ["Directory prefixes use the most significant hash bits."],
    common_traps: [
      "Incrementing every bucket's local depth when the directory doubles.",
      "Redistributing entries using the wrong prefix end.",
      "Failing to update all directory pointers that share a bucket.",
    ],
    citations: [
      {
        chapter_id: "09-hash-and-specialized-indexes",
        occurrence_ids: [
          "dbimpl-06-access-eh-026",
          "dbimpl-06-access-eh-027",
          "dbimpl-06-access-eh-028",
          "dbimpl-06-access-eh-032",
          "dbimpl-06-access-eh-038",
        ],
        support_note:
          "Directory lookup, local/global depth, splitting, and doubling.",
        mapping_status: "verified",
      },
    ],
    signals: [
      "Compiled protocol",
      "Independent recollection",
      "Exact last exercise",
    ],
  },
  {
    id: "exercise-push-code",
    topic: "Query Compilation",
    prompt:
      "Generate push-model pseudocode for the exercise plan: filter A on d=42, transform C.c to C.c*C.c, join on A.c=C.c, then PRINT.",
    format: "pseudocode",
    question_fidelity: "as_recorded",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: ["16-query-compilation"],
    sources: [
      exerciseSource(
        [10],
        "Exact exercise plan with a worked push-model code solution.",
      ),
      recollectionSource(
        "Generated push-model code and plan reconstruction were independently recalled.",
      ),
    ],
    visuals: {
      solution: {
        image: "exam-assets/exercise-push-generate.png",
        alt: "Exercise operator tree beside generated push-model pseudocode",
        caption: "Exact exercise worked solution.",
      },
    },
    answer:
      "Create a hash table. First scan A; for each tuple with a.d==42, insert it under key a.c. Then scan C; compute the mapped value c.c=c.c*c.c, probe the table with that value, and for every matching A tuple emit print(a,c). This yields two pipeline-driving loops: the filtered A build and the transformed C probe/output. The hash-table build is the boundary between them.",
    answer_basis: "lecture_supported",
    audit_note:
      "The slide shows one valid physical implementation. Equivalent variable names and data structures are fine if the operator semantics and pipeline order are preserved.",
    assumptions: ["The join is an equi-join and A is chosen as the build side."],
    common_traps: [
      "Probing before the complete build side exists.",
      "Applying c*c after probing instead of before key lookup.",
      "Forgetting that duplicate build matches can produce multiple outputs.",
    ],
    citations: [
      {
        chapter_id: "16-query-compilation",
        occurrence_ids: [
          "dbimpl-13-codegen-020",
          "dbimpl-13-codegen-021",
          "dbimpl-13-codegen-022",
          "dbimpl-13-codegen-023",
          "dbimpl-13-codegen-026",
        ],
        support_note:
          "Data-centric pipeline loops and produce/consume code generation.",
        mapping_status: "verified",
      },
    ],
    signals: ["Protocol theme + separate recollection + exact exercise"],
  },
  {
    id: "exercise-code-to-tree-pipelines",
    topic: "Pipeline Coloring",
    prompt:
      "Reverse the supplied push-generated code into an operator tree, then color every execution pipeline.",
    format: "plan_transformation",
    question_fidelity: "as_recorded",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: [
      "13-pipelining-and-parallelization",
      "16-query-compilation",
    ],
    sources: [
      exerciseSource(
        [11],
        "Exact code-to-tree exercise; classroom annotations explicitly color the pipelines.",
      ),
      recollectionSource(
        "A comparable push-model code-to-plan task was independently recalled from an earlier exam.",
      ),
    ],
    visuals: {
      prompt: {
        image: "exam-assets/exercise-code-to-tree-prompt.png",
        alt: "Push-generated code that builds a hash set over R, filters and groups S, then prints",
        caption: "Exact last-exercise prompt · draw the tree and mark breakers before revealing.",
      },
    },
    answer:
      "The logical tree is PRINT above GROUP BY S.x with COUNT(*), above an existence/semi join on R.a=S.a. The R branch scans R and builds hs. The S branch scans S, applies S.y>42, probes hs, and updates the grouping hash table ht. Pipeline breakers create three code regions: the R hash-set build, the S scan/filter/probe/group build, and the final scan of ht into PRINT.",
    answer_basis: "lecture_supported",
    audit_note:
      "The classroom photo supplies the colored walkthrough; the clean slide supplies the exact code prompt.",
    assumptions: [
      "hs.contains implements existence semantics, so R duplicates do not multiply S.",
      "ht stores grouped counts by S.x.",
    ],
    common_traps: [
      "Drawing a multiplicity-producing inner join instead of an existence/semi join.",
      "Putting GROUP BY and PRINT in one pipeline despite the completed hash table scan.",
      "Coloring each logical operator separately instead of each fused code region.",
    ],
    citations: [
      {
        chapter_id: "13-pipelining-and-parallelization",
        occurrence_ids: [
          "dbimpl-12-operators-020",
          "dbimpl-12-operators-021",
        ],
        support_note: "Pipeline breakers and pipelined execution.",
        mapping_status: "verified",
      },
      {
        chapter_id: "16-query-compilation",
        occurrence_ids: [
          "dbimpl-13-codegen-020",
          "dbimpl-13-codegen-021",
          "dbimpl-13-codegen-022",
          "dbimpl-13-codegen-023",
          "dbimpl-13-codegen-025",
        ],
        support_note:
          "Generated loops correspond to complete data-centric pipelines.",
        mapping_status: "verified",
      },
    ],
    worked_example: {
      kind: "pipelines",
      title: "Three pipeline regions in the exercise code",
      groups: [
        {
          label: "Pipeline 1 · build existence set",
          tone: "blue",
          items: ["Scan R", "Extract r.a", "Build HashSet hs"],
        },
        {
          label: "Pipeline 2 · probe and build groups",
          tone: "green",
          items: [
            "Scan S",
            "Filter S.y > 42",
            "Probe hs on S.a",
            "Build/update GROUP BY hash table ht on S.x",
          ],
        },
        {
          label: "Pipeline 3 · emit",
          tone: "red",
          items: ["Scan completed ht", "PRINT grouped result"],
        },
      ],
      note:
        "A breaker ends a pipeline when downstream work requires a completed data structure. Operators inside one region are fused into the same loop.",
    },
    signals: [
      "Explicitly highlighted by the user",
      "Independent recollection",
      "Exact last exercise",
    ],
  },
  {
    id: "exercise-exchange-parallelism",
    topic: "Exchange Parallelism",
    prompt:
      "Parallelize the exercise selection/map/equi-join plan for two workers using XchgHashSplit and Xchg.",
    format: "plan_transformation",
    question_fidelity: "as_recorded",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: ["17-parallel-query-execution"],
    sources: [
      exerciseSource(
        [12],
        "Exact exercise plan and worked two-thread exchange placement.",
      ),
      recollectionSource(
        "Exchange operators feeding joins were independently recalled from an earlier exam.",
      ),
    ],
    visuals: {
      solution: {
        image: "exam-assets/exercise-exchange-solution.png",
        alt: "Original serial plan and its two-thread exchange-parallel version",
        caption: "Exact exercise worked solution.",
      },
    },
    answer:
      "Split both scans across two workers. Apply A.d=42 locally and compute C.c*C.c locally before moving data. Repartition both streams with XchgHashSplit(2:2) using the same join key and destination function, so equal A.c and transformed C.c values meet at the same worker. Run one local join per worker. If PRINT requires one stream, gather both join outputs with Xchg(2:1) and print above the gather.",
    answer_basis: "lecture_supported",
    audit_note:
      "The exact exercise uses an ordinary equi-join. A grouped exam variant may need an additional local/final aggregation and a second repartition by the join key.",
    assumptions: ["Both XchgHashSplit operators use compatible hashing."],
    common_traps: [
      "Partitioning the two join inputs with different destination functions.",
      "Moving tuples before applying a local filter.",
      "Gathering to one worker before the join.",
    ],
    citations: [
      {
        chapter_id: "17-parallel-query-execution",
        occurrence_ids: [
          "dbimpl-13-codegen-037",
          "dbimpl-13-codegen-038",
          "dbimpl-13-codegen-040",
        ],
        support_note:
          "Exchange variants, compatible repartitioning, and parallel joins.",
        mapping_status: "verified",
      },
    ],
    signals: ["Protocol + separate recollection + exact last exercise"],
  },
  {
    id: "exercise-transaction-history",
    topic: "Transaction Histories",
    prompt:
      "For the exact three-transaction exercise history, list conflicts, build the precedence graph, and classify conflict serializability, RC, ACA, and strictness.",
    format: "trace",
    question_fidelity: "as_recorded",
    protocol_flag: "none",
    verification: "verified",
    priority: "high",
    chapter_ids: ["10-transaction-foundations"],
    sources: [
      exerciseSource(
        [13, 14, 15, 16, 17, 18, 19],
        "Exact exercise history and progressive worked solution.",
      ),
      recollectionSource(
        "History classification and commit-order changes were independently recalled from an earlier exam.",
      ),
    ],
    visuals: {
      prompt: {
        image: "exam-assets/exercise-history-prompt.png",
        alt: "Three-transaction history before conflict and recovery analysis",
        caption: "Exact last-exercise history · classify it before revealing.",
      },
      solution: {
        image: "exam-assets/exercise-history-solution.png",
        alt: "Worked history with conflict graph and RC, ACA, and strict classifications",
        caption: "Exercise solution summary.",
      },
    },
    answer:
      "The conflicting orders are w1(y)<r2(y), w1(y)<w2(y), w1(y)<w3(y), r2(y)<w3(y), w3(y)<w2(y), and r1(x)<w3(x). The precedence graph contains T1→T2, T1→T3, T2→T3, and T3→T2, so the T2↔T3 cycle makes the history not conflict-serializable. It is recoverable and ACA because T2 reads T1's y only after T1 commits, and T2 commits after T1. It is not strict because T2 writes y while T3's earlier write of y is still uncommitted. For commit-order variants, re-check separately: RC constrains writer-commit before reader-commit; ACA constrains writer-commit before the dependent read; strictness constrains commit/abort before any later conflicting read or write.",
    answer_basis: "lecture_plus_reasoning",
    audit_note:
      "The schedule/serializability method is lecture-grounded. RC, ACA, and strictness are standard transaction definitions not directly preserved in the current lecture recordings.",
    assumptions: ["The visual top-to-bottom and arrow order defines the history."],
    common_traps: [
      "Adding an edge for two reads.",
      "Checking only reads-from and missing write-write strictness violations.",
      "Calling a cyclic precedence graph serializable.",
      "Treating RC, ACA, and strictness as the same property.",
    ],
    citations: [
      {
        chapter_id: "10-transaction-foundations",
        occurrence_ids: [
          "dbimpl-07-transactions-056",
          "dbimpl-07-transactions-057",
          "dbimpl-07-transactions-058",
          "dbimpl-07-transactions-059",
          "dbimpl-07-transactions-064",
        ],
        support_note:
          "Concurrent schedules, conflicts/anomalies, and serial execution context.",
        mapping_status: "probable",
      },
    ],
    signals: ["Independent recollection + exact last exercise"],
  },
];

const bank = {
  generated_at: new Date().toISOString(),
  title: "Exam Practice Lab",
  warning:
    "Student recollections are not an official exam or answer key. Missing details are never invented; exercise tasks show authentic practice formats, not guaranteed future questions.",
  methodology: [
    "Compiled-protocol answers were independently checked against the 527 lecture intervals.",
    "A separate two-year recollection is used only as corroboration of task patterns.",
    "The last exercise supplies exact practice prompts and worked states.",
    "Every lecture-supported answer retains chapter and occurrence links.",
  ],
  questions: [...protocolQuestions, ...supplementalQuestions],
};

fs.writeFileSync(outputPath, `${JSON.stringify(bank, null, 2)}\n`);

const missingCitations = bank.questions
  .flatMap((question) => question.citations)
  .filter((citation) => !citation.occurrence_ids.length);
if (missingCitations.length) {
  throw new Error("Exam bank contains empty citation groups.");
}

console.log(
  `Wrote ${bank.questions.length} questions (${supplementalQuestions.length} supplemental) to ${path.relative(root, outputPath)}`,
);
