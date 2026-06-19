import { NextResponse } from "next/server";
import { getTopics } from "@/lib/content-service";

export async function GET() {
  try {
    const data = await getTopics();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/topics]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}
