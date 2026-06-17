"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/problems", label: "Problems" },
  { href: "/topics", label: "Topics" },
  { href: "/patterns", label: "Patterns" },
  { href: "/sheets", label: "Sheets" },
] as const;

export function Nav() {
  const pathname = usePathname();

  // The problem-detail page has its own TopBar (no-scroll flagship layout).
  const isProblemDetail = /^\/problems\/[^/]+$/.test(pathname);
  if (isProblemDetail) return null;

  return (
    <nav className="h-14 border-b border-kn-border-0 bg-kn-surface-0 sticky top-0 z-50 flex items-center px-6 gap-8">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold text-kn-ink-0 shrink-0"
      >
        <Code2 className="h-5 w-5 text-kn-current" strokeWidth={2.5} />
        <span className="tracking-tight">knacktor</span>
      </Link>

      <div className="flex items-center gap-1">
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                active
                  ? "text-kn-ink-0 bg-kn-surface-2"
                  : "text-kn-ink-1 hover:text-kn-ink-0 hover:bg-kn-surface-2"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
