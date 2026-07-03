import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  DIFFICULTY_LABEL,
  DIFFICULTY_STYLE,
  toDifficultySlug,
} from "@/lib/difficulty";

/**
 * The one difficulty pill. Accepts any casing ("easy" | "Easy" | "MEDIUM").
 * `format="upper"` renders the compact uppercase-mono variant used on dense
 * surfaces (problem top-bar, dashboard tables).
 */
export function DifficultyBadge({
  difficulty,
  format = "title",
  className,
}: {
  difficulty: string;
  format?: "title" | "upper";
  className?: string;
}) {
  const slug = toDifficultySlug(difficulty);
  const s = DIFFICULTY_STYLE[slug];
  const label = DIFFICULTY_LABEL[slug];

  return (
    <Badge
      variant="outline"
      className={cn(
        s.bg,
        s.ink,
        s.border,
        format === "upper" &&
          "font-mono text-[10px] tracking-wider uppercase rounded-full",
        className
      )}
    >
      {format === "upper" ? label.toUpperCase() : label}
    </Badge>
  );
}
