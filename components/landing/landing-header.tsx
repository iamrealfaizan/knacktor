"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Code2, Search, Moon, Sun, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/problem/theme-provider";
import { NAV_LINKS } from "./data";

export function LandingHeader() {
  const { dark, toggle } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 flex items-center gap-5 h-16 px-5 sm:px-7 border-b border-kn-border-0 bg-kn-bg/80 backdrop-blur-xl">
      <Link href="/" className="flex items-center gap-2.5 shrink-0">
        <Code2 className="h-7 w-7 text-kn-current" strokeWidth={2.5} />
        <span className="font-semibold text-lg tracking-tight text-kn-ink-0">knacktor</span>
      </Link>

      <nav className="hidden md:flex items-center gap-1 ml-2">
        {NAV_LINKS.map(({ label, href }) => (
          <Link
            key={label}
            href={href}
            className="px-3 py-2 rounded-lg text-sm font-medium text-kn-ink-1 hover:text-kn-ink-0 hover:bg-kn-surface-2 transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Decorative search (no global search yet) */}
        <div
          aria-hidden
          className="hidden lg:flex items-center gap-2 h-9 px-3 min-w-[188px] rounded-lg border border-kn-border-0 bg-kn-surface-0"
        >
          <Search className="h-4 w-4 text-kn-ink-2" />
          <span className="text-sm text-kn-ink-2">Search problems</span>
          <span className="ml-auto font-mono text-[10px] font-semibold text-kn-ink-2 border border-kn-border-0 rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>

        <Button
          size="icon"
          variant="outline"
          onClick={toggle}
          aria-label="Toggle theme"
          className="h-9 w-9 border-kn-border-0 bg-kn-surface-0 text-kn-ink-0"
        >
          {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} className="hidden sm:inline-flex" />}>
              <Button variant="ghost" size="sm" disabled className="text-kn-ink-1">
                Sign in
              </Button>
            </TooltipTrigger>
            <TooltipContent>Accounts coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button
          render={
            <Link href="/problems">
              Start exploring
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="bg-kn-current text-white hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)]"
        />
      </div>
    </header>
  );
}
