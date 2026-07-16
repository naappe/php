# Bas Translate

The homepage is also the system dashboard: it presents the live translator, AI reasoning policy, permanent knowledge base, translation pipeline, lesson registry, safety rules and regression-test status in one responsive page.

A static, teachable English ↔ Dhivehi translation-memory website hosted on GitHub Pages.

## Live website

`https://naappe.github.io/php/`

## What it does

- Translates verified complete sentences in both directions.
- Reuses verified phrases and vocabulary.
- Applies limited Dhivehi/English word-order reasoning.
- Recognizes learned `އޭ` emphasis and `އޯ` reported-speech forms.
- Keeps `އެއް` specific-indefinite and `އަކު` unspecified-indefinite meanings separate.
- Rejects Arabic/Sindhi/Urdu characters from Dhivehi lessons.
- Marks unknown meanings instead of inventing a translation.
- Detects mixed English, Thaana, placeholder and Arabic-script segments.
- Treats vocabulary tokens as evidence while complete-sentence meaning remains primary.
- Learns paired lines in the visitor's browser.
- Imports and exports browser lessons as JSON.

## Important limitation

This is a rule-based translation-memory engine, not a large language model. It becomes useful by accumulating verified English–Dhivehi sentence pairs and grammar lessons. It should prefer “unknown” over a convincing but false answer.

## Lesson status

Nineteen lesson topics are registered. The owner-supplied 74-page course PDF is the authoritative source for Lessons 1–16. A lesson summary is catalogued separately from complete source-backed rules and examples.

## Optional Radheef development lookup

The live site cannot run Python or SQLite. Developers can nevertheless use the
MIT-licensed `dhivehi_nlp` package to confirm whether a Thaana headword exists
and inspect its Dhivehi definition before promoting vocabulary:

```bash
pip install dhivehi_nlp
python3 tools/radheef_dictionary.py ތަންވަޅު
python3 tools/radheef_dictionary.py --check ކާކު ކީއް ކޮބާ
```

Radheef definitions are Dhivehi-to-Dhivehi evidence, not verified
English–Dhivehi translation pairs. The full SQLite database is intentionally
not copied into this public repository or browser bundle.

## File structure

```text
index.html                        Page structure
assets/css/styles.css             Visual design and responsive layout
assets/js/knowledge-base.js       Permanent verified memory
assets/js/engine.js               Translation, validation and reasoning
assets/js/app.js                  Browser UI, local learning, import/export
AI-BRAIN.md                       Instructions for future AI/developers
FILE-MAP.md                       Edit-target guide
SHA256SUMS.txt                    File integrity hashes
tests/engine.test.mjs             Core safety and translation tests
tools/radheef_dictionary.py       Optional safe Radheef headword lookup
README.md                         Project overview
```

## Add permanent knowledge

1. Read `AI-BRAIN.md` completely.
2. Add verified sentences to `VERIFIED_PAIRS`.
3. Add only explicit word meanings to `VERIFIED_WORDS`.
4. Add reusable verified phrases to `VERIFIED_PHRASES`.
5. Add grammar metadata with a stable rule ID.
6. Add or update tests.
7. Recalculate `SHA256SUMS.txt`.

## Teach from the website

1. Put one English sentence on each line.
2. Put its verified Dhivehi translation on the matching line.
3. Press **Learn paired lines**.
4. Use **Export brain JSON** to save or share the browser memory.

Browser lessons are not automatically shared with other visitors. They become permanent only after review and a repository update.

## Run locally

ES modules should be served through HTTP rather than opened directly as `file://`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Validation commands

```bash
node --check assets/js/knowledge-base.js
node --check assets/js/engine.js
node --check assets/js/app.js
node tests/engine.test.mjs
sha256sum -c SHA256SUMS.txt
```

## Safe editing rule

Do not put API keys, Supabase service-role keys or private credentials into this public repository.
