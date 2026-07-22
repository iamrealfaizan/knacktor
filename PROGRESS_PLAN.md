# Knacktor — UserProgress & Usability Features Plan

> Working spec for the UserProgress backend and the usability features that unmock the existing `/home` dashboard. Captures decisions from the planning interview. This is the reference for the build; implementation is a separate, phased step.

---

## Context

Knacktor's `/home` dashboard already ships finished UI for progress tracking, a GitHub-style streak heatmap, a progress ring, per-difficulty bars, a "continue learning" card, and a Question-of-the-Day tile — but **every value is a hardcoded mock** in `components/home/home-data.ts`, whose own header comment says *"Still mock until a UserProgress backend lands."* There is no collection linking a user to a problem, no write path (the `/api` layer is read-only by design, decision D16), and no prev/next navigation.

Meanwhile the pieces to power all of this already exist: a `users` collection with a stable `session.user.id`, a rich `problems` model, and an ordered curated `sheets` collection (`entries[].order`).

**The need:** build a **UserProgress backend** and unmock the existing UI — delivering progress/status tracking, streak heatmap, QOTD, context-aware prev/next navigation, account-backed notes, and bookmarks. The gap is almost entirely backend + wiring; the UI is largely pre-built and waiting.

---

## Decisions locked (planning interview)

| # | Decision | Choice |
|---|----------|--------|
| 1 | North star | All four (daily habit + structured mastery + visible progress + engagement metrics); build the full stack, sequenced |
| 2 | Solve signal (no code judge exists) | **Hybrid** — auto "Attempted" on engagement, manual **Mark solved** for completion |
| 3 | Streak rule | A **solve** keeps the streak; heatmap intensity = solves that day; attempt-only days render as a faint cell |
| 4 | Streak fairness | **User-local timezone** day boundary + **1 free streak-freeze per week**, auto-applied |
| 5 | QOTD | **Global, date-seeded deterministic** pick over a curated pool; pure computation, no write/storage |
| 6 | Prev/Next | **Context-aware** — walk the list the user came from (sheet/topic/pattern); fall back to global `number` |
| 7 | Data model | **State doc** (`userProblemProgress`) + **daily rollup** (`userDailyActivity`) + **streak state** (`userStreak`) |
| 8 | Write path | **Server Actions** calling a new `progress-service.ts`; keeps `/api` read-only (honors D16) |
| 9 | v1 scope | Everything: progress+status, streak/heatmap+ring, prev/next nav, QOTD, notes persistence, bookmarks |
| 10 | Status set | **To-do / Attempted / Solved** + an **independent bookmark** flag (any status can be bookmarked) |
| 11 | Gamification | **Defer** badges and weekly-goal tiles to a fast-follow |

---

## Architecture

- **Stack:** Next.js 14 App Router, MongoDB native driver, NextAuth v5 (Credentials). Reads via server components + `lib/content-service.ts`; auth uses Server Actions (`app/(auth)/signup/actions.ts`). shadcn/ui + `lucide-react` + `--kn-*` design tokens only.
- **Stable keys:** `session.user.id` (ObjectId hex) for `userId`; `problems._id` (ObjectId) for `problemId`, per decision D10.
- **Writes:** new Server Actions delegating to a new `lib/progress-service.ts`. **No new `/api` routes** — the read-only API principle (D16) stays intact. Escape hatch: if a native mobile client is ever added, expose the same service functions as thin API routes then.

### New collections

**`userProblemProgress`** — one doc per user×problem (source of truth for status, filters, nav badges, notes, bookmark)

```
userId: ObjectId
problemId: ObjectId
status: "todo" | "attempted" | "solved"
bookmarked: boolean
note: string
firstAttemptedAt: Date | null
solvedAt: Date | null
lastActivityAt: Date
```

Indexes: unique `(userId, problemId)`; `(userId, status)`; `(userId, bookmarked)`.

**`userDailyActivity`** — one doc per user×local-day (O(1) heatmap + streak reads)

```
userId: ObjectId
date: string   // "YYYY-MM-DD" in the user's local timezone
solves: number
attempts: number
```

Index: unique `(userId, date)`.

**`userStreak`** — one doc per user (freeze consumption is not purely derivable)

