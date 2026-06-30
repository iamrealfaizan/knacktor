# S5 — Animation preview review (Gate 3), then assemble + ingest

The simulation is built and passed `dry-run` (incl. liveness), but **nothing is ingested yet**. The human
reviews the REAL rendered animation and gives GREEN before anything reaches MongoDB. Because the preview
renders the same `VisualState`s ingest will store, **what you approve is exactly what ships** — no drift.

## 1. Render the preview

```bash
npm run review-sheet -- authoring/<slug>            # all approaches, or add an approachId
```
Writes `authoring/<slug>/review.html` — a self-contained filmstrip of the real rendered frames (pivotal
steps: key events + first/last + even fill) for the representative + edge presets, each frame beside its
highlighted code line and 2×2 narration, topped with the liveness report and the FidelityReview checklist.

## 2. 🟦 Gate 3 — publish + present, then STOP

Publish `review.html` as a **claude.ai Artifact** (it's a self-contained fragment — pass the file to the
Artifact tool) and give the user the link. Ask them to review the animation against the checklist and
return a verdict in `rules/FidelityReview.md`'s format. **Wait.**

- **GREEN / PASS** → go to step 3.
- **REVISE** (they name step + field + fix) → edit ONLY `mapping.json`/`narration.json`, re-run
  `dry-run`, re-run `review-sheet`, re-publish, re-present. Loop until GREEN. (Line numbers are frozen, so
  no cascade.)
- **DEFER** (a primitive truly can't show the unit of work) → stop; record `{ unsupported, neededRenderer }`
  in `state.json`; author after that renderer is built.

## 3. On GREEN — assemble + import + ingest

Build `combined.json` mechanically (no new content):
- **Top level** ← all `problem.json` fields + `"presets"` ← the `presets.json` array.
- **`approaches`** ← for each `approaches/<id>/`: every field of `approach.json`, plus `"solution"` =
  `solution.py` text, `"mapping"` = `mapping.json`, `"narration"` = `narration.json`.

```bash
npm run import-problem -- authoring/<slug>/combined.json    # add --force if the slug exists (2nd approach)
npm run ingest                                              # traces + validates + writes Mongo
```
`dry-run` already passed, so ingest's gates pass. The bundle lands in `seeds/problems/<slug>/` (version-
controlled source of truth) and the problem is live at `/problems/<slug>`.

## 4. Smoke (not a re-review)

`npm run dev` → confirm `/problems/<slug>` loads and steps through. The visual sign-off already happened at
Gate 3; this only confirms the page renders. Mark `state.humanGates.final = "approved"`, `state.stage = "done"`.
