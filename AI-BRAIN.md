# AI Brain — Dhivehi Translation Engine

This file is the operating instruction for any AI or developer editing this repository.

## Goal

Build a trustworthy English ↔ Dhivehi translation-memory engine that learns from verified lessons. Accuracy is more important than producing an answer for every input.

## Non-negotiable rules

1. Dhivehi text must use Thaana (`U+0780–U+07BF`).
2. Arabic, Sindhi and Urdu characters must never be accepted as Dhivehi.
3. Never turn an unknown English word into Thaana and claim that it is a translation.
4. Unknown meaning must be shown as unknown: `⟦word⟧`.
5. A complete verified sentence has priority over phrase, word and grammar inference.
6. Do not derive word-to-word meanings from a multiword sentence unless alignment is verified.
7. Every permanent memory must have a human-verifiable source or be explicitly provided as correct by the project owner.
8. Preserve the distinction between verified rules and implementation inferences.

## Learning pipeline

```text
Source lesson
  ↓
Extract claims and examples
  ↓
Validate Thaana script
  ↓
Classify as sentence / phrase / word / grammar / morphology
  ↓
Store verified knowledge in knowledge-base.js
  ↓
Implement only deterministic rules in engine.js
  ↓
Add tests for supplied examples
  ↓
Update documentation and SHA256SUMS.txt
```

## Translation priority

1. Exact verified sentence memory
2. Exact verified phrase memory
3. Verified vocabulary tokens
4. Verified morphology and suffix rules
5. Word-order reasoning
6. Explicit unknown marker

Phonetic transliteration is a separate operation. It must not be presented as semantic translation.

## Script detection

- Thaana: `\u0780–\u07BF`
- Arabic-script letters: Unicode property `\p{Script=Arabic}`. This intentionally permits common punctuation such as `؟` and `،`.
- English/Latin: `A–Z`, `a–z`

When teaching a Dhivehi pair:

- Require at least one Thaana character.
- Reject any Arabic-family character.
- Keep punctuation, spaces and numbers, but do not treat them as language evidence.

## Current grammar memory

### Default word order — `DV-SOV-001`

Dhivehi normally uses Subject–Object–Verb. Word order is flexible, so this is a default reasoning rule, not an absolute rewrite rule.

### Repetition/emphasis — `DV-FOCUS-EY`

- Suffix: `އޭ`
- Meaning: the speaker emphasizes information, often implying it was said earlier.
- The focused constituent normally moves to the beginning.
- It can attach to nouns, verbs, adjectives and larger subject/object units.
- Do not attach it inside an adjective+noun unit when the intention is to focus the complete unit.

### Quotation/reporting — `DV-FOCUS-OA`

- Suffix: `އޯ`
- Meaning: information is reported or attributed to somebody else; the speaker does not present it as direct certainty.
- The focused constituent normally moves to the beginning.
- English rendering depends on context: “reportedly,” “apparently,” or “someone said that.”

### Important limitation

The sound changes that occur when `އޭ` or `އޯ` attaches are lexical/morphological. Use verified form memory before attempting to strip the suffix mechanically.

## Supplied Lesson 4 forms

| Focused form | Base | Rule |
| --- | --- | --- |
| ބުޅަލޭ | ބުޅާ | repetition |
| ބުޅަލެކޭ | ބުޅަލެއް | repetition |
| ރަށޭ | ރަށް | repetition |
| މަންމަމެނޭ | މަންމަމެން | repetition |
| ދޫނިތަކެކޭ | ދޫނިތަކެއް | repetition |
| ދިވެހިންނޭ | ދިވެހިން | repetition |
| ބުޅަލެކޯ | ބުޅަލެއް | quotation |
| ދިވެހިންނޯ | ދިވެހިން | quotation |
| އަތޯ | އަތް | quotation |
| ތައްޓޯ | ތަށި | quotation |

## Memory layers

### Permanent shared memory

Stored in `assets/js/knowledge-base.js`. It is delivered to every visitor and changed only through a repository commit.

### Browser lesson memory

Stored in `localStorage` under `bas_user_pairs`. It remains on that browser. Users can export it as `dhivehi-translation-brain.json` for review and permanent inclusion.

## Procedure for a new article or lesson

1. Preserve the source title, date and author in the commit or documentation.
2. Extract only explicit rules and examples.
3. Label uncertain interpretations as inference.
4. Add exact bilingual pairs without paraphrasing the Dhivehi.
5. Add isolated vocabulary only when the source gives an explicit meaning.
6. Add grammar rules with a stable rule ID.
7. Add known irregular forms to form memory.
8. Run syntax, script and example tests.
9. Update `FILE-MAP.md` when responsibilities change.
10. Recreate `SHA256SUMS.txt` last.

## Definition of done

- The website loads without console syntax errors.
- English → Dhivehi never emits Arabic/Sindhi/Urdu characters.
- Dhivehi lessons containing Arabic-family script are rejected.
- Supplied verified sentences translate exactly.
- Unknown meanings are visible and are not fabricated.
- Documentation and checksums match the published files.
