import { NextRequest, NextResponse } from "next/server";
import { calculateIntegrityScoreFromDescription } from "@/lib/integrity-score";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json(
        { error: "description is required and must be a non-empty string" },
        { status: 400 },
      );
    }

    const result = calculateIntegrityScoreFromDescription(description);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Integrity score calculation failed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
