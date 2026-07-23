/**
 * Semantic "tones" — a small palette of accent roles that map to the kn-* design
 * tokens. Components reference a tone (never inline hex), so a card/tile/pill can
 * be tinted consistently in both light and dark themes.
 *
 * Shared across the landing page (components/landing/data.ts re-exports these)
 * and the concept pages (Topics/Patterns/Sheets via lib/concept-visuals.ts).
 */
export type Tone = "current" | "compared" | "result" | "amber" | "special";

export const TONES: Record<Tone, { text: string; tint: string; border: string }> = {
  current: { text: "text-kn-current", tint: "bg-kn-current-subtle", border: "border-kn-current-border" },
  compared: { text: "text-kn-compared", tint: "bg-kn-blue-soft", border: "border-kn-border-1" },
  result: { text: "text-kn-result", tint: "bg-kn-result-subtle", border: "border-kn-result-border" },
  amber: { text: "text-kn-amber", tint: "bg-kn-amber-subtle", border: "border-kn-amber-border" },
  special: { text: "text-kn-special", tint: "bg-kn-special-subtle", border: "border-kn-special-border" },
};
