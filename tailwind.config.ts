import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
