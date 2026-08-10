# Knacktor — Raw MongoDB Driver → Mongoose Models Migration Plan

> Planning doc only — no code yet. The zod-based `app/models/*.model.ts` files from the previous pass were deleted; this plan replaces that approach with a real Mongoose ODM, matching the pattern used across your other projects (schema + model per collection, defined once, queried through everywhere).

---

## Context

Today Knacktor talks to MongoDB through the raw `mongodb` driver only — no ODM. There's no single object that *is* "the Problem model"; there's a TS interface (`lib/types.ts`) for the shape, a private `Raw*` interface next to some services for the storage shape, and hand-written `.collection("problems").find(...)` calls scattered across `lib/content-service.ts`, `lib/user-service.ts`, `lib/admin-user-service.ts`, `lib/progress-service.ts`, and four CLI scripts. Adopting Mongoose collapses "shape + validation + query surface" into one file per collection, the way your reference `Staff` model does — and it buys a few things the raw driver can't:

- **Real validation at the DB boundary** (`required`, `enum`, `trim`, `min`) instead of nothing — today a malformed document can be written and nothing catches it until a read breaks.
- **`.populate()` for relationships**, replacing the hand-written `resolveProblem()` in `content-service.ts` that manually swaps `difficultyId`/`topicIds`/`patternIds` for their slugs.
- **One obvious file per collection** to point a new contributor at — the actual thing you asked for two turns ago.

This is a bigger lift than the zod version, though: it's not an additive layer next to the existing driver code, it's a **replacement of the query mechanism itself** in every file that touches Mongo.

## What exists today (the accurate inventory, confirmed by reading the code — not assumed)

| Collection | Current access | Indexes already created in code |
|---|---|---|
| `problems` | `lib/content-service.ts` | `slug` (unique), `difficultyId`, `topicIds`, `patternIds`, `number`, text index on `title`+`statement` (`scripts/ingest.ts:33-40`) |
| `traces` | `lib/content-service.ts` | `{problemId,approachId,inputId}` (unique), `{problemSlug,approachId}` (`scripts/ingest.ts:44-45`) |
| `topics`, `patterns`, `difficulties`, `sheets` | `lib/content-service.ts` | `slug` (unique) per collection (`scripts/ingest.ts:30`) |
| `users` | `lib/user-service.ts`, `lib/admin-user-service.ts` | `email` (unique), `username` (unique), `createdAt`, `role`, `status` (`lib/user-service.ts:58-63`, mirrored in `scripts/backfill-users.ts:46-48`) |
| `userProblemProgress` | `lib/progress-service.ts` | `{userId,problemId}` (unique), `{userId,status}`, `{userId,bookmarked}` (`lib/progress-service.ts:106-108`) |
| `userDailyActivity` | `lib/progress-service.ts` | `{userId,date}` (unique) |
| `userStreak` | `lib/progress-service.ts` | `{userId}` (unique) |

Connection today: `lib/mongodb.ts` opens one `MongoClient`, cached on `globalThis` so it survives HMR in dev and warm lambda re-invocations in prod (`lib/mongodb.ts:22-28`). The four CLI scripts (`scripts/ingest.ts`, `scripts/drop-db.ts`, `scripts/make-admin.ts`, `scripts/backfill-users.ts`) each open their **own** `MongoClient` directly — they don't share `lib/mongodb.ts`, since they're one-shot processes, not the long-lived app.

---

## Target structure

`app/models/<collection>.model.ts` — one file per collection, each defining a Mongoose `Schema` + `model()`, styled like your reference `Staff` file: `trim`, `required`, `enum`, `default`, `timestamps: true` where the collection already tracks `createdAt`/`updatedAt`, `Schema.Types.ObjectId` + `ref` for every relationship, and the same indexes as the table above moved onto the schema via `.index()` instead of a one-off script call.

Ten model files, matching the ten collections: `Difficulty`, `Topic`, `Pattern`, `Problem`, `Trace`, `Sheet`, `User`, `UserProblemProgress`, `UserDailyActivity`, `UserStreak`.

Two things the reference file's pattern doesn't have to solve, that Knacktor's does:

