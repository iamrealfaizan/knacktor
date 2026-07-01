import { cn } from "@/lib/utils";

const DOT_GRID: React.CSSProperties = {
  backgroundImage: "radial-gradient(var(--kn-dot) 1px, transparent 1px)",
  backgroundSize: "18px 18px",
};

const STAGE = "relative h-[150px] bg-kn-stage";
const NODE = "border-2 border-kn-border-0 bg-kn-surface-0 text-kn-ink-0 rounded-full grid place-items-center font-mono font-semibold";
const LABEL = "absolute top-3.5 right-4 font-mono text-[9px] font-semibold tracking-[0.12em] text-kn-current";

function Card({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="border border-kn-border-0 rounded-2xl bg-kn-surface-0 overflow-hidden">
      {children}
      <div className="px-4 pt-3.5 pb-4">
        <div className="font-bold text-sm text-kn-ink-0">{title}</div>
        <div className="text-[13px] leading-snug text-kn-ink-1 mt-1">{body}</div>
      </div>
    </div>
  );
}

const TREE_NODES = [
  { id: "A", left: 88, top: 8, delay: 0 },
  { id: "B", left: 42, top: 47, delay: 0.5 },
  { id: "C", left: 134, top: 47, delay: 0.9 },
  { id: "D", left: 16, top: 86, delay: 1.3 },
  { id: "E", left: 68, top: 86, delay: 1.6 },
  { id: "F", left: 108, top: 86, delay: 1.9 },
  { id: "G", left: 160, top: 86, delay: 2.2 },
];

const GRAPH_NODES = [
  { id: "1", left: 26, top: 12, delay: 0 },
  { id: "2", left: 146, top: 12, delay: 0.6 },
  { id: "3", left: 26, top: 78, delay: 0.6 },
  { id: "4", left: 146, top: 78, delay: 1.3 },
];

const BUCKETS = [
  { i: "0", v: "·", cls: "border-kn-border-0 bg-kn-surface-0", dur: 2.4, delay: 0 },
  { i: "1", v: "42", cls: "border-kn-current bg-kn-current-subtle", dur: 2.2, delay: 0.3 },
  { i: "2", v: "·", cls: "border-kn-border-0 bg-kn-surface-0", dur: 2.6, delay: 0.6 },
  { i: "3", v: "17", cls: "border-kn-result bg-kn-result-subtle", dur: 2.0, delay: 0.9 },
];

