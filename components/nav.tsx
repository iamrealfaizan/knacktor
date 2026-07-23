"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/site";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function Nav() {
  const pathname = usePathname();

  // The landing page (/) renders its own marketing header (LandingHeader);
  // the logged-in dashboard (/home) renders its own HomeHeader; the auth
  // pages render their own split-screen layout.
  if (
    pathname === "/" ||
    pathname === "/home" ||
    pathname === "/login" ||
    pathname === "/signup"
  )
    return null;

  // The problem-detail page has its own TopBar (no-scroll flagship layout).
  const isProblemDetail = /^\/problems\/[^/]+$/.test(pathname);
  if (isProblemDetail) return null;

  // Topics/Patterns/Sheets live under the app/(app) route group and render the
  // full dashboard HomeHeader from that group's layout — Nav must yield to it.
  const APP_PREFIXES = ["/topics", "/patterns", "/sheets"];
  if (APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/")))
    return null;

  return (
    <nav className="h-14 border-b border-kn-border-0 bg-kn-surface-0 sticky top-0 z-50 flex items-center px-6 gap-8">
      <Logo variant="nav" href="/" />

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

      <div className="ml-auto">
        <ThemeToggle />
      </div>
    </nav>
  );
}
