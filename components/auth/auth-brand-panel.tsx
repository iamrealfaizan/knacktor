import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NUMS = [1, 2, 4, 6, 8, 11];

const DOT_GRID: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
  backgroundSize: "20px 20px",
};

/**
 * Decorative right panel for the auth pages — a static, frozen frame of the
 * landing hero's two-pointer visualizer (no state, no intervals). Matched
 * pair found: lo=1 (2) + hi=4 (8) = target 10.
 */
export function AuthBrandPanel() {
  const lo = 1;
  const hi = 4;

  return (
    <div
      className="relative h-full flex flex-col items-center justify-center gap-10 px-12 bg-kn-surface-1 border-l border-kn-border-0 overflow-hidden"
      style={DOT_GRID}
    >
      <div className="w-full max-w-[420px]">
        <div className="relative">
          <div className="absolute -top-4 -left-4 right-7 bottom-7 rounded-2xl bg-kn-stage border border-kn-border-0 -rotate-2" />
          <div className="relative rounded-2xl bg-kn-surface-0 border border-kn-border-0 shadow-2xl overflow-hidden">
            {/* window chrome */}
            <div className="flex items-center gap-2 px-3.5 py-3 border-b border-kn-border-0 bg-kn-surface-1">
              <span className="w-1.5 h-1.5 rounded-full bg-kn-result" />
              <span className="font-mono text-[10px] font-semibold tracking-[0.13em] text-kn-ink-2">
                TWO_SUM.PY · two pointers
              </span>
            </div>
            {/* frozen stage */}
            <div className="px-5 pt-6 pb-5">
              <div className="flex justify-center items-center gap-3 mb-5">
                <span className="font-mono text-sm font-semibold text-kn-ink-0 bg-kn-surface-0 border border-kn-border-0 rounded-lg px-3 py-1.5">
                  2 + 8 = 10
                </span>
                <span className="font-mono text-[15px] font-bold text-kn-result">
                  = target 10
                </span>
              </div>
              <div className="flex justify-center gap-2.5">
                {NUMS.map((v, i) => {
                  const role = i === lo ? "lo" : i === hi ? "hi" : null;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          "w-[46px] h-[46px] border-2 rounded-[10px] grid place-items-center font-mono text-lg font-semibold text-kn-ink-0",
                          role
                            ? "border-kn-result bg-kn-result-subtle"
                            : "border-kn-border-0 bg-kn-surface-0"
                        )}
                      >
                        {v}
                      </div>
                      <div className="h-[22px]">
                        {role && (
                          <span className="font-mono text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full bg-kn-result">
                            {role}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[380px] text-center">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-current bg-kn-current-subtle px-3 py-1.5 rounded-full">
          <Zap className="h-3.5 w-3.5" /> VISUAL DSA WORKSPACE
        </span>
        <p className="mt-4 text-lg leading-relaxed text-kn-ink-1">
          Watch algorithms{" "}
          <b className="font-semibold text-kn-ink-0">visibly execute</b> — real
          Python, animated data structures, live variables, all in sync.
        </p>
      </div>
    </div>
  );
}
