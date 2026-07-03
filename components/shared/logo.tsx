import Link from "next/link";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The one Knacktor logo lockup. Variants:
 * - "nav":       compact icon + wordmark (global Nav)
 * - "marketing": large icon + large wordmark (landing header/footer)
 * - "dashboard": large icon + bold wordmark (logged-in home header)
 * - "tile":      icon in a filled square, no wordmark (problem top-bar)
 */
export function Logo({
  variant = "nav",
  href = "/",
  className,
}: {
  variant?: "nav" | "marketing" | "dashboard" | "tile";
  href?: string;
  className?: string;
}) {
  if (variant === "tile") {
    return (
      <Link
        href={href}
        title="Back to problems"
        className={cn(
          "w-7 h-7 rounded-md bg-kn-current grid place-items-center text-white shrink-0",
          className
        )}
      >
        <Code2 className="h-4 w-4" />
      </Link>
    );
  }

  const large = variant !== "nav";
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <Code2
        className={cn("text-kn-current", large ? "h-7 w-7" : "h-5 w-5")}
        strokeWidth={2.5}
      />
      <span
        className={cn(
          "tracking-tight text-kn-ink-0",
          large ? "text-lg" : "",
          variant === "dashboard" ? "font-bold" : "font-semibold"
        )}
      >
        knacktor
      </span>
    </Link>
  );
}
