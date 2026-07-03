"use client";

import Link from "next/link";
import { Search, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { NAV_LINKS, STREAK_DAYS, USER } from "./home-data";

export function HomeHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center gap-5 h-[60px] px-5 sm:px-6 border-b border-kn-border-0 bg-kn-bg/85 backdrop-blur-xl">
      <Logo variant="dashboard" href="/home" />

      <nav className="hidden md:flex items-center gap-0.5">
        {NAV_LINKS.map(({ label, href, active }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
              active
                ? "text-kn-ink-0 bg-kn-surface-2 font-semibold"
                : "text-kn-ink-1 hover:text-kn-ink-0 hover:bg-kn-surface-2"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        {/* Decorative search (global search not wired yet) */}
        <div className="hidden lg:flex items-center gap-2 h-9 px-3 rounded-lg border border-kn-border-0 bg-kn-surface-0">
          <Search className="h-4 w-4 text-kn-ink-2 shrink-0" />
          <Input
            readOnly
            aria-label="Search problems"
            placeholder="Search problems…"
            className="h-auto w-[150px] border-0 bg-transparent p-0 text-sm text-kn-ink-0 placeholder:text-kn-ink-2 focus-visible:ring-0"
          />
          <span className="font-mono text-[10px] font-semibold text-kn-ink-2 border border-kn-border-0 rounded px-1.5 py-0.5">
            ⌘K
          </span>
        </div>

        <div
          title="Daily streak"
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-kn-accent-soft"
        >
          <Flame className="h-4 w-4 text-kn-current" />
          <span className="font-mono text-sm font-bold text-kn-current">{STREAK_DAYS}</span>
        </div>

        <ThemeToggle />

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger render={<span tabIndex={0} />}>
              <Avatar className="size-9 bg-kn-compared">
                <AvatarFallback className="bg-kn-compared text-sm font-bold text-white">
                  {USER.initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{USER.name}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
