import type { Step, BarContainerVisualState, CellState } from "@/lib/trace";
import type { TraceResult } from "./index";

export interface ContainerInput {
  height: number[];
}

function makeVisual(
  height: number[],
  lp: number,
  rp: number,
  lpState: CellState,
  rpState: CellState,
  visitedIdx?: number,
  showPointers = true,
): BarContainerVisualState {
  const n = height.length;
  const cellStates: Record<string, CellState> = {};

  for (let i = 0; i < n; i++) {
    if (i === lp) {
      cellStates[String(i)] = lpState;
    } else if (i === rp) {
      cellStates[String(i)] = rpState;
    } else if (i === visitedIdx) {
      cellStates[String(i)] = "visited";
    } else if (i < lp || i > rp) {
      cellStates[String(i)] = "dimmed";
    } else {
      cellStates[String(i)] = "idle";
    }
  }

  const w = rp > lp ? rp - lp : 0;
  const wh = w > 0 ? Math.min(height[lp], height[rp]) : 0;

  return {
    type: "bar-container",
    values: height,
    cellStates,
    pointers: showPointers
      ? [{ name: "lp", at: lp }, { name: "rp", at: rp }]
      : [],
    container: { left: lp, right: rp, width: w, waterHeight: wh, area: w * wh },
  };
}

function makeAllDimmed(height: number[]): BarContainerVisualState {
  const cellStates: Record<string, CellState> = {};
  for (let i = 0; i < height.length; i++) {
    cellStates[String(i)] = "dimmed";
  }
  return {
    type: "bar-container",
    values: height,
    cellStates,
    pointers: [],
    container: { left: 0, right: height.length - 1, width: 0, waterHeight: 0, area: 0 },
  };
}

