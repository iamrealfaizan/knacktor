import { NextRequest, NextResponse } from "next/server";
import { getTrace, getPresetTraces } from "@/lib/content-service";
import { CACHE_HEADERS } from "@/lib/api-cache";

// GET /api/problems/:slug/traces?approachId=<id>&inputId=<id>
//
// Both params present  → returns the single matching Trace
// Only approachId      → returns Record<inputId, Trace> for all presets of that approach
// Missing approachId   → 400

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = req.nextUrl;
  const approachId = searchParams.get("approachId");
  const inputId = searchParams.get("inputId");

  if (!approachId) {
    return NextResponse.json(
      { data: null, error: "approachId query param is required" },
      { status: 400 }
    );
  }

  try {
    if (inputId) {
      // Single trace
      const data = await getTrace(slug, approachId, inputId);
      if (!data) {
        return NextResponse.json(
          { data: null, error: "Trace not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ data }, { headers: CACHE_HEADERS });
    } else {
      // All preset traces for this approach
      const data = await getPresetTraces(slug, approachId);
      return NextResponse.json({ data }, { headers: CACHE_HEADERS });
    }
  } catch (err) {
    console.error(`[GET /api/problems/${slug}/traces]`, err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch trace" },
      { status: 500 }
    );
  }
}
