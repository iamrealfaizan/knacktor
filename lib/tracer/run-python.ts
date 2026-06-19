/**
 * Spawns tracer/run.py and parses its raw-skeleton JSON. Build-time only.
 */
import { spawnSync } from "child_process";
import path from "path";
import type { RawSkeleton } from "./types";

// Windows: prefer `python` (the `py` alias is the MS-Store stub). Fall back to python3.
const PY_CANDIDATES = process.platform === "win32" ? ["python", "python3"] : ["python3", "python"];

let resolvedPython: string | null = null;
function pythonCmd(): string {
  if (resolvedPython) return resolvedPython;
  for (const cmd of PY_CANDIDATES) {
    const r = spawnSync(cmd, ["--version"], { encoding: "utf-8" });
    if (r.status === 0) { resolvedPython = cmd; return cmd; }
  }
  throw new Error("Python not found — install Python 3 and ensure `python` is on PATH");
}

const RUNNER = path.join(process.cwd(), "tracer", "run.py");

export function runPython(bundleDir: string, approachId: string, presetId: string): RawSkeleton {
  const r = spawnSync(pythonCmd(), [RUNNER, bundleDir, approachId, presetId], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) throw new Error(`failed to spawn python: ${r.error.message}`);
  const out = (r.stdout || "").trim();
  if (!out) {
    throw new Error(`tracer produced no output for ${approachId}:${presetId}\n${r.stderr}`);
  }
  let parsed: RawSkeleton;
  try {
    parsed = JSON.parse(out);
  } catch {
    throw new Error(`tracer output was not JSON for ${approachId}:${presetId}:\n${out}\n${r.stderr}`);
  }
  if (parsed.error) throw new Error(`tracer error for ${approachId}:${presetId}: ${parsed.error}`);
  if (r.status !== 0) throw new Error(`tracer exited ${r.status} for ${approachId}:${presetId}: ${r.stderr}`);
  return parsed;
}
