"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/problem/theme-provider";

/**
 * The one theme-toggle button used by every header (global Nav, landing,
 * home dashboard, problem top-bar). Self-contained via ThemeProvider context;
 * the `mounted` guard keeps the icon hydration-safe.
 */
export function ThemeToggle({
  size = "default",
  className,
}: {
  size?: "default" | "sm";
  className?: string;
}) {
  const { dark, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={toggle}
      aria-label="Toggle theme"
      title={mounted && dark ? "Switch to light" : "Switch to dark"}
      className={cn(
        "border-kn-border-0 bg-kn-surface-0 text-kn-ink-0",
        size === "sm" ? "h-8 w-8" : "h-9 w-9",
        className
      )}
    >
      {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
