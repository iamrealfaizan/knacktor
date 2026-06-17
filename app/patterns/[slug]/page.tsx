import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Pattern: ${params.slug}` };
}

export default function PatternPage({ params }: Props) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-kn-ink-0 capitalize">
        {params.slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-1 text-sm text-kn-ink-2">
        Problems using this pattern.
      </p>
      {/*
        Query: db.problems.find({ patterns: params.slug })
        A problem can belong to multiple patterns — patterns field is string[].
        Problem list — M1.3
      */}
    </main>
  );
}
