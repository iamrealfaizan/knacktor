/**
 * Browserless render harness (Phase 4). Renders a step's VisualState to a self-contained
 * SVG string via react-dom/server — no browser, no rasterizer. The renderers in
 * components/problem/*-renderer.tsx are pure (props → SVG), so the same components the live
 * app uses produce the snapshot — meaning the preview a human approves is exactly what ships.
 *
 * Design tokens are read from app/globals.css :root (single source of truth) and inlined into
 * the SVG <style> so it's standalone. Light theme only; fonts fall back to system mono.
 */
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// The app's renderers (components/problem/*) rely on Next's automatic JSX runtime, so they
// don't import React. Under tsx the JSX compiles to classic `React.createElement`, so expose
// React globally before any render call. (No effect inside Next, which never imports this.)
(globalThis as { React?: typeof React }).React = React;
import fs from "fs";
import path from "path";
import type { VisualState, LeafVisualState, CombinedVisualState } from "@/lib/trace";
import { getLeafViewBox, computeCombinedLayout, LeafRenderer } from "@/components/problem/stage";

// The 4 anim classes/keyframes the renderers reference (e.g. array `result` cells pulse).
const KEYFRAMES = `
@keyframes kn-cell-pulse{0%{box-shadow:0 0 0 0 var(--kn-result)}70%{box-shadow:0 0 0 9px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes kn-pop-in{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
.kn-anim-cell-pulse{animation:kn-cell-pulse 1.1s ease-out}
.kn-anim-pop-in{animation:kn-pop-in .3s cubic-bezier(.16,1,.3,1)}`;

let cssCache: string | null = null;
/** Extract the :root { … } custom-property block from globals.css (light theme). */
function rootTokens(): string {
  if (cssCache !== null) return cssCache;
  let decls = "";
  try {
    const css = fs.readFileSync(path.join(process.cwd(), "app", "globals.css"), "utf-8");
    const m = css.match(/:root\s*\{([\s\S]*?)\}/); // first :root block = light theme
    decls = m ? m[1] : "";
  } catch {
    decls = "";
  }
  // Override font vars (globals.css points them at next/font vars that don't exist here).
  cssCache = `${decls}\n--font-mono:'JetBrains Mono',ui-monospace,monospace;--font-sans:Inter,system-ui,sans-serif;`;
  return cssCache;
}

interface ViewBox { x: number; y: number; w: number; h: number }

function svgWrap(vb: ViewBox, inner: string): string {
  const style = `:root{${rootTokens()}}${KEYFRAMES}`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" ` +
    `width="${Math.round(vb.w)}" height="${Math.round(vb.h)}" ` +
    `font-family="'JetBrains Mono',ui-monospace,monospace">` +
    `<style>${style}</style>` +
    `<rect x="${vb.x}" y="${vb.y}" width="${vb.w}" height="${vb.h}" fill="var(--kn-stage)"/>` +
    `<g>${inner}</g></svg>`
  );
}

function leafMarkup(visual: LeafVisualState): string {
  return renderToStaticMarkup(
    React.createElement(LeafRenderer, { visual, vars: {}, target: 0 })
  );
}

/** Render any VisualState (leaf or combined) to a standalone SVG string. */
export function renderStageSvg(visual: VisualState): string {
  if (visual.type === "combined") {
    const c = visual as CombinedVisualState;
    const layout = computeCombinedLayout(c.primary, c.aux);
    const parts: string[] = [
      `<g transform="translate(${layout.primaryTx} ${layout.primaryTy})">${leafMarkup(c.primary)}</g>`,
    ];
    c.aux.forEach((a, i) => {
      const off = layout.auxOffsets[i];
      // No drawn divider — a left-aligned label sits in the whitespace above.
      parts.push(
        `<text x="${off.labelX}" y="${off.labelY}" fill="var(--kn-ink-2)" font-size="10" font-weight="700" text-anchor="start">${a.label.toUpperCase()}</text>`,
        `<g transform="translate(${off.tx} ${off.ty})">${leafMarkup(a.visual)}</g>`
      );
    });
    return svgWrap(layout.viewBox, parts.join(""));
  }

  const leaf = visual as LeafVisualState;
  if (leaf.type === "custom") {
    const key = (leaf as { componentKey?: string }).componentKey ?? "unknown";
    return svgWrap(
      { x: -260, y: -60, w: 520, h: 120 },
      `<text x="0" y="0" text-anchor="middle" dominant-baseline="middle" font-size="13" fill="var(--kn-ink-2)">custom renderer "${key}" — preview in the live app</text>`
    );
  }
  return svgWrap(getLeafViewBox(leaf), leafMarkup(leaf));
}
