import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Avatar fallback initials: first + last name letter, "?" when unnamed. */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0][0] ?? ""
  const second = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : ""
  return (first + second).toUpperCase()
}
