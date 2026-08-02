"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, SquareArrowOutUpRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getInitials } from "@/lib/utils";
import { ADMIN_NAV } from "./admin-nav-config";
import { AdminSidebar } from "./admin-sidebar";

export interface AdminShellUser {
  name: string;
  username: string;
  email: string;
}

/**
 * Section title from the route, longest-prefix first — so /admin/users/<id>
 * still reads "Users" rather than falling through to "Overview".
 */
function sectionTitle(pathname: string): string {
  const match = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    );
  return match?.label ?? "Admin";
}

/**
 * The /admin chrome: fixed sidebar on lg+, sheet-based nav below (D14), and a
 * thin top bar carrying the section title and the admin's account menu.
 *
 * Deliberately reuses the learner app's warm-paper tokens and shadcn primitives
 * (D3 / Rules.md) rather than introducing an admin-only palette — the visual
 * separation comes from the ADMIN badge and the sidebar, not from new colors.
 */
export function AdminShell({
  user,
  children,
}: {
  user: AdminShellUser;
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const title = sectionTitle(usePathname());

  return (
    <div className="min-h-screen bg-kn-bg text-kn-ink-0 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="hidden border-r border-kn-border-0 lg:sticky lg:top-0 lg:block lg:h-screen">
        <AdminSidebar />
      </aside>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[280px] max-w-[80vw] gap-0 p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebar onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center gap-3 border-b border-kn-border-0 bg-kn-bg/85 px-4 backdrop-blur-xl sm:px-6">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Admin menu"
            onClick={() => setNavOpen(true)}
            className="h-9 w-9 shrink-0 text-kn-ink-0 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="truncate text-base font-semibold tracking-tight text-kn-ink-0">
            {title}
          </h1>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="Account menu"
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-kn-current"
                  />
                }
              >
                <Avatar className="size-9 bg-kn-current">
                  <AvatarFallback className="bg-kn-current text-sm font-bold text-white">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[240px]">
                <div className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-kn-ink-0">
                      {user.name}
                    </span>
                    <span className="rounded border border-kn-current-border bg-kn-current-subtle px-1.5 font-mono text-[10px] font-bold tracking-[0.1em] text-kn-current">
                      ADMIN
                    </span>
                  </div>
                  <div className="font-mono text-xs text-kn-ink-2">
                    @{user.username}
                  </div>
                  <div className="truncate font-mono text-xs text-kn-ink-2">
                    {user.email}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<a href="/home" />}>
                  <SquareArrowOutUpRight />
                  Back to app
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => signOut({ redirectTo: "/" })}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>

      {/* Action feedback for role/status mutations. */}
      <Toaster position="bottom-right" />
    </div>
  );
}
