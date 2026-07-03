"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const KEY = "kn_theme";

interface ThemeContextValue {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * App-wide theme state, mounted once in app/layout.tsx.
 * The `.dark` class is applied pre-hydration by the inline ThemeScript below,
 * so this provider only mirrors that state into React and persists toggles.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Mirror whatever ThemeScript already applied before paint.
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem(KEY, next ? "dark" : "light");
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Same API as before the context refactor — all existing callers keep working. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within <ThemeProvider>");
  return ctx;
}

/**
 * Inline pre-hydration script: sets `.dark` from localStorage before first
 * paint so dark-mode users never see a light flash (FOUC). Rendered in the
 * <head> via app/layout.tsx.
 */
export function ThemeScript() {
  const code = `try{if(localStorage.getItem(${JSON.stringify(
    KEY
  )})==="dark")document.documentElement.classList.add("dark")}catch(e){}`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
