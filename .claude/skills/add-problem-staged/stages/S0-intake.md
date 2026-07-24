# S0 — Intake & taxonomy → `problem.json`

**Input:** the pasted LeetCode statement (and the vetted solution, kept aside for S1).
**Output:** `authoring/<slug>/problem.json` (draft). No solution / presets / mapping yet.
**Gate:** every taxonomy slug exists in the seed lists; JSON parses.

## Produce

```jsonc
{
  "schemaVersion": "2.0",
  "slug": "<kebab-case of title>",
  "number": <LeetCode number>,
  "title": "<title>",
  "difficulty": "easy|medium|hard",
  "topics": ["<slug>", ...],          // 1+
  "patterns": ["<slug>", ...],        // 1+
  "statement": "<FULL verbatim statement, \\n for line breaks>",
  "supportsCustomInput": true,        // false if inputs are not int-based (e.g. strings)
  "recommendedApproachId": "optimal", // optimal-first
  "inputConstraints": {
    "fields": [
      { "name": "<param>", "type": "int[]|int", "label": "...", "placeholder": "...",
        "min": <n>, "max": <n>, "minLen": <n>, "maxLen": <n> }   // minLen/maxLen for int[] only
    ],
    "maxSteps": 2000
  }
}
```

## Rules

- **Taxonomy slugs must come from the seeded lists — never invent.** Read the canonical lists:
  `seeds/difficulties.json`, `seeds/topics.json`, `seeds/patterns.json`. If nothing fits a pattern well,
  pick the single closest one (e.g. never write `string-scanning`). An unknown slug fails ingest.
- `inputConstraints.fields[].type` may only be `"int[]"` or `"int"`. If the input isn't integer-based
  (strings, grids of chars, linked lists, trees), set `"supportsCustomInput": false` — the field entry is
  then informational only.
- `field.name` values will have to **exactly match the solution method's parameter names** (enforced at
  S2 when presets are traced). Note them now.
- `statement`: paste the real problem statement verbatim (examples + constraints included).

## Approaches plan (D23 — decide now, execute in S1)

Every problem needs **≥2 approaches: a brute force AND an optimal**, both LeetCode-runnable and
interview-standard. Decide the plan here and record it in `state.json` (`approachesPlan`):

- **Solution(s) provided by the user?** Use them. If the user gave only the optimal, **also author the
  brute** (standard interview brute force). If they gave only the question/test cases, **author both**
  yourself (standard interview solutions), and verify them at S1/S2 (trace every preset → matches the
  known answer).
- **Rare single-approach case.** Only if the problem genuinely has one reasonable approach by
  interview/LeetCode standards. Do **not** decide this silently — you will surface it at Gate 1 and need
  the user's explicit approval, recorded as `humanGates.singleApproachException`.
- `recommendedApproachId` = the **optimal** approach id. Run S1→S4 for **each** approach (optimal first,
  then brute).

## Gate (run / check)

- JSON parses.
- Cross-check `difficulty`, every `topics[]`, every `patterns[]` against the three seed files above.

Write `problem.json`, record `approachesPlan` in `state.json`, set `state.stage = "S1"`, then proceed to
S1 for the optimal approach (then repeat S1 for the brute).
