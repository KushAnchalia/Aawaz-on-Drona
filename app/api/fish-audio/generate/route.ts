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

    // Explicit voice model ID always wins (e.g. per-agent referenceId from Fish Studio)
    if (referenceId && typeof referenceId === "string" && referenceId.trim()) {
      result = await generateFishAudio({
        text,
        referenceId: referenceId.trim(),
        speed,
        volume,
        format,
        model,
      });
    } else if (celebrityId) {
      // Named celebrity voice (modi / trump / bachchan / custom)
      result = await generateCelebrityVoice(celebrityId, text);
    } else {
      // Account default voice
      result = await generateFishAudio({
        text,
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
      const headers: Record<string, string> = {
        "Content-Type": `audio/${format || "mp3"}`,
        "Content-Disposition": `attachment; filename="fish-audio-${Date.now()}.${format || "mp3"}"`,
      };
      if (result.note) {
        // HTTP headers must be Latin-1 — sanitize anything exotic
        headers["X-Aawaz-Voice-Note"] = result.note.replace(/[^\x20-\x7E]/g, "");
      }
      return new NextResponse(result.audioBlob, { status: 200, headers });
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
