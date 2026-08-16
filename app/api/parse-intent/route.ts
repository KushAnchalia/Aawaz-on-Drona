import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "../../lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { text, customPrompt } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { action: "clarify", error: "No text provided" },
        { status: 400 }
      );
    }

    // If customPrompt is provided, use it for the agent's personality
    const intent = await parseIntent(text, customPrompt);
    return NextResponse.json(intent);
  } catch (error: any) {
    console.error("Error in parse-intent API:", error);
    return NextResponse.json(
      { action: "clarify", error: error.message },
      { status: 500 }
    );
  }
}

