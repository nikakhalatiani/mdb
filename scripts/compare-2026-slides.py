#!/usr/bin/env python3
"""Build a reproducible candidate map from the 2026 PDFs to 2021 evidence.

The matcher intentionally uses the PDF text layer only. Handwriting in the
student-annotated PDFs is flattened into the rendered page, so it cannot be
mistaken for a printed curriculum change by this script.
"""

from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

from pypdf import PdfReader


DEFAULT_PDFS = {
    "chapter1": "chapter1_260717_153205.pdf",
    "chapter2": "chapter2_260717_153153.pdf",
    "chapter3": "chapter3_260717_153137.pdf",
    "chapter4": "chapter4_260717_153133.pdf",
    "chapter5": "chapter5_260717_153122.pdf",
    "chapter6": "chapter6_260717_153128.pdf",
    "chapter7": "chapter7_260717_153118.pdf",
    "chapter8": "chapter8_260717_153116.pdf",
    "qsort": "qsort_260717_153127.pdf",
}

RECORDING_POOLS = {
    "chapter1": {"dbimpl-00-introduction"},
    "chapter2": {"dbimpl-01-storage", "dbimpl-02-storage-access"},
    "chapter3": {
        "dbimpl-03-access-tuples",
        "dbimpl-04-access-btrees",
        "dbimpl-05-access-btrees",
        "dbimpl-06-access-eh",
    },
    "chapter4": {"dbimpl-07-transactions", "dbimpl-10-recovery"},
    "chapter5": {"dbimpl-11-setoriented"},
    "chapter6": {"dbimpl-12-operators", "dbimpl-13-codegen"},
    "chapter7": {"dbimpl-13-codegen"},
    "chapter8": {"dbimpl-13-codegen"},
    "qsort": set(),
}

COMMON_PHRASES = (
    "database implementation for modern hardware",
    "the classical architecture",
    "efficient query processing",
    "modern hardware",
    "thomas neumann",
    "technische universitat munchen",
    "technische universitaet munchen",
)


@dataclass
class NewPage:
    physical_page: int
    deck_slide: int | None
    deck_total: int | None
    text: str


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value)
    value = "".join(character for character in value if not unicodedata.combining(character))
    value = value.lower().replace("–", "-").replace("—", "-")
    value = re.sub(r"\b\d+\s*/\s*\d+\b", " ", value)
    for phrase in COMMON_PHRASES:
        value = value.replace(phrase, " ")
    value = re.sub(r"[^a-z0-9_+<>=*]+", " ", value)
    return " ".join(value.split())


def tokens(value: str) -> list[str]:
    return [token for token in normalize(value).split() if len(token) > 1]


def weighted_jaccard(left: list[str], right: list[str]) -> float:
    left_counts = Counter(left)
    right_counts = Counter(right)
    vocabulary = set(left_counts) | set(right_counts)
    if not vocabulary:
        return 0.0
    intersection = sum(min(left_counts[word], right_counts[word]) for word in vocabulary)
    union = sum(max(left_counts[word], right_counts[word]) for word in vocabulary)
    return intersection / union


def similarity(left: str, right: str) -> float:
    normalized_left = normalize(left)
    normalized_right = normalize(right)
    if not normalized_left or not normalized_right:
        return 0.0
    sequence = SequenceMatcher(None, normalized_left, normalized_right).ratio()
    token_score = weighted_jaccard(tokens(left), tokens(right))
    return round(0.45 * sequence + 0.55 * token_score, 4)


def parse_counter(text: str) -> tuple[int | None, int | None]:
    matches = re.findall(r"\b(\d+)\s*/\s*(\d+)\b", text)
    if not matches:
        return None, None
    slide, total = matches[-1]
    return int(slide), int(total)


def extract_pages(pdf_path: Path) -> list[NewPage]:
    reader = PdfReader(str(pdf_path))
    result: list[NewPage] = []
    for physical_page, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        deck_slide, deck_total = parse_counter(text)
        result.append(
            NewPage(
                physical_page=physical_page,
                deck_slide=deck_slide,
                deck_total=deck_total,
                text=text.strip(),
            )
        )
    return result


def group_pages(pages: list[NewPage]) -> list[dict[str, Any]]:
    grouped: list[dict[str, Any]] = []
    by_counter: dict[tuple[int | None, int | None], dict[str, Any]] = {}
    counterless_index = 0
    for page in pages:
        if page.deck_slide is None:
            counterless_index += 1
            key = (None, counterless_index)
        else:
            key = (page.deck_slide, page.deck_total)
        if key not in by_counter:
            entry = {
                "deck_slide": page.deck_slide,
                "deck_total": page.deck_total,
                "physical_pages": [],
                "states": [],
            }
            by_counter[key] = entry
            grouped.append(entry)
        entry = by_counter[key]
        entry["physical_pages"].append(page.physical_page)
        normalized = normalize(page.text)
        if normalized not in {state["normalized_text"] for state in entry["states"]}:
            entry["states"].append(
                {
                    "physical_page": page.physical_page,
                    "text": page.text,
                    "normalized_text": normalized,
                }
            )
    return grouped


def best_candidates(
    current_text: str, evidence: list[dict[str, Any]], pool: set[str]
) -> list[dict[str, Any]]:
    if not pool:
        return []
    candidates = []
    for record in evidence:
        if record["recording_id"] not in pool:
            continue
        score = similarity(current_text, record.get("slide_text_ocr") or record.get("title") or "")
        candidates.append(
            {
                "occurrence_id": record["occurrence_id"],
                "recording_id": record["recording_id"],
                "baseline_slide_number": record.get("slide_number"),
                "title": record.get("title"),
                "score": score,
            }
        )
    return sorted(candidates, key=lambda candidate: candidate["score"], reverse=True)[:5]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--downloads",
        type=Path,
        default=Path("/Users/nkhalatiani/Downloads"),
    )
    parser.add_argument(
        "--evidence",
        type=Path,
        default=Path("public/generated/course/evidence-index.json"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("analysis/lecture-2026/automatic-slide-map.json"),
    )
    arguments = parser.parse_args()

    evidence_payload = json.loads(arguments.evidence.read_text())
    evidence = evidence_payload["evidence"]
    decks = []
    for deck_id, filename in DEFAULT_PDFS.items():
        pdf_path = arguments.downloads / filename
        pages = extract_pages(pdf_path)
        slides = group_pages(pages)
        for slide in slides:
            final_state = slide["states"][-1]
            slide["candidate_matches"] = best_candidates(
                final_state["text"], evidence, RECORDING_POOLS[deck_id]
            )
            slide["automatic_match_status"] = (
                "strong"
                if slide["candidate_matches"]
                and slide["candidate_matches"][0]["score"] >= 0.74
                else "review"
            )
            for state in slide["states"]:
                del state["normalized_text"]
        decks.append(
            {
                "id": deck_id,
                "filename": filename,
                "physical_page_count": len(pages),
                "printed_slide_count": len(slides),
                "slides": slides,
            }
        )

    payload = {
        "method": (
            "Text-layer candidate matching only. Flattened handwriting is excluded "
            "from the comparison and must be reviewed visually as a separate source."
        ),
        "baseline": "2021 recorded slide evidence",
        "current": "2026 annotated lecture PDFs",
        "decks": decks,
    }
    arguments.output.parent.mkdir(parents=True, exist_ok=True)
    arguments.output.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