```
userId: ObjectId
currentStreak: number
longestStreak: number
lastSolveDate: string      // local "YYYY-MM-DD"
timezone: string
freezesAvailable: number   // reset to 1 each week
freezeWeekAnchor: string   // week key used to reset freezesAvailable
```

**QOTD:** stores nothing. `getQotd(localDate)` = deterministic hash of the date → index into the curated pool (main sheet entries).

---

## Build sequence (each phase ships independently)

### Phase 0 — Foundation (no user-visible change)
- Create `lib/progress-service.ts` with collection accessors + index bootstrap.
- Add a `getSessionUserId()` helper (wraps the NextAuth session; returns `null` when anonymous).
- Client timezone capture (`Intl.DateTimeFormat().resolvedOptions().timeZone`) passed into write actions.
- Extend TS contracts in `lib/types.ts`; document the 3 collections in `CLAUDE.md` and `rules/Schema.md`.

### Phase 1 — Progress & status
- Server Actions: `recordAttempt` (auto, fire-and-forget, deduped so opening a problem writes at most once), `markSolved` / `unmarkSolved`, `setStatus`, `toggleBookmark`.
- Problem page (`components/problem/top-bar.tsx` and/or `insight-rail.tsx`): **Mark-solved** + **bookmark** controls; auto-attempt effect on open.
- Browse/list: real per-problem status icons + working **Solved/Attempted/Todo** filters. Wire `toHomeRow()` / `statusOptions` in `app/home/page.tsx` and `home-data.ts` to real per-problem status via `progress-service`.

### Phase 2 — Streak & dashboard (biggest visible payoff; UI already exists)
- On solve: increment `userDailyActivity`; recompute `userStreak` (local tz + weekly freeze).
- Unmock `/home`: pass real data into `streak-card.tsx` (heatmap + streak), `progress-card.tsx` (ring + per-difficulty bars), `continue-learning.tsx`. Convert these from importing mock constants to accepting props from the `app/home/page.tsx` server component.
- Reads in `progress-service`: `getUserProgressSummary`, `getHeatmap(range)`, `getStreak`, `getProblemStatuses(ids[])`, `getContinueLearning`.

### Phase 3 — QOTD + navigation
- Wire the real global date-seeded QOTD tile (currently static `POTD` in `home-data.ts`), including a "you did today's ✓" check against `userProblemProgress`.
- Context-aware prev/next in `top-bar.tsx`: problem page accepts a `?from=` context param (e.g. `sheet:<slug>`, `topic:<slug>`); neighbors resolved server-side via `content-service.ts`; fall back to global `number`.

### Phase 4 — Notes + saved list
- Migrate notes from `localStorage` (`kn_notes_${slug}` in `insight-rail.tsx`) → `userProblemProgress.note` via a debounced Server Action; one-time import of any existing local note.
- Bookmarks/"saved" view backed by the `bookmarked` flag.

---

## Risks / edge cases to design around
- **Auto-attempt write spam** — `recordAttempt` short-circuits if already attempted; at most one write per open.
- **Streak decay on read** — effective `currentStreak` recomputed against *today's* local date (applying freeze) so a stale doc never shows a phantom streak.
- **Freeze semantics (thinnest spot)** — precise rule: one gap day absorbed per calendar week, auto-applied; `freezesAvailable` resets when `freezeWeekAnchor` changes.
- **Anonymous users (thin spot)** — progress needs login; dashboard/controls degrade gracefully (sign-in prompt) rather than break. Middleware already gates routes.
- **Timezone integrity** — day key computed from client-supplied tz at write time; store tz on `userStreak` for server-side/read-time recomputation.

---

## Files touched (when the build runs)
- **New:** `lib/progress-service.ts`.
- **Edit:** `lib/types.ts`, `components/home/home-data.ts`, `app/home/page.tsx`, `components/home/{streak-card,progress-card,continue-learning}.tsx`, `components/problem/{top-bar,insight-rail}.tsx`, `CLAUDE.md`, `rules/Schema.md`.

## Verification (end-to-end)
- Solve a problem while logged in → status flips to Solved, `/home` ring + heatmap increment, streak advances; refresh persists.
- Cross-midnight local-tz test → solve credited to correct local day; miss a day with a freeze available → streak holds; miss again → resets.
- QOTD identical for two users on the same date; "done today" check reflects a solve.
- Prev/next from a sheet walks sheet order; from a topic walks topic order; direct visit falls back to `number`.
- Anonymous visit → controls hidden / sign-in prompt, no errors.

