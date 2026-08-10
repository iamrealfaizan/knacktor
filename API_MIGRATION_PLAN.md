# Knacktor — Server Actions → REST API Migration Plan

> Planning doc only — no code in this pass beyond the new `app/models/` schemas it depends on. Implementation is a separate, phased step, same as `PROGRESS_PLAN.md`.

---

## Context

Decision **D16** (see `rules/Tracker.md`) locked "`/api` stays read-only; all mutations go through Server Actions." That was a deliberate choice, documented in three separate files (`app/actions/admin-users.ts`, `app/actions/browse.ts`, `app/actions/progress.ts`) — not an oversight. This plan reverses it: **every mutation becomes a documented `/api` route**, and the UI calls `fetch()` instead of importing a Server Action. Reasoning (from the open-source discussion): a visible, stable, documented HTTP surface is easier for external contributors to read, test, and reason about than a set of RPC functions whose call shape you can only discover by opening the source file. This should be logged as a new decision (**D26**, reversing D16) in `rules/Tracker.md` once approved.

This is a **full replacement**, not a hybrid — by the end of this plan, `app/actions/` is deleted and nothing in the app calls a Server Action for a mutation.

---

## What exists today (full inventory)

| File | Function | Reads/Writes | Auth today | Target route |
|---|---|---|---|---|
| `app/actions/admin-users.ts` | `setUserRoleAction(userId, role)` | writes `users` | `requireAdmin()` inside the action | `PATCH /api/admin/users/:id/role` |
| `app/actions/admin-users.ts` | `setUserStatusAction(userId, status)` | writes `users` | `requireAdmin()` inside the action | `PATCH /api/admin/users/:id/status` |
| `app/actions/browse.ts` | `browseProblemsAction(state)` | reads `problems` + `userProblemProgress` | session-aware, no admin | `GET /api/browse` |
| `app/actions/progress.ts` | `recordAttemptAction(problemId, tz)` | writes `userProblemProgress`/`userDailyActivity` | session required | `POST /api/progress/attempts` |
| `app/actions/progress.ts` | `markSolvedAction(problemId, tz)` | writes same | session required | `POST /api/progress/solved` |
| `app/actions/progress.ts` | `unmarkSolvedAction(problemId, tz)` | writes same | session required | `DELETE /api/progress/solved` |
| `app/actions/progress.ts` | `toggleBookmarkAction(problemId)` | writes `userProblemProgress` | session required | `POST /api/progress/bookmarks` |
| `app/actions/progress.ts` | `getMyProblemProgressAction(problemId)` | reads `userProblemProgress` | session required | `GET /api/progress/:problemId` |
| `app/actions/progress.ts` | `getMyNoteAction(problemId)` | reads `userProblemProgress` | session required | folded into the `GET` above |
| `app/actions/progress.ts` | `saveNoteAction(problemId, note)` | writes `userProblemProgress` | session required | `PUT /api/progress/:problemId/note` |

Existing `/api/*` routes (`problems`, `problems/[slug]`, `problems/[slug]/traces`, `topics`, `patterns`, `difficulties`) stay as-is — they're already the read-only public surface this migration extends.

## The one structural gap this migration must close first

`middleware.ts` explicitly **excludes `/api/*` from edge auth** (`matcher: ["/((?!api|_next/static|...).*)"]`) — "read-only content APIs stay open." That was safe because nothing under `/api` could mutate anything. Once mutating routes live there, **none of them get any auth for free from the middleware** — each one must call `requireAdmin()` / `getSessionUserId()` itself, exactly like the Server Actions do today, or it's an open write endpoint. This isn't a new risk introduced by the migration, but it does mean "add a route" and "add the auth check inside it" can no longer be two separate mental steps — they have to ship together, every time, with no edge-layer backstop. Phase 0 below adds a lint rule to make forgetting this loud instead of silent.

Also worth naming since it flips a default: Server Actions get CSRF protection for free (no stable, guessable endpoint to forge a request against). Plain `/api` routes don't — once these are real POST/PATCH/DELETE URLs, add a same-origin check (Next.js's `Origin`/`Host` header comparison, or a `next-safe-action`-style helper) before this ships, not after.

---

## Phased plan

