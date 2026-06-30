/**
 * Animation preview review sheet (Phase 4, Gate 3). Renders the REAL per-step frames of an
 * approach's simulation into a self-contained HTML filmstrip — each pivotal frame beside its
 * code line + narration — topped with the liveness report and the FidelityReview checklist.
 *
 *   npm run review-sheet -- <bundleDir> [approachId]
 *
 * Because the frames come from the same VisualStates ingest stores, the preview a human
 * approves here IS what ships. Output: <bundleDir>/review.html (publish as an Artifact).
 *
 * The HTML is a self-contained fragment (inline <style> + inline SVG, no external assets) so
 * it both opens locally AND can be published verbatim via the Artifact tool.
 */
import fs from "fs";
import path from "path";
import { dryRunApproach, type ApproachDryRunResult } from "../lib/validators/dry-run";
import { livenessAdvisories, type LivenessReport } from "../lib/validators/liveness";
import { renderStageSvg } from "../lib/render/render-stage-svg";
import type { BuiltTrace } from "../lib/tracer/pipeline";

const MAX_FRAMES = 12;

interface Preset { id: string; label?: string; isEdgeCase?: boolean; expectedOutput: unknown }

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T;
}

/** Pivotal frame indices: first, last, every key event, and an even fill — capped. */
function pickFrames(built: BuiltTrace): number[] {
  const last = built.steps.length - 1;
  const set = new Set<number>([0, last]);
  built.keyEventIndices.forEach((i) => set.add(i));
  for (let k = 1; k < MAX_FRAMES; k++) set.add(Math.round((k * last) / MAX_FRAMES));
  const arr = [...set].filter((i) => i >= 0 && i <= last).sort((a, b) => a - b);
  if (arr.length <= MAX_FRAMES) return arr;
  // keep first/last + key events, sample the rest down to MAX_FRAMES
  const keep = new Set<number>([0, last, ...built.keyEventIndices]);
  const rest = arr.filter((i) => !keep.has(i));
  const want = Math.max(0, MAX_FRAMES - keep.size);
  const sampled = rest.filter((_, j) => j % Math.ceil(rest.length / Math.max(1, want)) === 0);
  return [...new Set([...keep, ...sampled])].sort((a, b) => a - b).slice(0, MAX_FRAMES);
}

const FIDELITY_CHECKLIST = [
  "Right primitive — its cells represent the algorithm's unit of work",
  "Operations are visible — each step's compare/move/write/decision is shown, not just narrated",
  "Pointers are real cursors — sit where the code's index points, move when the code moves them",
  "Cell-states are honest — current/compared/result/visited mark the right elements at the right moments",
  "Readout & result reflect true running state (not stale/cosmetic)",
  "Narration matches the moment (incl. before-the-line-runs timing)",
  "Motion explains — glides/flashes correspond to real value/pointer movement",
  "Key events are meaningful milestones (match / new-best / boundary / return)",
  "Both approaches faithful (when present)",
  "An edge case still reads correctly (no confusing/empty stage)",
];

function frameCard(
  built: BuiltTrace,
  i: number,
  source: string[],
  lineExplanations: Record<string, string>
): string {
  const step = built.steps[i];
  const svg = renderStageSvg(step.visual);
  const line = source[step.codeKey - 1] ?? "";
  const lineExpl = lineExplanations[String(step.codeKey)] ?? "";
  const ke = step.isKeyEvent && step.keyEvent ? `<span class="ke">◆ ${esc(step.keyEvent.label)}</span>` : "";
  const counters = Object.entries(step.counters)
    .filter(([k]) => k !== "timeOps" && k !== "spaceUnits")
    .map(([k, v]) => `${esc(k)}=${esc(v)}`)
    .join(" · ");
  return `
  <div class="frame">
    <div class="stage">${svg}</div>
    <div class="info">
      <div class="meta">step ${i} · <b>${esc(step.phase)}</b> · L${step.codeKey} ${ke}</div>
      <pre class="code"><span class="ln">${step.codeKey}</span>${esc(line.trim())}</pre>
      <div class="grid2">
        <div><span class="lbl hap">▸ HAPPENING</span><p>${esc(step.narration.happening)}</p></div>
        <div><span class="lbl why">✦ WHY</span><p>${esc(step.narration.why)}</p></div>
        <div><span class="lbl exp">‹/› LINE</span><p>${esc(lineExpl)}</p></div>
        <div><span class="lbl inv">◎ INVARIANT</span><p>${esc(step.narration.invariant)}</p></div>
      </div>
      ${counters ? `<div class="counters">${esc(counters)}</div>` : ""}
    </div>
  </div>`;
}

