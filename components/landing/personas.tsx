import { cn } from "@/lib/utils";
import { PERSONAS, TONES } from "./data";

export function Personas() {
  return (
    <section className="px-5 sm:px-7 pt-2 pb-16">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[680px] mx-auto mb-11">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">WHO IT&apos;S FOR</span>
          <h2 className="mt-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-kn-ink-0">
            Built for the moment it finally clicks
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {PERSONAS.map(({ icon: Icon, title, body, quote, tone }) => {
            const t = TONES[tone];
            return (
              <div key={title} className="border border-kn-border-0 rounded-2xl bg-kn-surface-0 p-6 pb-7">
                <div className={cn("w-11 h-11 rounded-xl grid place-items-center", t.tint, t.text)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-bold text-lg text-kn-ink-0 mt-4">{title}</div>
                <div className="text-[14.5px] leading-relaxed text-kn-ink-1 mt-2">{body}</div>
                <div className={cn("mt-4 font-mono text-xs font-semibold", t.text)}>“{quote}”</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
