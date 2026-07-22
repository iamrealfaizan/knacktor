# Knacktor — Architecture Hardening, Models Layer & Versioned API

> Planning doc (not yet implemented). Captures the solution-architect review + the decisions locked in the grilling interview. Companion to [PROGRESS_PLAN.md](PROGRESS_PLAN.md) (the shipped UserProgress work). **Status: approved, execution deferred — we continue later.**

## Context

A solution-architect review surfaced structural gaps that the current design can't carry to the stated roadmap (hundreds→thousands of users, ~1000 problems, **a native mobile app and a public/third-party API both coming**):

- **Opaque data flow.** Web data is fetched via Server Components (invisible in the Network tab) and mutated via Server Actions (opaque POSTs). Hard to observe/debug — the core pain.
- **No schema/model safety.** Raw MongoDB driver + hand-written `Raw*` interfaces scattered across services. No single source of truth, no write-time validation, no migrations.
- **Perceived slowness / "hangs."** Serverless cold starts (Vercel free tier) + a cold Atlas connection, and **no `loading.tsx`/`error.tsx` anywhere**, so waits look like freezes and errors show the raw Next.js digest page.
- **Roadmap blocked.** Native mobile + third-party clients **cannot** consume Server Components/Actions — they need a real HTTP API.
- **Scale risk.** Every problem page is pre-rendered at build; at ~1000 problems that means slow CI + huge deploys.

**Outcome intended:** a fast, observable, safely-typed, API-served system that keeps the web's fast first paint, unblocks mobile/third-party, and hardens the data layer under a **live product with paying users** — rolled out without breaking existing data.

## Decisions locked (grilling interview)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Scope | Everything: perf + Zod models/schema + versioned REST API + migrations + tests. **Observability tooling (structured logs/Sentry) DEFERRED** to a later phase (use Vercel logs meanwhile) |
| 2 | Runtime | Vercel **free tier now**, may migrate later → favor **portable** fixes; flag paid-tier-only levers |
| 3 | Models | **Zod-first** `lib/models/` (schema = single source → inferred TS types → validate) + **thin repository** layer + **migration runner** |
| 4 | API | **Versioned REST `/api/v1`** over the repository/service layer; **includes write endpoints (supersedes D16 "read-only API")**; Bearer-token auth for non-web clients |
| 5 | Web | Keep **RSC for first paint**; move **interactive** calls (browse pagination, progress writes, notes) to `/api/v1` (replace those Server Actions) so they're visible in the Network tab |
| 6 | Testing | **Vitest** — unit (pure logic + Zod models) + integration (repository + REST handlers) via `mongodb-memory-server` |
| 7 | Rollout safety | **Shadow log-only validation first** (never reject) → fix drift + backfill → **flip to strict** |
| 8 | Page generation | **Hybrid**: prerender a popular subset at build + **on-demand ISR** for the rest |

## Target architecture (after this work)

```
lib/models/*.ts        Zod schema per collection → inferred types (replaces hand-written types)
lib/repositories/*.ts  thin CRUD over the native driver + validation seam (log-only → strict)
lib/*-service.ts       business logic, now calling repositories (not the driver directly)
app/api/v1/**          versioned REST (read + write) over services; Bearer auth for non-web
lib/api-client.ts      typed browser client the web uses for interactive calls
migrations/ + runner   versioned schema migrations, tracked in a _migrations collection
tests (Vitest)         unit + integration against mongodb-memory-server
```
Web pages still render via Server Components (fast first paint); only interactions go through `/api/v1`.

## Build sequence (phased, each independently shippable)

### Phase 1 — Perf & UX relief (no architecture change; ship first for immediate impact)
- Add `app/problems/[slug]/loading.tsx` and `app/home/loading.tsx` — real skeletons so waits never look frozen.
- Add `app/error.tsx` + `app/global-error.tsx` — friendly retry screen instead of the raw digest page.
- Harden the Mongo connection path in `lib/mongodb.ts` (self-heal already added) and **document Atlas↔Vercel region alignment**; note that full cold-start elimination needs a paid tier (min-instances) or a long-running host.
- Cache full-catalog reads (QOTD directory in `lib/qotd.ts`, facets in `content-service`) with a short TTL / `unstable_cache`.
- `app/problems/[slug]/page.tsx`: switch `generateStaticParams` to a **popular subset** + on-demand ISR for the rest.

