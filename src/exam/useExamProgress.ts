import { useEffect, useState } from "react";

export type SelfRating = "again" | "hard" | "good";

export type ExamProgressItem = {
  scratchpad: string;
  status: "unseen" | "attempted" | "needs_review" | "solid";
  attempt_count: number;
  last_attempt_at: string | null;
  self_rating: SelfRating | null;
};

type ExamProgress = Record<string, ExamProgressItem>;

const STORAGE_KEY = "mdb.examPractice.v1";

function emptyProgress(): ExamProgressItem {
  return {
    scratchpad: "",
    status: "unseen",
    attempt_count: 0,
    last_attempt_at: null,
    self_rating: null,
  };
}

export function useExamProgress(questionIds: string[]) {
  const [progress, setProgress] = useState<ExamProgress>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const parsed = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "{}",
      ) as ExamProgress;
      const validIds = new Set(questionIds);
      setProgress(
        Object.fromEntries(
          Object.entries(parsed).filter(([id]) => validIds.has(id)),
        ),
      );
    } catch {
      setProgress({});
    }
    setHydrated(true);
  }, [questionIds]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [hydrated, progress]);

  function itemFor(questionId: string) {
    return progress[questionId] ?? emptyProgress();
  }

  function updateScratchpad(questionId: string, scratchpad: string) {
    setProgress((current) => {
      const previous = current[questionId] ?? emptyProgress();
      return {
        ...current,
        [questionId]: {
          ...previous,
          scratchpad,
          status:
            previous.status === "unseen" && scratchpad.trim()
              ? "attempted"
              : previous.status,
        },
      };
    });
  }

  function rate(questionId: string, rating: SelfRating) {
    setProgress((current) => {
      const previous = current[questionId] ?? emptyProgress();
      return {
        ...current,
        [questionId]: {
          ...previous,
          attempt_count: previous.attempt_count + 1,
          last_attempt_at: new Date().toISOString(),
          self_rating: rating,
          status: rating === "good" ? "solid" : "needs_review",
        },
      };
    });
  }

  return { itemFor, progress, rate, updateScratchpad };
}
