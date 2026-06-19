import { NextRequest, NextResponse } from "next/server";
import { getProblems } from "@/lib/content-service";
import type { ProblemFilters, DifficultySlug } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const filters: ProblemFilters = {};

    const difficulty = searchParams.get("difficulty");
    if (difficulty) filters.difficulty = difficulty as DifficultySlug;

    const topic = searchParams.get("topic");
    if (topic) filters.topicSlug = topic;

    const pattern = searchParams.get("pattern");
    if (pattern) filters.patternSlug = pattern;

    const sheet = searchParams.get("sheet");
    if (sheet) filters.sheetSlug = sheet;

    const search = searchParams.get("search");
    if (search) filters.search = search;

    const data = await getProblems(filters);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/problems]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch problems" },
      { status: 500 }
    );
  }
}
