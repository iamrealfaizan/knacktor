import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      // shadcn design system — var() directly so oklch values pass through
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        // Knacktor warm-paper semantic tokens — ALWAYS use these, never inline hexes
        kn: {
          bg: "var(--kn-bg)",
          "surface-0": "var(--kn-surface-0)",
          "surface-1": "var(--kn-surface-1)",
          "surface-2": "var(--kn-surface-2)",
          "ink-0": "var(--kn-ink-0)",
          "ink-1": "var(--kn-ink-1)",
          "ink-2": "var(--kn-ink-2)",
          "border-0": "var(--kn-border-0)",
          "border-1": "var(--kn-border-1)",
          current: "var(--kn-current)",
          compared: "var(--kn-compared)",
          result: "var(--kn-result)",
          special: "var(--kn-special)",
          amber: "var(--kn-amber)",
          error: "var(--kn-error)",
          "result-subtle": "var(--kn-result-subtle)",
          "result-border": "var(--kn-result-border)",
          "amber-subtle": "var(--kn-amber-subtle)",
          "amber-border": "var(--kn-amber-border)",
          "error-subtle": "var(--kn-error-subtle)",
          "error-border": "var(--kn-error-border)",
          "current-subtle": "var(--kn-current-subtle)",
          "current-border": "var(--kn-current-border)",
          "special-subtle": "var(--kn-special-subtle)",
          "special-border": "var(--kn-special-border)",
          // problem-page / stage
          stage: "var(--kn-stage)",
          inset: "var(--kn-inset)",
          dot: "var(--kn-dot)",
          track: "var(--kn-track)",
          "accent-soft": "var(--kn-accent-soft)",
          "blue-soft": "var(--kn-blue-soft)",
          "amber-bd": "var(--kn-amber-bd)",
          gold: "var(--kn-gold)",
          "med-bg": "var(--kn-med-bg)",
          "med-ink": "var(--kn-med-ink)",
          // pointer identity (Layer 2)
          "ptr-i": "var(--kn-ptr-i)",
          "ptr-j": "var(--kn-ptr-j)",
          "ptr-lo": "var(--kn-ptr-lo)",
          "ptr-hi": "var(--kn-ptr-hi)",
          // python syntax
          "syn-kw": "var(--kn-syn-kw)",
          "syn-fn": "var(--kn-syn-fn)",
          "syn-num": "var(--kn-syn-num)",
          "syn-str": "var(--kn-syn-str)",
          "syn-var": "var(--kn-syn-var)",
          "syn-pun": "var(--kn-syn-pun)",
          "syn-op": "var(--kn-syn-op)",
          "syn-com": "var(--kn-syn-com)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-jetbrains-mono)", ...fontFamily.mono],
      },
    },
  },
  plugins: [],
};

export default config;