### Phase 0 — Groundwork (no user-facing change)
- Depends on `MODELS_MIGRATION_PLAN.md` Phase 1 landing first: each new route should validate its input/output against the real Mongoose model shapes, not a second, separate guess at them. (The original plan here used standalone zod schemas in `app/models/`; that approach was scrapped in favor of adopting Mongoose as the ODM — see `MODELS_MIGRATION_PLAN.md`.)
- Decide and document one response envelope for all new routes (e.g. `{ data, error }`, matching what `app/api/problems/route.ts` already returns) so contributors don't invent a new shape per route.
- Add a shared `requireSessionRoute()` / `requireAdminRoute()` helper (route-handler equivalents of `lib/admin-guard.ts`'s `requireAdmin()`) so every new route starts the same way, and add an ESLint rule (or a small custom check) that flags any file under `app/api/**/route.ts` exporting a non-`GET` handler that doesn't call one of these helpers in its first few lines.
- Because there is currently **no test suite at all** (confirmed: no Jest/Vitest config, no `*.test.ts` files), write integration tests for each route *as it's built*, not after — this migration has no safety net otherwise. At minimum: one "logged out → 401", one "wrong user/role → 403", one "happy path" test per route.

### Phase 1 — Progress routes (lowest risk: no privilege escalation surface, already scoped to `req.session.user.id`)
Migrate `app/actions/progress.ts`'s 7 functions to the routes in the inventory table. Each route body is mostly a lift-and-shift of the existing function — the interesting change is validating `problemId`/`note`/`tz` with `app/models` schemas instead of the current hand-rolled `validId()` check, and returning HTTP status codes (401/400/500) instead of `{ ok: false, ... }` objects.

### Phase 2 — Browse route (read, but user-aware — the trickiest cache story)
`browseProblemsAction` mixes public catalog data with a signed-in user's per-row status. Unlike the existing public `/api/problems` (which is safely cacheable, per `CACHE_HEADERS`), `GET /api/browse` must **never** send the same cache headers — it's per-user. Call this out explicitly in the route so a future edit doesn't accidentally copy the cacheable pattern from `problems/route.ts` onto it.

### Phase 3 — Admin routes (highest risk — do this last, with the most review)
`setUserRoleAction`/`setUserStatusAction` are the two functions the layered admin-guard design (`lib/admin-guard.ts`) exists to protect. Route versions must preserve **all three defense layers** — the route itself is a new instance of "layer 3" (call `requireAdmin()` before any write), and needs the same re-read-role-from-DB behavior, not a trust of the session JWT. This is exactly the kind of change that should sit behind the `CODEOWNERS` entry recommended in the earlier open-source review (require your review on any `app/api/admin/**` route, same as `app/actions/admin-users.ts` today).

### Phase 4 — Client cutover
Switch every calling component from importing the Server Action to a `fetch()` call (or a thin typed client wrapper in `lib/api-client.ts` so components don't hand-write `fetch` + JSON parsing per call site). Do this file-by-file, one route at a time, immediately after that route's Phase 1–3 work — don't batch all client changes to the end, or you're back to a big-bang cutover with no incremental rollback point.

### Phase 5 — Cleanup
- Delete `app/actions/admin-users.ts`, `app/actions/browse.ts`, `app/actions/progress.ts` once nothing imports them.
- Update the header comments in `middleware.ts` (currently says "read-only content APIs stay open" — no longer true) and `rules/Security.md`.
- Log **D26** in `rules/Tracker.md`: "supersedes D16 — `/api` mutation routes added for OSS discoverability/testability; Server Actions removed."
- Re-check `README.md`/`CONTRIBUTING.md` for any reference to "Server Actions are the only mutation path."

---

## Risks specific to this migration (beyond the CSRF/auth-gap points above)

- **No test suite today** is the biggest one — a full replacement of every mutation path, with zero automated regression coverage, is exactly the scenario integration tests exist for. Phase 0's "test as you build" rule is load-bearing, not optional, for this specific migration.
- **Losing `revalidatePath`'s convenience.** Server Actions pair naturally with `revalidatePath()` right after a write. Route handlers can still call `revalidatePath()` server-side (it's not Server-Action-exclusive), but the *client* now needs to explicitly trigger a refresh (e.g. `router.refresh()`) after a successful `fetch()` — that wiring has to be added at every call site in Phase 4, or pages will show stale data after a mutation that used to auto-revalidate.
- **Surface area goes from "hidden RPC" to "guessable URL."** That's the point of the migration, but it means rate-limiting and input validation now carry more weight than before — nothing currently in the repo does rate limiting (worth a follow-up, not necessarily blocking this migration).

## Effort shape (rough, for sequencing — not a commitment)

Phase 0 and Phase 1 are the bulk of the *new* work (routes + tests + client wrapper pattern established). Phases 2–3 are smaller but need more review time per line given what they touch. Phase 4 is mechanical but must happen alongside 1–3, not after. Phase 5 is cleanup once everything else is verified live.