### Phase 2 — Models & repository layer (Zod-first)
- `lib/models/*.ts`: Zod schema per collection (`problems`, `topics`, `patterns`, `difficulties`, `sheets`, `traces`, `users`, `userProblemProgress`, `userDailyActivity`, `userStreak`); infer TS types and progressively replace the hand-written types in `lib/types.ts` and the `Raw*` interfaces.
- `lib/repositories/*.ts`: thin CRUD wrappers over the native driver with a **validation seam running in log-only (shadow) mode** (decision 7).
- Refactor `content-service.ts` / `progress-service.ts` / `user-service.ts` to call repositories (keep their public function signatures stable so callers don't churn).
- `migrations/` + `npm run migrate` runner + `_migrations` collection; author a **backfill migration** bringing legacy docs into schema conformance.

### Phase 3 — Versioned REST API (`/api/v1`)
- `app/api/v1/**` routes over services/repositories: reads (problems list/detail/traces, taxonomy) **and writes** (progress attempt/solve/bookmark/status, notes, browse/list with status filter).
- Shared auth guard: reuse the NextAuth session cookie for web **and** accept a Bearer token for non-web clients; standard `{ data, error }` envelope, pagination, typed error codes, a rate-limit stub.
- A short contract doc (OpenAPI or a markdown table) for future mobile/third-party devs.

### Phase 4 — Point the web at `/api/v1` for interactions
- Add `lib/api-client.ts` (typed fetch wrapper) and replace the interactive Server Actions with calls to `/api/v1`:
  - `components/home/browse-panel.tsx` (was `browseProblemsAction`),
  - `components/problem/use-problem-progress.ts` (attempt/solve/bookmark),
  - `components/problem/insight-rail.tsx` `NotesArea` (notes).
- Remove the now-dead Server Actions in `app/actions/*`. First paint stays RSC.

### Phase 5 — Tests + flip to strict
- Vitest config + `mongodb-memory-server`; unit tests (streak/freeze, QOTD hash, status-filter id resolution, Zod models) + integration tests (repositories + `/api/v1` handlers); wire into CI.
- Once shadow-validation logs are clean and the backfill has run, **flip validation to strict** (reject bad writes; enforce on read).

### Phase 6 — Observability (DEFERRED — explicitly out of scope now)
Structured logging + request IDs + timing + error tracking (Sentry) is a **later** effort; use Vercel's built-in logs until then. Listed so it isn't forgotten.

## Rollout safety (live product, paying users)
- No destructive change lands without the backfill migration proven on a copy first.
- Validation is **log-only** through Phases 2–4; strict only in Phase 5 after drift is resolved.
- Each phase is independently deployable and reversible; `/api/v1` is additive so nothing breaks while the web is migrated.

## Verification (per phase)
- **P1:** app never shows a frozen blank on navigation; a thrown server error shows the retry screen, not the digest page; cold problem loads then caches; catalog reads cached.
- **P2:** every service still returns the same shapes; shadow-validation logs list any legacy-doc drift; `npm run migrate` applies + records + is idempotent; backfill dry-run matches expectations.
- **P3:** `/api/v1` endpoints return correct data with cookie auth (web) and Bearer auth (simulated mobile); writes persist; unauthorized calls rejected.
- **P4:** browse pagination, solve/bookmark, and notes all show as named `/api/v1` calls in the Network tab and behave identically; no dead Server Actions remain.
- **P5:** `npm test` green in CI; after the strict flip, a deliberately malformed write is rejected and surfaced cleanly.
- **Gate each phase:** `tsc` + `next lint` + `next build` clean; manual smoke of the touched flows.

## Notes / constraints
- **D16 is superseded**: `/api/v1` now has write routes (still funneled through repositories + auth). Update `CLAUDE.md`/`rules/Schema.md` to reflect this when Phase 3 lands.
- Portability: keep fixes host-agnostic; Vercel-only levers (min-instances) are noted, not assumed.
- This is a multi-phase effort; Phases 1 → 5 are ordered by dependency. Phase 1 is the fastest path to the "it stopped feeling broken" outcome and can ship on its own first.
