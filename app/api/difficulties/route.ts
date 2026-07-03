import { NextResponse } from "next/server";
import { getDifficulties } from "@/lib/content-service";
import { CACHE_HEADERS } from "@/lib/api-cache";

export async function GET() {
  try {
    const data = await getDifficulties();
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("[GET /api/difficulties]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch difficulties" },
      { status: 500 }
    );
  }
}
