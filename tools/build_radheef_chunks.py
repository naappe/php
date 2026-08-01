#!/usr/bin/env python3
"""Build browser-readable, first-letter Radheef JSON chunks."""
from __future__ import annotations

import argparse
import json
import sqlite3
from collections import defaultdict
from pathlib import Path

from radheef_dictionary import default_database


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db", type=Path, help="Path to dhivehi_nlp.db")
    parser.add_argument("--output", type=Path, default=Path("assets/dictionary"))
    args = parser.parse_args()
    database = args.db or default_database()
    if database is None:
        parser.error("Install dhivehi_nlp or provide --db")

    chunks: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)
    with sqlite3.connect(f"file:{database}?mode=ro", uri=True) as connection:
        rows = connection.execute(
            "SELECT word, definition, part_of_speech FROM radheef ORDER BY word"
        )
        for word, definition, part_of_speech in rows:
            chunks[word[0]][word] = {
                "definitions": definition.splitlines(),
                "partOfSpeech": part_of_speech,
            }

    args.output.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, object] = {
        "source": "Radheef via dhivehi_nlp 1.0.13",
        "language": "dv",
        "definitionLanguage": "dv",
        "translationStatus": "Dhivehi definitions only; not English translation pairs",
        "totalEntries": sum(len(items) for items in chunks.values()),
        "chunks": {},
    }
    for initial, entries in sorted(chunks.items(), key=lambda item: ord(item[0])):
        filename = f"u{ord(initial):04x}.json"
        (args.output / filename).write_text(
            json.dumps(entries, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        manifest["chunks"][initial] = {"file": filename, "entries": len(entries)}
    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Built {len(chunks)} chunks with {manifest['totalEntries']} entries")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
