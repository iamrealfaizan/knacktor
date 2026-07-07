import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DISCOVERY, TONES } from "./data";

export function Discovery() {
  return (
    <section id="discover" className="px-5 sm:px-7 pt-2 pb-16">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[680px] mx-auto mb-11">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">START ANYWHERE</span>
          <h2 className="mt-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-kn-ink-0">Find your way in</h2>
        </div>

        {/* Decorative search */}
        <div
          aria-hidden
          className="max-w-[680px] mx-auto mb-7 flex items-center gap-3 h-14 px-4 border border-kn-border-0 rounded-2xl bg-kn-surface-0 shadow-sm"
        >
          <Search className="h-[18px] w-[18px] shrink-0 text-kn-current" />
          <span className="min-w-0 truncate text-sm sm:text-base text-kn-ink-2">
            Search “Two Sum”, “sliding window”, “binary tree”…
          </span>
          <span className="ml-auto shrink-0 font-mono text-[11px] font-semibold text-kn-ink-2 border border-kn-border-0 rounded-md px-2 py-1">
            ⌘K
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DISCOVERY.map(({ icon: Icon, title, body, cta, count, href, tone }) => {
            const t = TONES[tone];
            return (
              <Link
                key={title}
                href={href}
                className="group border border-kn-border-0 rounded-2xl bg-kn-surface-0 p-5 pb-6 flex flex-col gap-2.5 hover:border-kn-border-1 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className={cn("w-10 h-10 rounded-xl grid place-items-center", t.tint, t.text)}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-kn-ink-2">{count}</span>
                </div>
                <div className="font-bold text-[17px] text-kn-ink-0">{title}</div>
                <div className="text-[13.5px] leading-relaxed text-kn-ink-1">{body}</div>
                <span className={cn("mt-0.5 inline-flex items-center gap-1 font-semibold text-[13px]", t.text)}>
                  {cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
