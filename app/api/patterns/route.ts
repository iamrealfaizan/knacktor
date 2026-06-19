import { NextResponse } from "next/server";
import { getPatterns } from "@/lib/content-service";

export async function GET() {
  try {
    const data = await getPatterns();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/patterns]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch patterns" },
      { status: 500 }
    );
  }
}