1. **The Raw vs. resolved split for `Problem`.** Today `content-service.ts` stores `difficultyId`/`topicIds`/`patternIds` and returns `difficulty`/`topics`/`patterns` (resolved slugs) to callers. With `ref`s in place, `Problem.find().populate("difficultyId topicIds patternIds")` gets you the related documents directly — but callers still want *slugs*, not full sub-documents. Decide during implementation whether to (a) keep a thin mapping function that turns a populated doc into the client shape (same idea as today's `resolveProblem`, just fed by `.populate()` instead of three manual lookups), or (b) add a schema virtual that computes the resolved shape. Either way, `lib/types.ts`'s client-facing `Problem` interface likely survives this migration unchanged — it's the *storage/query* layer that changes, not necessarily the shape handed to pages.
2. **The `traces` collection's polymorphic payload.** `stepsCompressed` is sometimes a `Buffer`, sometimes `{ buffer: Buffer }`, and exactly one of `steps`/`stepsCompressed`/`gridfsId` should be present. Mongoose's `Schema.Types.Mixed` (or `Buffer` type support) can hold the value, but the "exactly one of three fields" invariant needs a schema-level custom validator (`pre("validate")` hook), not something the field types alone express.

## Connection layer change

`lib/mongodb.ts`'s raw `MongoClient` cache needs a Mongoose equivalent: a `lib/mongoose.ts` (or similar) that calls `mongoose.connect(uri, options)` once and caches the connection on `globalThis`, same HMR/warm-lambda reasoning as today, just through Mongoose's connection object instead of a bare `MongoClient`. This is a well-known Next.js pattern (a `dbConnect()` cached via `global.mongoose`), not something novel to invent here.

During the transition, both the raw `MongoClient` (still used by whatever hasn't been migrated yet) and the new Mongoose connection will be open side by side — that's fine functionally (separate connection pools to the same Atlas cluster), just worth knowing so it isn't mistaken for a bug mid-migration.

---

## Phased plan

### Phase 1 — Define the models (additive, no behavior change)
Write the 10 schema/model files in `app/models/`, plus `lib/mongoose.ts`'s cached connection helper. Nothing calls them yet — this phase is purely "does the schema compile and match reality," checked by writing one throwaway script that connects, does a `Model.findOne()` against your real dev data, and confirms the shape matches what's actually stored (especially for `topics`/`patterns`/`sheets`, where the earlier audit found the raw driver's declared type doesn't reliably match what's written — this phase is where that gets settled for good, since Mongoose will coerce/validate on the way in and out).

### Phase 2 — Migrate one low-risk service first: `progress-service.ts`
Smallest surface, no relationship-resolution complexity, and it's called from Server Actions you're already planning to touch in the API migration — doing this one first means the two migrations can share a test pass instead of duplicating effort. Rewrite its Mongo calls to go through `UserProblemProgress`/`UserDailyActivity`/`UserStreak` models; drop its own `ensureIndexes()`/`createIndex()` calls once the schema-level `.index()` declarations cover the same ground.

### Phase 3 — `user-service.ts` + `admin-user-service.ts`
Same idea for the `User` model. This is the pair most worth writing tests for first (per the "no test suite exists" risk noted in the API migration plan) — auth and role/status changes are the highest-blast-radius code in the app.

### Phase 4 — `content-service.ts` (the biggest one)
Rewrite `problems`/`traces`/`topics`/`patterns`/`difficulties`/`sheets` access through their models. This is where the `.populate()` decision from "Target structure" above gets implemented. Do this last among the `lib/` files — it's the largest, most-read-from file, and benefits from the patterns already proven in Phases 2–3.

### Phase 5 — The four CLI scripts
`scripts/ingest.ts`, `scripts/drop-db.ts`, `scripts/make-admin.ts`, `scripts/backfill-users.ts` each open their own raw `MongoClient` today. Decide per-script whether to switch to the new models (consistent, but Mongoose's per-document overhead matters less for one-shot scripts and more for whether `ingest.ts`'s bulk writes still perform well) or deliberately leave them on the raw driver as an intentional exception (common in real projects: bulk/migration tooling stays close to the driver, app code goes through the ODM). Either choice should be written down once made, so it doesn't look like an oversight later.

### Phase 6 — Remove the raw driver from `lib/`
Once Phases 2–4 are done and verified, `lib/mongodb.ts` either goes away entirely (if Phase 5 also migrated the scripts) or stays as a small, clearly-labeled "CLI scripts only" module.

---

## Sequencing against the API migration plan

Recommend finishing at least **Phase 1** here (the models exist and are confirmed accurate against real data) before writing new `/api` routes in `API_MIGRATION_PLAN.md` — new routes should validate against the real, final model shapes, not a second guess at them. Phases 2–4 here and the phases in the API plan can then interleave service-by-service (e.g., migrate `progress-service.ts` to Mongoose in the same pass as building the `/api/progress/*` routes that call it), rather than finishing one migration fully before starting the other.

## Risks

- **No test suite** — same standing risk as the API migration. Rewriting every query in `lib/` with no regression coverage is the higher-stakes half of that risk; write at least a handful of "does this return the same shape as before" tests per service before cutting it over, not after.
- **`content-service.ts` is large and heavily read from** — it's the last lib file to migrate for a reason; by Phase 4 the connection helper and populate/mapping pattern should already be proven on smaller files.
- **Mongoose's schema validation can reject data the raw driver happily wrote for years.** Existing documents (especially older `users` rows missing `role`/`status`, called out explicitly in `lib/user-service.ts`'s own comments) need to actually satisfy the new schema's `required`/`enum` rules, or reads will throw where they used to silently return `undefined`. Run the throwaway script from Phase 1 against real dev data specifically to catch this before it's a production surprise.
