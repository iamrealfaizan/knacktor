import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/types";

const STYLES: Record<Difficulty, string> = {
  easy:   "text-kn-result  bg-kn-result-subtle  border-kn-result-border  hover:bg-kn-result-subtle",
  medium: "text-kn-amber   bg-kn-amber-subtle   border-kn-amber-border   hover:bg-kn-amber-subtle",
  hard:   "text-kn-error   bg-kn-error-subtle   border-kn-error-border   hover:bg-kn-error-subtle",
};

const LABELS: Record<Difficulty, string> = {
  easy: "Easy", medium: "Medium", hard: "Hard",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn(STYLES[difficulty], className)}>
      {LABELS[difficulty]}
    </Badge>
  );
}
