import { NextRequest, NextResponse } from "next/server";
import { generateFishAudio, generateCelebrityVoice } from "@/app/lib/fishAudio";

// NEW API endpoint - does NOT replace existing /api/voice/generate

export async function POST(req: NextRequest) {
  try {
    const { text, celebrityId, referenceId, speed, volume, format, model } = await req.json();

    // Validation
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Text is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { success: false, error: "Text exceeds maximum length of 5000 characters" },
        { status: 400 }
      );
    }

    let result;

    // If celebrity ID is provided, use celebrity voice
    if (celebrityId) {
      result = await generateCelebrityVoice(celebrityId, text);
    } else {
      // Use custom reference ID or default generation
      result = await generateFishAudio({
        text,
        referenceId,
        speed,
        volume,
        format,
        model,
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Return audio blob as response
    if (result.audioBlob) {
      return new NextResponse(result.audioBlob, {
        status: 200,
        headers: {
          "Content-Type": `audio/${format || "mp3"}`,
          "Content-Disposition": `attachment; filename="fish-audio-${Date.now()}.${format || "mp3"}"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "No audio generated" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Fish Audio API route error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to list available celebrities
export async function GET() {
  try {
    const { getAvailableCelebrities } = await import("@/app/lib/fishAudio");
    const celebrities = getAvailableCelebrities();

    return NextResponse.json({
      success: true,
      celebrities,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
