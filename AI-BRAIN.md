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
9. Tokens are evidence used during interpretation; they are not the translation itself.
10. English expressions must be interpreted according to complete-sentence meaning before a Dhivehi surface sentence is constructed.

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

## Meaning-based translation pipeline

Use this sequence for every sentence:

```yaml
translation_pipeline:
  - identify the intended meaning of the complete sentence
  - detect Dhivehi, English, and placeholder segments
  - translate English expressions according to context
  - reconstruct the sentence in natural Dhivehi order
  - apply noun, number, definiteness, and case rules
  - verify meaning, grammar, spelling, and fluency
```

Vocabulary lookup can propose candidates, but a candidate must be rejected when it conflicts with the complete sentence.

### Context-sensitive mapping guardrails

- “function” must not automatically become `ވަޒީފާ`; that normally means job/duty.
- “demonstrative” must not automatically become `މިސާލު ދެއްކުން`.
- “pronouns” must not automatically become `ވަކި ނަންތައް`.
- “them” must not automatically become `އެއިން`.
- “belongs” must not automatically become `ގެ`; possession may require a complete construction.

These items belong in `CONTEXT_SENSITIVE_TERMS`, not `VERIFIED_WORDS`.

## Verified noun-case lesson sentence

English meaning:

> In the last lesson, we learned how nouns change when case suffixes are attached and learned the meanings and uses of those suffixes.

Verified natural Dhivehi:

> ފަހުގެ ދަރުހުގައި، ނަންތަކަށް ކޭސް ސަފިކްސްތައް ގުޅާއިރު ނަންތައް ބަދަލުވާ ގޮތާއި، އެ ސަފިކްސްތަކުގެ މާނައާއި ބޭނުން ދަސްކުރީމެވެ.

Store this as one complete verified memory. Do not infer unconditional mappings for every English word inside it.

## Script detection

- Thaana: `\u0780–\u07BF`
- Arabic-script letters: Unicode property `\p{Script=Arabic}`. This intentionally permits common punctuation such as `؟` and `،`.
- English/Latin: `A–Z`, `a–z`

When teaching a Dhivehi pair:

- Require at least one Thaana character.
- Reject any Arabic-family character.
- Keep punctuation, spaces and numbers, but do not treat them as language evidence.

## Current grammar memory

## Lesson registry

Eight lessons have been received. “Received” and “fully encoded” are separate states.

| Lesson | Topic | Repository status |
| --- | --- | --- |
| 1 | Thaana script | Partially encoded |
| 2 | Sukun, empty letters and emphasis | Partially encoded |
| 3 | Nouns, plurals and indefinite markers | Summary received |
| 4 | Repetition, quotation and word order | Encoded and tested |
| 5 | Adjectives | Summary received |
| 6 | Demonstratives | Summary received |
| 7 | Pronouns and formality | Summary received |
| 8 | `އެއް` versus `އަކު` | Current summary encoded and tested |

Do not claim that the “50+ words, 60+ rules and 150+ examples” are implemented until the actual items exist in `knowledge-base.js` and have tests.

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

### Specific indefinite — `DV-INDEF-EH`

- Suffix: `އެއް`
- Meaning: a particular thing/person exists, but its identity is unknown or not stated.
- Lesson 8 example: `މީހެއް` — a person (specific but unidentified).

### Unspecified indefinite — `DV-INDEF-AKU`

- Suffix: `އަކު`
- Meaning: some unspecified or vague thing/person.
- It is also the indefinite form used when further suffixes are added.
- Lesson 8 example: `މީހަކު` — some person.
- Verified irregular place forms: `ތަން → ތަނަކު / ތާކު`.

Never collapse `އެއް` and `އަކު` to the same generic English article in reasoning. English surface translation may need context, but the internal semantic distinction must remain recorded.

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


## AguMagu translation intake — 2026-07-16

```yaml
request:
  source: "English passage about the AguMagu app"
  expected_length: "2 sentences"
  source_text_received: false

review:
  draft_translation_received: true
  candidate_vocabulary_received: true
  reusable_phrases_proposed: 8
  unseen_test_sentences_proposed: 4
  production_regression_tests_added: 0

corrections_identified:
  - "cheapest cannot be އެންމެ އަގުބޮޑު; that expresses a high/expensive price"
  - "shop/store cannot be ދައްކަން; use a noun such as ފިހާރަ according to context"
  - "shops/stores requires a plural noun such as ފިހާރަތައް"
  - "according to and allows require sentence-level context"
  - "with no exact English source, the draft cannot be verified for fidelity"

knowledge_state:
  verified_knowledge: []
  rule_based_inference:
    - "candidate SOV restructuring and case selection were discussed"
  unconfirmed_material:
    - "draft AguMagu Dhivehi paragraph"
    - "candidate word mappings"
    - "proposed reusable phrases"
    - "proposed test sentences"

status: "Awaiting the exact two English source sentences"
production_ready: false
next_action: "Receive the source, verify meaning, correct the Dhivehi, then add pairs, phrases and regression tests"
```

This entry records the conversation without promoting reviewed-but-unverified material into permanent translation memory.
