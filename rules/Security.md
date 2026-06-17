# Security — Knacktor

> **Status:** v1.0 — control-level guidance (concrete controls, limits, and boundaries; not a vendor-specific runbook).
> **Primary risk:** **execution & abuse safety** around live custom-input trace generation — which is **in scope for M1** (D4). Not traditional account handling. Companions: [TechSpec.md](TechSpec.md) §7, [AppFlow.md](AppFlow.md) §9.

## 1. Priorities
1. Highly sandboxed custom-input execution.
2. Strict input validation/normalization.
3. Resource-abuse prevention (rate limits, caps).
4. Content integrity.
5. Privacy-conscious, minimal data collection.
6. Future-ready (but unbuilt) auth boundaries.

## 2. Custom-input & trace execution (M1, sandboxed)
- Custom input is enabled **only** for problems where `supportsCustomInput` is true.
- Trace generation for custom input runs in an **isolated execution environment**, separate from the web tier.
- **Hard limits per request:** wall-clock time, memory, recursion depth, output size, and total step count. Exceeding any limit aborts cleanly with a clear, safe error.
- User-controlled code/execution has **no filesystem and no network** access beyond what the isolated runner strictly requires.
- **Precomputed preset traces never invoke execution** — preset and Compare playback read stored traces, removing the exec path from the common case.
- **Recommended execution model (control-level):** an isolated container/microVM worker, or a hardened subprocess with `seccomp` + `rlimits` + a restricted interpreter, invoked from a Next.js route handler / server action. Any alternative (managed execution service, future in-browser Pyodide) is acceptable only if it meets every control above.

## 3. Validation rules
- Every custom input is **validated against the problem's constraints** (type, size, value ranges) **before** reaching execution.
- Inputs are **normalized** into the problem-specific structured shape.
- Invalid or oversized input is rejected at the boundary and never reaches the runner.

## 4. Abuse controls
- **Rate limiting** on custom-input endpoints / server actions (per IP / session).
- Explicit request-size and execution-size caps.
- Expensive or unsupported problem shapes are rejected early.
- Backpressure / queueing so a burst of custom-input requests cannot exhaust workers.

## 5. Content integrity
- Canonical content stays versioned and reviewable (authored as files, ingested into MongoDB).
- Preset traces are generated through trusted tooling (the tracer + ingest), not opaque manual edits as the normal path.
- The ingest/validation pipeline detects mismatches between code references (`codeKey`), trace steps, and renderer expectations, and fails loudly.

## 6. Privacy posture
- **Minimal data collection** in MVP; no broad telemetry by default.
- Avoid user-identifying persistence without a clear product requirement.

## 7. SEO & surface safety
- Public content surfaces are server-rendered through trusted content pipelines.
- Dynamic rendering must not expose unsafe execution paths.
- Statement/metadata rendering treats stored content as data, not executable markup.

## 8. Future auth boundary (reserved, not built)
- Auth is out of MVP, but architecture leaves clean boundaries for future identity, subscriptions, progress, and editorial/admin access.
- When introduced, auth is a separate security workstream — **not** retrofitted into execution-sensitive code paths.