export function buildTrace(input: unknown): TraceResult {
  const { height } = input as ContainerInput;
  const n = height.length;
  const steps: Step[] = [];

  let lp = 0;
  let rp = n - 1;
  let mx = 0;
  let comparisons = 0;
  let moves = 0;
  let timeOps = 0;
  let bestLeft = 0;
  let bestRight = n - 1;

  function push(s: Omit<Step, "i">) {
    steps.push({ i: steps.length, ...s });
  }

  function counters() {
    return { comparisons, moves, timeOps, spaceUnits: 1 };
  }

  // ── Init: line 3 — lp = 0 ─────────────────────────────────────────────────
  push({
    codeKey: 3,
    phase: "init",
    op: "lp = 0",
    isKeyEvent: false,
    narration: {
      happening: "Set the left pointer at index 0.",
      why: "We start from the leftmost line.",
      invariant: "lp marks the left boundary of the current candidate container.",
    },
    vars: { lp },
    changedVars: ["lp"],
    counters: counters(),
    visual: makeVisual(height, lp, rp, "left", "right"),
  });

  // ── Init: line 4 — rp = len(height) - 1 ──────────────────────────────────
  push({
    codeKey: 4,
    phase: "init",
    op: `rp = ${n - 1}`,
    isKeyEvent: false,
    narration: {
      happening: `Set the right pointer at index ${n - 1}.`,
      why: "We start from the rightmost line to maximise width first.",
      invariant: "rp marks the right boundary of the current candidate container.",
    },
    vars: { lp, rp },
    changedVars: ["rp"],
    counters: counters(),
    visual: makeVisual(height, lp, rp, "left", "right"),
  });

  // ── Init: line 5 — mx = 0 ─────────────────────────────────────────────────
  push({
    codeKey: 5,
    phase: "init",
    op: "mx = 0",
    isKeyEvent: false,
    narration: {
      happening: "Initialise the maximum area to 0.",
      why: "We haven't measured any container yet.",
      invariant: "mx stores the best area found so far.",
    },
    vars: { lp, rp, mx },
    changedVars: ["mx"],
    counters: counters(),
    visual: makeVisual(height, lp, rp, "left", "right"),
  });

  // ── Main loop ─────────────────────────────────────────────────────────────
  while (true) {
    // Line 7 — while lp < rp (condition check)
    const loopCond = lp < rp;
    push({
      codeKey: 7,
      phase: loopCond ? "loop" : "done",
      op: `while ${lp} < ${rp} → ${loopCond}`,
      isKeyEvent: false,
      narration: {
        happening: loopCond
          ? `lp (${lp}) < rp (${rp}) — condition is true, enter loop body.`
          : `lp (${lp}) is no longer less than rp (${rp}) — condition is false, exit loop.`,
        why: loopCond
          ? "There are still unchecked pairs between the two pointers."
          : "All useful pairs have been checked. Every pair outside the current window produces a narrower (or equal) width.",
        invariant: `mx = ${mx} is the best area found so far.`,
      },
      vars: { lp, rp, mx },
      changedVars: [],
      counters: counters(),
      visual: loopCond
        ? makeVisual(height, lp, rp, "left", "right")
        : makeAllDimmed(height),
    });

    if (!loopCond) break;

    // Line 8 — width = rp - lp
    const width = rp - lp;
    push({
      codeKey: 8,
      phase: "check",
      op: `width = ${rp} - ${lp} = ${width}`,
      isKeyEvent: false,
      narration: {
        happening: `Compute the distance between the pointers: ${rp} − ${lp} = ${width}.`,
        why: "Width is the horizontal gap — it determines how wide the water can be.",
        invariant: `Both walls are still at indices ${lp} and ${rp}.`,
      },
      vars: { lp, rp, mx, width },
      changedVars: ["width"],
      counters: counters(),
      visual: makeVisual(height, lp, rp, "current", "current"),
    });

    // Line 9 — h = min(height[lp], height[rp])
    const h = Math.min(height[lp], height[rp]);
    push({
      codeKey: 9,
      phase: "check",
      op: `h = min(${height[lp]}, ${height[rp]}) = ${h}`,
      isKeyEvent: false,
      narration: {
        happening: `The effective height is min(${height[lp]}, ${height[rp]}) = ${h}.`,
        why: "Water spills over the shorter wall — the container can only hold water up to the shorter side.",
        invariant: `Width remains ${width}.`,
      },
      vars: { lp, rp, mx, width, h },
      changedVars: ["h"],
      counters: counters(),
      visual: makeVisual(height, lp, rp, "current", "current"),
    });

    // Line 10 — area = width * h
    const area = width * h;
    comparisons++;
    timeOps++;
    push({
      codeKey: 10,
      phase: "check",
      op: `area = ${width} × ${h} = ${area}`,
      isKeyEvent: false,
      narration: {
        happening: `Area = width × height = ${width} × ${h} = ${area}.`,
        why: "This is the volume of water the current pair of walls can trap.",
        invariant: `Best area so far: ${mx}.`,
      },
      vars: { lp, rp, mx, width, h, area },
      changedVars: ["area"],
      counters: counters(),
      visual: makeVisual(height, lp, rp, "current", "current"),
    });

    // Line 11 — mx = max(mx, area)
    const prevMx = mx;
    mx = Math.max(mx, area);
    const isNewMax = area > prevMx;
    if (isNewMax) {
      bestLeft = lp;
      bestRight = rp;
    }
    push({
      codeKey: 11,
      phase: "check",
      op: isNewMax
        ? `mx = max(${prevMx}, ${area}) = ${mx}  ← new best!`
        : `mx = max(${prevMx}, ${area}) = ${mx}  (unchanged)`,
      isKeyEvent: isNewMax,
      narration: {
        happening: isNewMax
          ? `New best! ${area} beats the previous maximum of ${prevMx}.`
          : `${area} does not beat the current maximum of ${mx} — mx stays at ${mx}.`,
        why: isNewMax
          ? "This pair forms a larger container than any previously seen."
          : "A previously seen pair was already better or equal.",
        invariant: `mx = ${mx} is the best area found so far.`,
      },
      vars: { lp, rp, mx, width, h, area },
      changedVars: isNewMax ? ["mx"] : [],
      counters: counters(),
      visual: makeVisual(
        height, lp, rp,
        isNewMax ? "result" : "current",
        isNewMax ? "result" : "current",
      ),
    });

    // Line 13 — if height[lp] < height[rp]
    const condTrue = height[lp] < height[rp];
    comparisons++;
    timeOps++;
    push({
      codeKey: 13,
      phase: "check",
      op: `if height[lp] < height[rp]  →  ${height[lp]} < ${height[rp]}  →  ${condTrue}`,
      isKeyEvent: false,
      narration: {
        happening: condTrue
          ? `height[lp] (${height[lp]}) < height[rp] (${height[rp]}) — condition is TRUE.`
          : `height[lp] (${height[lp]}) is NOT less than height[rp] (${height[rp]}) — condition is FALSE.`,
        why: condTrue
          ? "The left wall is the bottleneck. Moving right would only shrink the width — only moving left can possibly find a taller left wall."
          : "The right wall is the bottleneck (or they're equal). Moving left pointer would only shrink width — move the right pointer instead.",
        invariant: `mx = ${mx}.`,
      },
      vars: { lp, rp, mx },
      changedVars: [],
      counters: counters(),
      visual: makeVisual(height, lp, rp, "compared", "compared"),
    });

    if (condTrue) {
      // Line 14 — lp += 1
      const oldLp = lp;
      lp++;
      moves++;
      timeOps++;
      push({
        codeKey: 14,
        phase: "move",
        op: `lp += 1  (${oldLp} → ${lp})`,
        isKeyEvent: false,
        narration: {
          happening: `Move the left pointer from index ${oldLp} to index ${lp}.`,
          why: "The left wall is shorter — keeping it can't produce a larger area. Advance it hoping for a taller wall.",
          invariant: `The right pointer stays at ${rp}.`,
        },
        vars: { lp, rp, mx },
        changedVars: ["lp"],
        counters: counters(),
        visual: makeVisual(height, lp, rp, "left", "right", oldLp),
      });
    } else {
      // Line 15 — else:
      push({
        codeKey: 15,
        phase: "move",
        op: "else:",
        isKeyEvent: false,
        narration: {
          happening: "Entering the else branch.",
          why: `height[lp] (${height[lp]}) ≥ height[rp] (${height[rp]}) — the right wall is the bottleneck (or they're equal).`,
          invariant: "No pointer has moved yet.",
        },
        vars: { lp, rp, mx },
        changedVars: [],
        counters: counters(),
        visual: makeVisual(height, lp, rp, "compared", "compared"),
      });

      // Line 16 — rp -= 1
      const oldRp = rp;
      rp--;
      moves++;
      timeOps++;
      push({
        codeKey: 16,
        phase: "move",
        op: `rp -= 1  (${oldRp} → ${rp})`,
        isKeyEvent: false,
        narration: {
          happening: `Move the right pointer from index ${oldRp} to index ${rp}.`,
          why: height[lp] === height[oldRp]
            ? "Heights are equal — moving either pointer is valid. This implementation moves the right pointer."
            : "The right wall is shorter — advance it hoping for a taller wall.",
          invariant: `The left pointer stays at ${lp}.`,
        },
        vars: { lp, rp, mx },
        changedVars: ["rp"],
        counters: counters(),
        visual: makeVisual(height, lp, rp, "left", "right", oldRp),
      });
    }
  }

  // Line 18 — return mx
  const returnCellStates: Record<string, CellState> = {};
  for (let i = 0; i < n; i++) {
    returnCellStates[String(i)] = i === bestLeft || i === bestRight ? "result" : "dimmed";
  }

  push({
    codeKey: 18,
    phase: "return",
    op: `return ${mx}`,
    isKeyEvent: true,
    narration: {
      happening: `Return ${mx} — the maximum water area.`,
      why: "All pairs have been evaluated. The two-pointer approach guarantees we never miss the optimal pair.",
      invariant: `The best container uses indices ${bestLeft} and ${bestRight} with area ${mx}.`,
    },
    vars: { lp, rp, mx },
    changedVars: [],
    counters: counters(),
    visual: {
      type: "bar-container",
      values: height,
      cellStates: returnCellStates,
      pointers: [],
      container: {
        left: bestLeft,
        right: bestRight,
        width: bestRight - bestLeft,
        waterHeight: Math.min(height[bestLeft], height[bestRight]),
        area: mx,
      },
    },
  });

  return { steps, finalResult: mx };
}
