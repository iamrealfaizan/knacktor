import Link from "next/link";
import { Play } from "lucide-react";

export function FinalCta() {
  return (
    <section className="px-5 sm:px-7 pt-2 pb-20">
      <div className="max-w-[1240px] mx-auto relative overflow-hidden rounded-3xl bg-kn-ink-0 px-6 sm:px-10 py-16 text-center">
        <h2 className="text-3xl sm:text-[46px] font-extrabold leading-[1.06] tracking-tight text-kn-surface-0">
          Stop reading algorithms.
          <br />
          Start <span className="text-kn-current">watching</span> them.
        </h2>
        <p className="mt-4 mx-auto max-w-[520px] text-lg leading-relaxed text-kn-surface-1">
          Open any problem and see the code, the data and the explanation move as one.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 font-semibold text-white bg-kn-current px-7 py-3.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            <Play className="h-4 w-4" /> Get started free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center font-semibold text-kn-surface-0 border border-kn-surface-1 px-6 py-3.5 rounded-xl hover:bg-kn-surface-0 hover:text-kn-ink-0 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