function livenessBadge(r: LivenessReport, advisory: string[]): string {
  const tag = advisory.length
    ? `<span class="warn">⚠ ${advisory.map(esc).join("; ")}</span>`
    : `<span class="ok">✓ lively</span>`;
  return `<div class="lv">${esc(r.presetId)}${r.isEdgeCase ? " (edge)" : ""}: ${r.steps} steps · ${r.distinctFrames} distinct frames · score ${r.livenessScore}/100 ${tag}</div>`;
}

function approachSection(
  bundleDir: string,
  approachId: string,
  presets: Preset[],
  result: ApproachDryRunResult
): string {
  const dir = path.join(bundleDir, "approaches", approachId);
  const meta = readJson<{ name?: string; summary?: string; lineExplanations?: Record<string, string> }>(
    path.join(dir, "approach.json")
  );
  const source = fs.readFileSync(path.join(dir, "solution.py"), "utf-8").split("\n");
  const lineExpl = meta.lineExplanations ?? {};
  const advisories = livenessAdvisories(result.liveness);
  const advMap = new Map(advisories.map((a) => [a.presetId, a.notes]));

  // Representative presets: first non-edge + first edge.
  const nonEdge = presets.find((p) => !p.isEdgeCase);
  const edge = presets.find((p) => p.isEdgeCase);
  const chosen = [nonEdge, edge].filter(Boolean) as Preset[];

  const lvSummary = result.liveness.map((r) => livenessBadge(r, advMap.get(r.presetId) ?? [])).join("");

  const presetBlocks = chosen
    .map((preset) => {
      const built = result.builts.find((b) => b.presetId === preset.id)?.built;
      if (!built) return "";
      const frames = pickFrames(built).map((i) => frameCard(built, i, source, lineExpl)).join("");
      return `
    <h3>${esc(preset.label ?? preset.id)}${preset.isEdgeCase ? " · edge case" : ""} <span class="sub">${built.steps.length} steps · result ${esc(JSON.stringify(built.finalResult))}</span></h3>
    <div class="frames">${frames}</div>`;
    })
    .join("");

  return `
  <section>
    <h2>${esc(meta.name ?? approachId)} <span class="sub">${esc(approachId)}</span></h2>
    ${meta.summary ? `<p class="summary">${esc(meta.summary)}</p>` : ""}
    <div class="liveness">${lvSummary}</div>
    ${presetBlocks}
  </section>`;
}

