import type { Metadata } from "next";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Topic: ${params.slug}` };
}

export default function TopicPage({ params }: Props) {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-kn-ink-0 capitalize">
        {params.slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-1 text-sm text-kn-ink-2">
        Problems tagged with this topic.
      </p>
      {/*
        Query: db.problems.find({ topics: params.slug })
        A problem can belong to multiple topics — topics field is string[].
        Problem list — M1.3
      */}
    </main>
  );
}
