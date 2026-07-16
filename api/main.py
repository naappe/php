"""HTTP API exposing exact Radheef headword lookup to the web translator."""
from __future__ import annotations
import os
import sys
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.radheef_dictionary import check_words, default_database, lookup  # noqa: E402

DATABASE = default_database()
DEFAULT_ORIGINS = "https://naappe.github.io,http://localhost:8000,http://127.0.0.1:8000"
ALLOWED_ORIGINS = [item.strip() for item in os.getenv("ALLOWED_ORIGINS", DEFAULT_ORIGINS).split(",") if item.strip()]
app = FastAPI(title="Bas Translate Radheef API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET"], allow_headers=["*"])

def database() -> Path:
    if DATABASE is None:
        raise HTTPException(503, "Radheef database is unavailable")
    return DATABASE

def validate_word(word: str) -> str:
    word = word.strip()
    if not word or len(word) > 80:
        raise HTTPException(400, "word must contain 1–80 characters")
    if any(not ("\u0780" <= char <= "\u07b1") for char in word):
        raise HTTPException(400, "word must contain Thaana characters only")
    return word

@app.get("/health")
def health() -> dict[str, object]:
    return {"ok": DATABASE is not None, "source": "Radheef via dhivehi_nlp"}

@app.get("/api/dictionary")
def definition(word: str = Query(min_length=1, max_length=80)) -> dict[str, object]:
    result = lookup(database(), validate_word(word))
    if result is None:
        raise HTTPException(404, "Headword not found")
    return result

@app.get("/api/dictionary/check")
def check(word: list[str] = Query(default=[])) -> dict[str, object]:
    if not word or len(word) > 50:
        raise HTTPException(400, "provide between 1 and 50 word parameters")
    return check_words(database(), [validate_word(item) for item in word])
