# File Map — Where to Edit

Use this map before changing the project.

| Need | Edit | Do not edit |
| --- | --- | --- |
| Add a verified translation | `assets/js/knowledge-base.js` | CSS or HTML |
| Add Dhivehi grammar knowledge | `assets/js/knowledge-base.js` and `AI-BRAIN.md` | UI handlers |
| Change translation reasoning | `assets/js/engine.js` | Permanent data values |
| Change buttons/import/export/local memory | `assets/js/app.js` | Engine rules |
| Change colors, spacing or mobile layout | `assets/css/styles.css` | Knowledge base |
| Change page sections or labels | `index.html` | Translation memory |
| Change AI editing workflow | `AI-BRAIN.md` | Runtime code unless needed |
| Add regression/safety checks | `tests/engine.test.mjs` | Production knowledge |
| Check file integrity | `SHA256SUMS.txt` | Never edit hashes manually |

## Logical boundaries

### `knowledge-base.js`

Contains facts: verified pairs, vocabulary, phrases, suffixes, script ranges, grammar metadata and irregular form memory. It should not manipulate the DOM or browser storage.

### `engine.js`

Contains reasoning: normalization, validation, memory priority, token lookup, suffix analysis, word-order transformation, focus interpretation and confidence calculation. It should not render the website.

### `app.js`

Contains interaction: reading inputs, displaying results, localStorage, JSON import/export, copy/paste and UI status. It should not contain permanent Dhivehi knowledge.

### `styles.css`

Contains presentation only. It must preserve separate LTR English and RTL Thaana text areas.

## Change sequence

```text
knowledge → engine → tests → documentation → hashes → commit
```

## SHA editing workflow

After every final change, run:

```bash
find . -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS.txt
```

Then validate:

```bash
sha256sum -c SHA256SUMS.txt
```
