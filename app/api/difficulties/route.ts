import { NextResponse } from "next/server";
import { getDifficulties } from "@/lib/content-service";

export async function GET() {
  try {
    const data = await getDifficulties();
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/difficulties]", err);
    return NextResponse.json(
      { data: null, error: "Failed to fetch difficulties" },
      { status: 500 }
    );
  }
}
