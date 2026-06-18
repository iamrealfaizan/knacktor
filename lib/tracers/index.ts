/**
 * Tracer registry — maps slug → approachId → buildTrace function.
 *
 * Used by:
 *   • scripts/ingest.ts  — compute preset traces for MongoDB storage
 *   • problem-engine.tsx — run custom input traces in the browser
 *
 * Add a new entry here whenever a new problem + tracer is authored.
 */
import type { Step } from "@/lib/trace";
import { buildTrace as build4Sum, buildBruteForceTrace as build4SumBrute, type FourSumInput } from "./4sum";
import { buildTrace as buildContainer, type ContainerInput } from "./container-with-most-water";

export interface TraceResult {
  steps: Step[];
  finalResult: unknown;
}

export type TraceBuilder = (input: unknown) => TraceResult;

/** slug → approachId → builder */
export const TRACERS: Record<string, Record<string, TraceBuilder>> = {
  "4sum": {
    "sort-two-pointers": (input) => build4Sum(input as FourSumInput),
    "brute-force": (input) => build4SumBrute(input as FourSumInput),
  },
  "container-with-most-water": {
    "two-pointers": (input) => buildContainer(input as ContainerInput),
  },
};
