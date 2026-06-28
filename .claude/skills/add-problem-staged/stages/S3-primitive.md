# S3 — Primitive + visualizationIntent (per approach) → extend `approach.json`

**Input:** frozen solution + the S2 trace (real vars + per-step values) + statement.
**Output:** `approach.json` extended with `primaryPrimitive`, `auxStructures`, `resultSpec`, `varColors`,
`visualizationIntent`. No mapping rules / line explanations yet.
**Gate (light):** named vars exist in the trace; primitive ∈ the 10; varColors are token keys (no hex).
**🟦 Human Gate 2** — the primitive / fidelity call (the one subjective gate).

## Choose the primitive by the "unit of work" test

The visual's unit of work MUST equal the algorithm's unit of work — the smallest thing the algorithm
repeatedly *does* must be what the animation makes central. The 10 primitives (and what each shows) are in
`rules/Authoring.md` §3 / `ADDING_PROBLEMS.md` §3. Common mappings: compare array elements → `array`;
heights/areas → `bar-container`; hash lookups → `hashmap`; stack push/pop → `stack`; tree/linkedList/grid/
graph as named; recursion → `recursion`. A misleading-but-valid visual is worse than none — if no primitive
honestly fits, DEFER (record `{unsupported, neededRenderer}`).

> Cautionary example (`rules/FidelityReview.md`): Longest Common Prefix drew each whole string as one cell
> — but the unit of work is the **character at column i**, so it needed a char-grid and was DEFERRED.

## Extend approach.json

```jsonc
{
  "primaryPrimitive": "hashmap",
  "auxStructures": ["array"],          // secondary structures shown alongside (D19), or []
  "resultSpec": { "varName": "result", "label": "RESULT", "render": "scalar|list|tuple-list|boolean|string" },
  "varColors": { "i": "ptr-i", "num_map": "special", "result": "result" },  // token keys only
  "visualizationIntent": "init: …; loop: …; check: …; update: …; return: …"  // one segment per phase
}
```
- `resultSpec.varName` and every var in `varColors` must be a REAL variable from the S2 trace.
- `varColors` tokens only: `ptr-i, ptr-j, ptr-lo, ptr-hi, special, result, amber, compared, current, error, gold`.
- `visualizationIntent` is not shown to users — it's the contract S4b's mapping is checked against.

## 🟦 Human Gate 2 — produce this packet, then STOP and wait

Present, using REAL `example-1` traced values:
1. **Unit of work** — one sentence.
2. **Recommended primitive** + why its cells == that unit of work (cite the `rules/FidelityReview.md` table).
3. **DSL-wiring walkthrough** — how `valuesFrom`/`pointers`/`cellStateRules`/`auxMappings` map to the traced
   state at 1–2 pivotal steps, naming real vars (e.g. "at step 5, `i`=1, `complement`=2; pointer `i` on
   cell 1; matched entry flips to `result`"). Note DSL limits and the workaround (no `in` → flag; no slice).
4. **D17 escape-hatch check** — does `custom` apply? (≥2 of: 2+ primitives must coordinate; spatial layout
   IS the teaching point; animation logic inexpressible in the DSL.)
5. **ASCII mockup** at init / one key step / return, one sentence each: "the learner sees ___ and understands ___."
6. **Fidelity risk** — any step the visual might mislead.
7. Ask: **"Proceed with `<primitive>` for `<approach>`? Different primitive, or DEFER (needs renderer X)?"**

On approval: `humanGates.primitive.<id> = "approved"`, approach `stage = "S4a"`. On DEFER: set
`state.deferred` and STOP — author after the renderer exists.
