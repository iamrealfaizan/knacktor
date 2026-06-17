/**
 * Generic input validator for custom trace runs.
 * Validates raw form strings against a problem's InputConstraints.
 * Runs entirely client-side — no server round-trip.
 */
import type { InputConstraints } from "@/lib/trace";

export type ValidationErrors = Record<string, string>;

export type ValidationResult =
  | { ok: true; parsed: Record<string, unknown> }
  | { ok: false; errors: ValidationErrors };

export function validateCustomInput(
  raw: Record<string, string>,
  constraints: InputConstraints
): ValidationResult {
  const errors: ValidationErrors = {};
  const parsed: Record<string, unknown> = {};

  for (const field of constraints.fields) {
    const value = (raw[field.name] ?? "").trim();

    if (!value) {
      errors[field.name] = `${field.label} is required`;
      continue;
    }

    if (field.type === "int[]") {
      const parts = value.split(",").map((s) => s.trim()).filter(Boolean);

      if (parts.length === 0) {
        errors[field.name] = `${field.label}: enter at least one integer`;
        continue;
      }

      const nums: number[] = [];
      let fieldError = "";

      for (const part of parts) {
        const n = Number(part);
        if (!Number.isInteger(n) || part === "" || isNaN(n)) {
          fieldError = `${field.label}: "${part}" is not an integer`;
          break;
        }
        if (field.min !== undefined && n < field.min) {
          fieldError = `${field.label}: each value must be ≥ ${field.min}`;
          break;
        }
        if (field.max !== undefined && n > field.max) {
          fieldError = `${field.label}: each value must be ≤ ${field.max}`;
          break;
        }
        nums.push(n);
      }

      if (fieldError) { errors[field.name] = fieldError; continue; }

      if (field.minLen !== undefined && nums.length < field.minLen) {
        errors[field.name] = `${field.label}: needs at least ${field.minLen} elements`;
        continue;
      }
      if (field.maxLen !== undefined && nums.length > field.maxLen) {
        errors[field.name] =
          `${field.label}: max ${field.maxLen} elements — keeps the visualizer readable`;
        continue;
      }

      parsed[field.name] = nums;
    } else if (field.type === "int") {
      const n = Number(value);
      if (!Number.isInteger(n) || isNaN(n)) {
        errors[field.name] = `${field.label}: must be a whole number`;
        continue;
      }
      if (field.min !== undefined && n < field.min) {
        errors[field.name] = `${field.label}: must be ≥ ${field.min}`;
        continue;
      }
      if (field.max !== undefined && n > field.max) {
        errors[field.name] = `${field.label}: must be ≤ ${field.max}`;
        continue;
      }
      parsed[field.name] = n;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, parsed };
}
