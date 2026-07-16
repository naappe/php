#!/usr/bin/env python3
"""Safe, optional Radheef lookup for translator development.

This tool reads the SQLite database bundled with the MIT-licensed
``dhivehi_nlp`` package. It does not copy the database into the website and it
does not treat a Dhivehi definition as an English translation pair.
"""

from __future__ import annotations

import argparse
import json
import sqlite3
from pathlib import Path


def default_database() -> Path | None:
    try:
        import dhivehi_nlp  # type: ignore
    except ImportError:
        return None
    candidate = Path(dhivehi_nlp.__file__).parent / "data" / "dhivehi_nlp.db"
    return candidate if candidate.exists() else None


def connect(database: Path) -> sqlite3.Connection:
    if not database.is_file():
        raise FileNotFoundError(f"Dictionary database not found: {database}")
    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    return connection


def lookup(database: Path, word: str) -> dict[str, object] | None:
    with connect(database) as connection:
        row = connection.execute(
            "SELECT word, definition, part_of_speech FROM radheef WHERE word = ? LIMIT 1",
            (word,),
        ).fetchone()
    if row is None:
        return None
    return {
        "word": row["word"],
        "definitions": row["definition"].splitlines(),
        "partOfSpeech": row["part_of_speech"],
        "source": "Radheef via dhivehi_nlp",
        "translationStatus": "Dhivehi definition only; not an English translation pair",
    }


def check_words(database: Path, words: list[str]) -> dict[str, object]:
    placeholders = ",".join("?" for _ in words)
    if not placeholders:
        return {"found": [], "missing": []}
    with connect(database) as connection:
        rows = connection.execute(
            f"SELECT DISTINCT word FROM radheef WHERE word IN ({placeholders})", words
        ).fetchall()
    found = {row["word"] for row in rows}
    return {
        "found": [word for word in words if word in found],
        "missing": [word for word in words if word not in found],
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("words", nargs="+", help="Exact Thaana headword(s)")
    parser.add_argument("--db", type=Path, help="Path to dhivehi_nlp.db")
    parser.add_argument(
        "--check", action="store_true", help="Only report which headwords exist"
    )
    args = parser.parse_args()
    database = args.db or default_database()
    if database is None:
        parser.error("Install dhivehi_nlp or supply --db /path/to/dhivehi_nlp.db")

    result: object
    if args.check:
        result = check_words(database, args.words)
    else:
        result = [lookup(database, word) for word in args.words]
        if len(result) == 1:
            result = result[0]
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
