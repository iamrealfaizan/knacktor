import { NextResponse } from "next/server";
import { getPatterns } from "@/lib/content-service";
import { CACHE_HEADERS } from "@/lib/api-cache";

export async function GET() {
  try {
    const data = await getPatterns();
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("[GET /api/patterns]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch patterns" },
      { status: 500 }
    );
  }
}
