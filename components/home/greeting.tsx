import { USER, WEEKLY_GOAL_REMAINING } from "./home-data";

export function Greeting() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-[18px]">
      <div>
        <div className="font-mono text-[11px] font-semibold tracking-[0.15em] text-kn-ink-2">
          WELCOME BACK
        </div>
        <h1 className="mt-1.5 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] text-kn-ink-0">
          Good to see you, {USER.name} <span aria-hidden>👋</span>
        </h1>
      </div>
      <div className="text-sm text-kn-ink-1">
        You&rsquo;re{" "}
        <b className="text-kn-ink-0 font-semibold">{WEEKLY_GOAL_REMAINING} problems</b> from this
        week&rsquo;s goal
      </div>
    </div>
  );
}
