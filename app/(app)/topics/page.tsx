import { getTopics, getProblemCountsByTopic } from "@/lib/content-service";
import { SectionHeader } from "@/components/concept/section-header";
import { ConceptGrid } from "@/components/concept/concept-grid";
import { ConceptCard } from "@/components/concept/concept-card";
import { conceptVisual } from "@/lib/concept-visuals";

export const metadata = { title: "Topics" };

export default async function TopicsPage() {
  const [topics, countByTopic] = await Promise.all([
    getTopics(),
    getProblemCountsByTopic(),
  ]);

  const totalProblems = Object.values(countByTopic).reduce((a, b) => a + b, 0);

  return (
    <main className="max-w-[1240px] mx-auto px-5 sm:px-7 py-10">
      <SectionHeader
        eyebrow="BY STRUCTURE"
        title="Topics"
        subcopy={`Master one data structure or concept at a time — ${topics.length} topics, ${totalProblems} problems.`}
      />

      <ConceptGrid cols={4}>
        {topics.map((topic) => {
          const { icon, tone } = conceptVisual(topic.slug);
          return (
            <ConceptCard
              key={topic.slug}
              href={`/topics/${topic.slug}`}
              icon={icon}
              tone={tone}
              name={topic.name}
              description={topic.description}
              count={countByTopic[topic.slug] ?? 0}
            />
          );
        })}
      </ConceptGrid>
    </main>
  );
}
