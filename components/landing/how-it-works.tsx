import { cn } from "@/lib/utils";
import { PILLARS, TONES } from "./data";

export function HowItWorks() {
  return (
    <section className="px-5 sm:px-7 pt-8 pb-16">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[680px] mx-auto mb-11">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">HOW IT WORKS</span>
          <h2 className="mt-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-kn-ink-0">
            Five things, perfectly in sync
          </h2>
          <p className="mt-3.5 text-[17px] leading-relaxed text-kn-ink-1">
            Code, motion, state, narration and complexity all move together — so you understand not just{" "}
            <i>what</i> runs, but <i>why</i> it works.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {PILLARS.map(({ icon: Icon, title, body, tone }) => {
            const t = TONES[tone];
            return (
              <div key={title} className="border border-kn-border-0 rounded-2xl bg-kn-surface-0 p-4 pb-5 flex flex-col gap-3">
                <div className={cn("w-[38px] h-[38px] rounded-[10px] grid place-items-center border", t.tint, t.border, t.text)}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div>
                  <div className="font-semibold text-[15px] text-kn-ink-0">{title}</div>
                  <div className="text-[13.5px] leading-relaxed text-kn-ink-1 mt-1.5">{body}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
