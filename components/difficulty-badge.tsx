import type { Difficulty } from "@/lib/types";
import { cn } from "@/lib/utils";

const STYLES: Record<Difficulty, string> = {
  easy:   "text-kn-result  bg-kn-result-subtle  border-kn-result-border",
  medium: "text-kn-amber   bg-kn-amber-subtle   border-kn-amber-border",
  hard:   "text-kn-error   bg-kn-error-subtle   border-kn-error-border",
};

const LABELS: Record<Difficulty, string> = {
  easy:   "Easy",
  medium: "Medium",
  hard:   "Hard",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
        STYLES[difficulty],
        className
      )}
    >
      {LABELS[difficulty]}
    </span>
  );
}