export function StructureShowcase() {
  return (
    <section className="px-5 sm:px-7 pt-2 pb-[76px]">
      <div className="max-w-[1240px] mx-auto">
        <div className="text-center max-w-[680px] mx-auto mb-11">
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-kn-ink-2">
            EVERY STRUCTURE, ANIMATED
          </span>
          <h2 className="mt-3.5 text-3xl sm:text-4xl font-extrabold tracking-tight text-kn-ink-0">
            From arrays to graphs — see them move
          </h2>
          <p className="mt-3.5 text-[17px] leading-relaxed text-kn-ink-1">
            Twenty-plus structures and patterns, each with cinematic, beginner-clear motion built from the real interface.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Linked list */}
          <Card title="Linked Lists" body="Watch pointers walk, reverse and reconnect node by node.">
            <div className={cn(STAGE, "flex items-center justify-center")} style={DOT_GRID}>
              <div className="relative flex items-center">
                <span
                  className="absolute -top-[26px] left-0 w-4 h-4 rounded-full bg-kn-current"
                  style={{ animation: "kn-travel-dot 3.4s ease-in-out infinite", boxShadow: "0 0 0 5px var(--kn-accent-soft)" }}
                />
                <div className="flex items-center gap-3.5">
                  <div className={cn(NODE, "w-[38px] h-[38px] rounded-[9px] border-kn-compared text-[13px]")}>3</div>
                  <span className="text-kn-ink-2">→</span>
                  <div className={cn(NODE, "w-[38px] h-[38px] rounded-[9px] text-[13px]")}>7</div>
                  <span className="text-kn-ink-2">→</span>
                  <div className={cn(NODE, "w-[38px] h-[38px] rounded-[9px] text-[13px]")}>1</div>
                  <span className="text-kn-ink-2">→</span>
                  <div className="w-[38px] h-[38px] rounded-[9px] border-2 border-dashed border-kn-border-0 bg-kn-surface-0 grid place-items-center font-mono text-[12px] text-kn-ink-2">
                    ∅
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Stack */}
          <Card title="Stacks & Queues" body="See LIFO and FIFO order play out as items enter and leave.">
            <div className={cn(STAGE, "flex items-end justify-center pb-[18px]")} style={DOT_GRID}>
              <div className="flex flex-col-reverse gap-1.5 items-center">
                <div className="w-[88px] h-6 rounded-md bg-kn-surface-0 border-2 border-kn-border-0" />
                <div className="w-[88px] h-6 rounded-md bg-kn-surface-0 border-2 border-kn-border-0" />
                <div className="w-[88px] h-6 rounded-md bg-kn-surface-0 border-2 border-kn-border-0" />
                <div
                  className="w-[88px] h-6 rounded-md bg-kn-current border-2 border-kn-current"
                  style={{ animation: "kn-push 2.8s ease-in-out infinite" }}
                />
              </div>
              <span className={LABEL}>push / pop</span>
            </div>
          </Card>

          {/* Sorting */}
          <Card title="Sorting" body="Compare, swap and partition — every exchange made visible.">
            <div className={cn(STAGE, "flex items-end justify-center gap-2.5 pb-[22px]")} style={DOT_GRID}>
              <span className={LABEL}>compare · swap</span>
              <Bar h={34} value="1" />
              <Bar h={86} value="5" tone="border-kn-current bg-kn-current-subtle" anim="kn-swap-r" />
              <Bar h={58} value="3" tone="border-kn-compared bg-kn-blue-soft" anim="kn-swap-l" />
              <Bar h={72} value="4" />
              <Bar h={100} value="6" />
            </div>
          </Card>

          {/* Binary tree */}
          <Card title="Trees & Traversal" body="DFS and BFS light up the path through every node in order.">
            <div className={cn(STAGE, "grid place-items-center")} style={DOT_GRID}>
              <span className={LABEL}>BFS order</span>
              <div className="relative w-[200px] h-[118px]">
                <svg viewBox="0 0 200 118" className="absolute inset-0 w-[200px] h-[118px] overflow-visible">
                  {[
                    [100, 20, 54, 59],
                    [100, 20, 146, 59],
                    [54, 59, 28, 98],
                    [54, 59, 80, 98],
                    [146, 59, 120, 98],
                    [146, 59, 172, 98],
                  ].map(([x1, y1, x2, y2], i) => (
                    <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--kn-border-0)" strokeWidth={2} />
                  ))}
                </svg>
                {TREE_NODES.map((n) => (
                  <span
                    key={n.id}
                    className={cn(NODE, "absolute w-6 h-6 text-[11px]")}
                    style={{ left: n.left, top: n.top, animation: `kn-glow 3.6s ease-in-out infinite ${n.delay}s` }}
                  >
                    {n.id}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Graph */}
          <Card title="Graphs" body="Edges flow and frontiers expand across BFS, DFS and Dijkstra.">
            <div className={cn(STAGE, "grid place-items-center")} style={DOT_GRID}>
              <span className={LABEL}>BFS frontier</span>
              <div className="relative w-[200px] h-[118px]">
                <svg viewBox="0 0 200 118" className="absolute inset-0 w-[200px] h-[118px] overflow-visible">
                  <line x1={40} y1={26} x2={160} y2={26} stroke="var(--kn-current)" strokeWidth={2.5} strokeDasharray="6 6" style={{ animation: "kn-edge 1.4s linear infinite" }} />
                  <line x1={40} y1={26} x2={40} y2={92} stroke="var(--kn-current)" strokeWidth={2.5} strokeDasharray="6 6" style={{ animation: "kn-edge 1.4s linear infinite" }} />
                  <line x1={160} y1={26} x2={160} y2={92} stroke="var(--kn-current)" strokeWidth={2.5} strokeDasharray="6 6" style={{ animation: "kn-edge 1.4s linear infinite .7s" }} />
                  <line x1={40} y1={92} x2={160} y2={92} stroke="var(--kn-border-0)" strokeWidth={2} />
                  <line x1={40} y1={26} x2={160} y2={92} stroke="var(--kn-border-0)" strokeWidth={2} />
                </svg>
                {GRAPH_NODES.map((n) => (
                  <span
                    key={n.id}
                    className={cn(NODE, "absolute w-7 h-7 text-[12px]")}
                    style={{ left: n.left, top: n.top, animation: `kn-glow 3.4s ease-in-out infinite ${n.delay}s` }}
                  >
                    {n.id}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          {/* Hash map */}
          <Card title="Hash Maps" body="Keys hash into buckets and collisions resolve in real time.">
            <div className={cn(STAGE, "grid place-items-center")} style={DOT_GRID}>
              <div className="flex flex-col gap-1.5">
                {BUCKETS.map((b) => (
                  <div key={b.i} className="flex items-center gap-2">
                    <span className="w-5 h-6 rounded-md bg-kn-inset border border-kn-border-0 grid place-items-center font-mono text-[10px] text-kn-ink-2">
                      {b.i}
                    </span>
                    <span
                      className={cn("w-[54px] h-6 rounded-md border-2 grid place-items-center font-mono text-[11px] text-kn-ink-0", b.cls)}
                      style={{ animation: `kn-blink ${b.dur}s ease-in-out infinite ${b.delay}s` }}
                    >
                      {b.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Bar({ h, value, tone, anim }: { h: number; value: string; tone?: string; anim?: string }) {
  return (
    <div
      className={cn(
        "w-[26px] rounded-t-md border-2 flex items-start justify-center pt-1.5 font-mono text-[11px] font-semibold",
        tone ?? "border-kn-border-0 bg-kn-surface-0 text-kn-ink-2",
        tone && "text-kn-ink-0"
      )}
      style={{ height: h, ...(anim ? { animation: `${anim} 3s ease-in-out infinite` } : {}) }}
    >
      {value}
    </div>
  );
}
