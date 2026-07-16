#!/usr/bin/env python3
"""Stream Kaikki/Wiktextract JSONL and keep only Dhivehi (lang_code=dv)."""

from __future__ import annotations

import argparse
import gzip
import json
from pathlib import Path
from typing import TextIO


def open_text(path: Path, mode: str) -> TextIO:
    if path.suffix == ".gz":
        return gzip.open(path, mode + "t", encoding="utf-8")
    return path.open(mode, encoding="utf-8")


def contains_thaana(value: str) -> bool:
    return any("\u0780" <= char <= "\u07bf" for char in value)


def extract(source: Path, destination: Path, require_thaana: bool) -> dict[str, int]:
    counts = {"lines": 0, "invalid_json": 0, "dhivehi": 0, "written": 0}
    destination.parent.mkdir(parents=True, exist_ok=True)

    with open_text(source, "r") as reader, open_text(destination, "w") as writer:
        for line in reader:
            counts["lines"] += 1
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                counts["invalid_json"] += 1
                continue

            if record.get("lang_code") != "dv":
                continue

            counts["dhivehi"] += 1
            word = record.get("word", "")
            if require_thaana and not contains_thaana(word):
                continue

            writer.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
            writer.write("\n")
            counts["written"] += 1

    return counts


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extract Dhivehi records (lang_code=dv) from Kaikki JSONL or JSONL.GZ."
    )
    parser.add_argument("source", type=Path, help="Input .jsonl or .jsonl.gz file")
    parser.add_argument("destination", type=Path, help="Output .jsonl or .jsonl.gz file")
    parser.add_argument(
        "--allow-non-thaana",
        action="store_true",
        help="Keep dv records whose headword does not contain Thaana",
    )
    args = parser.parse_args()

    if not args.source.is_file():
        parser.error(f"Source file does not exist: {args.source}")

    counts = extract(args.source, args.destination, not args.allow_non_thaana)
    print(json.dumps(counts, ensure_ascii=False))


if __name__ == "__main__":
    main()
