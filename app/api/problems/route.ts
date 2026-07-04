import { NextRequest, NextResponse } from "next/server";
import { getProblems, getProblemsPage } from "@/lib/content-service";
import type { ProblemFilters, DifficultySlug, ProblemSort } from "@/lib/types";
import { CACHE_HEADERS } from "@/lib/api-cache";

const VALID_SORT: readonly string[] = ["number", "difficulty", "title"];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const multi = (key: string) => searchParams.getAll(key).filter(Boolean);

    // Filters (multi-select via repeated params: ?topic=a&topic=b).
    const difficulties = multi("difficulty") as DifficultySlug[];
    const topicSlugs = multi("topic");
    const patternSlugs = multi("pattern");
    const sheet = searchParams.get("sheet") || undefined;
    const search = searchParams.get("q") || searchParams.get("search") || undefined;

    const filters: ProblemFilters = {
      ...(difficulties.length ? { difficulties } : {}),
      ...(topicSlugs.length ? { topicSlugs } : {}),
      ...(patternSlugs.length ? { patternSlugs } : {}),
      ...(sheet ? { sheetSlug: sheet } : {}),
      ...(search ? { search } : {}),
    };

    // Paginated mode when any of page/limit/sort is present; returns { data, total }.
    const sortParam = searchParams.get("sort");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const paginated = pageParam !== null || limitParam !== null || sortParam !== null;

    if (paginated) {
      const sort: ProblemSort = VALID_SORT.includes(sortParam ?? "")
        ? (sortParam as ProblemSort)
        : "number";
      const order = searchParams.get("order") === "desc" ? "desc" : "asc";
      const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(limitParam ?? "20", 10) || 20));
      const { items, total } = await getProblemsPage({ ...filters, sort, order, page, limit });
      return NextResponse.json({ data: items, total }, { headers: CACHE_HEADERS });
    }

    const data = await getProblems(filters);
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("[GET /api/problems]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}
