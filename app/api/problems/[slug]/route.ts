import { NextRequest, NextResponse } from "next/server";
import { getProblemFull } from "@/lib/content-service";
import { CACHE_HEADERS } from "@/lib/api-cache";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const data = await getProblemFull(params.slug);
    if (!data) {
      return NextResponse.json(
        { data: null, error: "Problem not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error(`[GET /api/problems/${params.slug}]`, err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch problem" },
      { status: 500 }
    );
  }
}
