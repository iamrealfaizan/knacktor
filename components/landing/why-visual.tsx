const DEAD_CODE = [
  "def two_sum(nums, t):",
  "    lo, hi = 0, len(nums)-1",
  "    while lo < hi:",
  "        s = nums[lo]+nums[hi]",
  "        if s == t: return [lo, hi]",
  "        elif s < t: lo += 1",
  "        else: hi -= 1",
];
const WINDOW_CELLS = [3, 1, 4, 1, 5, 9];

const DOT_GRID: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

export function WhyVisual() {
  return (
    <section className="px-5 sm:px-7 pt-2 pb-[74px]">
      <div className="max-w-[1240px] mx-auto border border-kn-border-0 rounded-[20px] bg-kn-surface-1 overflow-hidden grid md:grid-cols-2">
        {/* old way */}
        <div className="p-6 sm:p-10 border-b md:border-b-0 md:border-r border-dashed border-kn-border-0">
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-ink-2">THE OLD WAY</span>
          <h3 className="mt-3 mb-4 text-2xl font-bold leading-tight text-kn-ink-1">
            Read it. Simulate it in your head.
          </h3>
          <div className="border border-kn-border-0 rounded-xl bg-kn-surface-0 p-3.5 opacity-70 overflow-x-auto">
            {DEAD_CODE.map((ln, i) => (
              <div key={i} className="font-mono text-[12.5px] leading-[1.8] text-kn-ink-2 whitespace-pre">
                {ln}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-kn-ink-2">
            You trace pointers on scratch paper, lose track of state, and memorize patterns you never truly saw move.
          </p>
        </div>
        {/* seeing */}
        <div className="p-6 sm:p-10 bg-kn-surface-0">
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-kn-current">
            THE KNACKTOR WAY
          </span>
          <h3 className="mt-3 mb-4 text-2xl font-bold leading-tight text-kn-ink-0">Watch it solve itself.</h3>
          <div className="border border-kn-border-0 rounded-xl bg-kn-stage px-4 py-5" style={DOT_GRID}>
            <div className="relative grid grid-cols-6 gap-2">
              <div
                className="absolute -top-[5px] -bottom-[5px] w-1/3 border-2 border-kn-current rounded-lg"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--kn-current) 14%, transparent)",
                  animation: "kn-win 4.2s ease-in-out infinite",
                }}
              />
              {WINDOW_CELLS.map((v, i) => (
                <div
                  key={i}
                  className="h-[46px] border-2 border-kn-border-0 rounded-lg bg-kn-surface-0 grid place-items-center font-mono text-base font-semibold text-kn-ink-0"
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-kn-ink-1">
            The window slides, variables flash, the answer appears. Understanding lands in seconds — and it sticks.
          </p>
        </div>
      </div>
    </section>
  );
}
