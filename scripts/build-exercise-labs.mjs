import { mkdir, readFile, writeFile } from "node:fs/promises";

const projectRoot = new URL("../", import.meta.url);
const analysisRoot = new URL("analysis/exercise-projects/", projectRoot);
const outputUrl = new URL(
  "public/generated/course/exercise-labs.json",
  projectRoot,
);

const orderedLabs = [
  "buffer-manager",
  "slotted-pages",
  "b-tree",
  "algebraic-operators",
  "external-sort",
  "expression-evaluation",
];

const labs = await Promise.all(
  orderedLabs.map(async (id, index) => {
    const source = JSON.parse(
      await readFile(new URL(`${id}.json`, analysisRoot), "utf8"),
    );
    return {
      id: source.id,
      number: index + 1,
      title: source.title,
      subtitle: source.subtitle,
      project_label: source.project_label,
      report_status: source.report_status,
      chapter_ids: source.chapter_ids,
      assignment_brief: source.assignment_brief,
      learning_outcomes: source.learning_outcomes,
      artifacts: source.artifacts,
      concepts: source.concepts,
      trace: source.trace,
      decisions: source.decisions,
      tests: source.tests,
      drills: source.drills,
      lecture_links: source.lecture_links,
      limitations: source.limitations,
    };
  }),
);

const collection = {
  generated_at: new Date().toISOString().slice(0, 10),
  title: "Implementation Exercise Labs",
  warning:
    "These labs combine assignment specifications, submitted implementations, tests, and student-authored reports. The implementation and reports are not treated as course ground truth.",
  methodology: [
    "Read every assignment README, public interface, implementation, test, benchmark, and available report.",
    "Check implementation and report claims against the assignment contract, source behavior, and test expectations.",
    "Map each exercise to exact lecture visual intervals and convert implementation knowledge into exam-ready algorithms, invariants, traces, and pseudocode drills.",
    "Preserve discrepancies and untested boundaries instead of presenting submitted student code as a canonical reference implementation.",
  ],
  labs,
};

await mkdir(new URL("./", outputUrl), { recursive: true });
await writeFile(outputUrl, `${JSON.stringify(collection, null, 2)}\n`);
console.log(`Wrote ${labs.length} audited exercise labs to ${outputUrl.pathname}`);
