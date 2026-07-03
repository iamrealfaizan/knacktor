"use client";

import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_LINKS } from "@/lib/site";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-5 h-16 px-5 sm:px-7 border-b border-kn-border-0 bg-kn-bg/80 backdrop-blur-xl">
      <Logo variant="marketing" href="/" />

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

        <ThemeToggle />

        <Button
          variant="ghost"
          size="sm"
          className="hidden sm:inline-flex text-kn-ink-1"
          render={<Link href="/login">Sign in</Link>}
        />

        <Button
          render={
            <Link href="/signup">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
          className="bg-kn-current text-white hover:opacity-90 shadow-[0_4px_14px_var(--kn-accent-soft)]"
        />
      </div>
    </header>
  );
}
