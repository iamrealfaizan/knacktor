import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center text-center gap-6">
      <div className="flex items-center gap-2 text-sm font-medium text-kn-current bg-kn-surface-1 border border-kn-border-0 rounded-full px-4 py-1.5">
        <Zap className="h-3.5 w-3.5" />
        Watch algorithms solve themselves
      </div>

      <h1 className="text-5xl font-semibold text-kn-ink-0 tracking-tight max-w-2xl leading-tight">
        DSA that you{" "}
        <span className="text-kn-current">see</span>, not just read
      </h1>

      <p className="text-lg text-kn-ink-1 max-w-xl">
        Line-by-line Python execution, cinematic animations, and live variable
        tracking — all controlled like a media player.
      </p>

      <Link
        href="/problems"
        className="inline-flex items-center gap-2 bg-kn-current text-white font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity mt-2"
      >
        Browse problems
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
