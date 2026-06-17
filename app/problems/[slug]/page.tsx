import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.slug };
}

export default function ProblemPage({ params }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center text-kn-ink-2 text-sm">
      Problem visualizer for{" "}
      <span className="font-mono ml-1 text-kn-ink-1">{params.slug}</span>
      {/* Full problem page engine — M1.4 */}
    </div>
  );
}
