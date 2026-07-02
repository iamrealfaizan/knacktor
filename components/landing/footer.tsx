import Link from "next/link";
import { Code2 } from "lucide-react";
import { FOOTER_COLUMNS } from "./data";

export function LandingFooter() {
  return (
    <footer className="border-t border-kn-border-0 px-5 sm:px-7 pt-12 pb-10">
      <div className="max-w-[1240px] mx-auto grid gap-8 grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <Code2 className="h-7 w-7 text-kn-current" strokeWidth={2.5} />
            <span className="font-semibold text-lg text-kn-ink-0">knacktor</span>
          </Link>
          <p className="mt-3.5 max-w-[260px] text-sm leading-relaxed text-kn-ink-2">
            A visual algorithm-learning workspace. See DSA — don&apos;t just read it.
          </p>
        </div>
        {FOOTER_COLUMNS.map((col) => (
          <div key={col.heading}>
            <div className="font-mono text-[11px] font-bold tracking-[0.13em] uppercase text-kn-ink-2 mb-3.5">
              {col.heading}
            </div>
            {col.links.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-sm text-kn-ink-1 hover:text-kn-ink-0 transition-colors mb-2.5"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="max-w-[1240px] mx-auto mt-9 pt-5 border-t border-kn-border-0 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-kn-ink-2">© 2026 Knacktor. Watch algorithms solve themselves.</span>
        <span className="font-mono text-[11px] font-semibold tracking-[0.1em] text-kn-ink-2">MADE FOR LEARNERS</span>
      </div>
    </footer>
  );
}