---

## Task decomposition & build status (implemented)

Built autonomously in dependency order; each phase gated on `tsc` + `next lint` + `next build`.
Per-user data on the **static** problem page hydrates **client-side via Server Actions** (initial
status/bookmark, notes, neighbors) so `/problems/[slug]` stays SSG; `/home` and `/saved` are dynamic.

| Task | Scope | Key files |
|---|---|---|
| T0.1 | Progress-service skeleton: raw docs, indexes, `getSessionUserId`, accessors | `lib/progress-service.ts` (new) |
| T0.2 | Public plain types (ISO dates) | `lib/types.ts` |
| T0.3 | Docs + client tz helper | `CLAUDE.md`, `rules/Schema.md`, `lib/tz.ts` (new) |
| T1.1 | Writes (`recordAttempt`/`markSolved`/`unmarkSolved`/`setStatus`/`toggleBookmark`) + status reads | `lib/progress-service.ts` |
| T1.2 | Server Actions (guarded, anon-safe) | `app/actions/progress.ts` (new) |
| T1.3 | Solve/bookmark controls + auto-attempt, client-hydrated | `top-bar.tsx`, `problem-engine.tsx`, `mobile-overflow-sheet.tsx`, `use-problem-progress.ts` (new); `_id` added to `ProblemFull` (`lib/trace.ts`, `content-service.ts`) |
| T1.4 | Real per-row status + Solved/Attempted/To-do filter | `home-data.ts`, `app/home/page.tsx`, `browse-sidebar.tsx`, `browse-panel.tsx`, `lib/home-url.ts` |
| T2.1 | Streak + daily rollup (local-tz day, weekly freeze, read-time decay) | `lib/progress-service.ts` |
| T2.2 | Dashboard reads (`getUserProgressSummary`/`getHeatmap`/`getStreak`/`getContinueLearningRaw`) + catalog helpers | `lib/progress-service.ts`, `content-service.ts` (`getProblemsByIds`, `getProblemAfterNumber`) |
| T2.3 | Cards → prop-driven (+ empty states) | `streak-card.tsx`, `progress-card.tsx`, `continue-learning.tsx` |
| T2.4 | Wire dashboard data; remove dead mocks; real header streak | `app/home/page.tsx`, `home-data.ts`, `home-header.tsx` |
| T3.1 | Global date-seeded QOTD over the catalog | `lib/qotd.ts` (new), `content-service.getProblemDirectory` |
| T3.2 | QOTD tile + "done" check | `streak-card.tsx`, `app/home/page.tsx` |
| T3.3 | ~~Context-aware prev/next~~ — **removed at user request** (reverted top-bar arrows, `app/actions/nav.ts`, `getProblemNeighbors`, `?from=` plumbing) | — |
| T4.1 | Account-backed notes: debounced save + one-time localStorage migration | `lib/progress-service.ts`, `app/actions/progress.ts`, `insight-rail.tsx`, `problem-engine.tsx` |
| T4.2 | Saved view (all bookmarks) + dashboard link | `app/saved/page.tsx` (new), `app/home/page.tsx` |

**Deferred (decision 11):** badges (`NEXT_BADGE`) and weekly-goal (`WEEKLY_GOAL_REMAINING`) remain static placeholders.

### Post-review fixes (production hardening)
- **Status filter now whole-catalog, server-side.** The dashboard list fetches via a user-aware **Server Action**
  (`app/actions/browse.ts` → `browseProblemsAction`) that resolves the selected statuses into an `_id`
  include/exclude set (`resolveStatusFilterIds`) and applies it inside `getProblemsPage` (new `includeIds`/
  `excludeIds` on `ProblemFilters`). This fixes "Solved shows no problems" when the solved item sat on a later
  page, and also fixes stale statuses on pages 2+. SSR applies the same filter so shared `?status=` links are
  correct on first paint. `/api/problems` stays read-only (D16) for the public list.
- **Notes never lost.** `NotesArea` now flushes the pending write on **blur** and on **unmount** (fire-and-forget;
  survives SPA navigation), not just on the 800 ms debounce — previously navigating away before the timer fired
  discarded the note. The full bookmark list lives at `/saved`.

Verify runtime behavior with the app running (build/typecheck/lint all pass).