const STYLE = `
*{box-sizing:border-box}
.rs{font-family:Inter,system-ui,sans-serif;background:#F4F1EA;color:#211F1B;max-width:1100px;margin:0 auto;padding:24px;line-height:1.5}
.rs h1{font-size:24px;margin:0 0 4px} .rs .id{color:#8E887A;font-size:13px;margin-bottom:16px}
.rs h2{font-size:18px;margin:28px 0 4px;border-top:1px solid #E6E1D5;padding-top:18px}
.rs h3{font-size:14px;margin:18px 0 8px;color:#565147}
.rs .sub{color:#8E887A;font-weight:400;font-size:12px}
.rs .summary{color:#565147;margin:2px 0 10px}
.rs .liveness{display:flex;flex-direction:column;gap:4px;margin:8px 0}
.rs .lv{font-size:12.5px;font-family:'JetBrains Mono',monospace;background:#FFF;border:1px solid #E6E1D5;border-radius:6px;padding:6px 10px}
.rs .ok{color:#2F9E73;font-weight:600} .rs .warn{color:#A6371F;font-weight:600}
.rs .frames{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
.rs .frame{border:1px solid #E6E1D5;border-radius:10px;background:#FFF;overflow:hidden;display:flex;flex-direction:column}
.rs .stage{background:#F7F4ED;border-bottom:1px solid #E6E1D5}
.rs .stage svg{display:block;width:100%;height:auto;max-height:220px}
.rs .info{padding:10px 12px}
.rs .meta{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8E887A;margin-bottom:6px}
.rs .ke{color:#C28A1E;font-weight:700;margin-left:6px}
.rs pre.code{font-family:'JetBrains Mono',monospace;font-size:12px;background:#FAF8F2;border-left:3px solid #C2603F;border-radius:4px;padding:6px 10px;margin:0 0 8px;white-space:pre-wrap;overflow-x:auto}
.rs pre.code .ln{color:#C2603F;font-weight:700;margin-right:10px}
.rs .grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
.rs .lbl{font-family:'JetBrains Mono',monospace;font-size:8.5px;font-weight:700;letter-spacing:.08em;display:block;margin-bottom:1px}
.rs .hap{color:#C2603F}.rs .why{color:#2F9E73}.rs .exp{color:#2E72C4}.rs .inv{color:#8E887A}
.rs .grid2 p{margin:0 0 4px;font-size:12px;color:#3a362f}
.rs .counters{font-family:'JetBrains Mono',monospace;font-size:11px;color:#8E887A;margin-top:6px;border-top:1px dashed #E6E1D5;padding-top:4px}
.rs .check{background:#FFF;border:1px solid #E6E1D5;border-radius:10px;padding:14px 18px;margin-top:20px}
.rs .check h2{border:0;margin:0 0 8px;padding:0;font-size:15px}
.rs .check label{display:block;font-size:13px;margin:5px 0;color:#3a362f}
.rs .verdict{margin-top:12px;font-size:13px;color:#565147}`;

function main(): number {
  const [, , bundleArg, approachArg] = process.argv;
  if (!bundleArg) {
    console.error("usage: npm run review-sheet -- <bundleDir> [approachId]");
    return 2;
  }
  const bundleDir = path.resolve(bundleArg);
  const problem = readJson<{ slug?: string; number?: number; title?: string }>(path.join(bundleDir, "problem.json"));
  const presets = readJson<Preset[]>(path.join(bundleDir, "presets.json"));
  const approachIds = approachArg
    ? [approachArg]
    : fs.readdirSync(path.join(bundleDir, "approaches")).filter((d) =>
        fs.existsSync(path.join(bundleDir, "approaches", d, "mapping.json"))
      );

  const sections = approachIds
    .map((id) => approachSection(bundleDir, id, presets, dryRunApproach(bundleDir, id, presets)))
    .join("");

  const checklist = FIDELITY_CHECKLIST.map((c) => `<label><input type="checkbox"> ${esc(c)}</label>`).join("");

  const html =
    `<style>${STYLE}</style>` +
    `<div class="rs">` +
    `<h1>${esc(problem.title ?? problem.slug)}${problem.number ? ` <span class="sub">#${problem.number}</span>` : ""}</h1>` +
    `<div class="id">Animation preview — review the real rendered frames, then GREEN or request changes.</div>` +
    sections +
    `<div class="check"><h2>Fidelity checklist (Gate 2/3 — rules/FidelityReview.md)</h2>${checklist}` +
    `<div class="verdict">Verdict: <b>PASS</b> / <b>REVISE</b> (name step + field + fix) / <b>DEFER</b> (needs a renderer X).</div></div>` +
    `</div>`;

  const outPath = path.join(bundleDir, "review.html");
  fs.writeFileSync(outPath, html);
  console.log(`✓ review sheet → ${outPath}`);
  console.log(`  approaches: ${approachIds.join(", ")}`);
  return 0;
}

try {
  process.exit(main());
} catch (err) {
  console.error(`✗ review-sheet failed: ${err instanceof Error ? err.message : err}`);
  process.exit(1);
}
