import { NextResponse } from "next/server";
import { getTopics } from "@/lib/content-service";
import { CACHE_HEADERS } from "@/lib/api-cache";

export async function GET() {
  try {
    const data = await getTopics();
    return NextResponse.json({ data }, { headers: CACHE_HEADERS });
  } catch (err) {
    console.error("[GET /api/topics]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
