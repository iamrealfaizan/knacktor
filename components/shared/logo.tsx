import Link from "next/link";
import { cn } from "@/lib/utils";

/** The Knacktor brand mark (public/knacktor-mark.svg), sized by the caller. */
function Mark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG served statically; next/image would need dangerouslyAllowSVG
    <img
      src="/knacktor-mark.svg"
      alt="Knacktor"
      width={28}
      height={28}
      className={cn("shrink-0", className)}
    />
  );
}

/**
 * The one Knacktor logo lockup. Variants:
 * - "nav":       compact mark + wordmark (global Nav)
 * - "marketing": large mark + large wordmark (landing header/footer)
 * - "dashboard": large mark + bold wordmark (logged-in home header)
 * - "tile":      mark only, no wordmark (problem top-bar)
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
        title="Home"
        className={cn("grid place-items-center shrink-0", className)}
      >
        <Mark className="w-7 h-7" />
      </Link>
    );
  }

  const large = variant !== "nav";
  return (
    <Link href={href} className={cn("flex items-center gap-2.5 shrink-0", className)}>
      <Mark className={cn(large ? "h-7 w-7" : "h-5 w-5")} />
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
