// Hume.ai Emotional Voice API Integration
// Switched from Fish Audio to Hume.ai for emotional TTS

/**
 * SETUP GUIDE:
 * 
 * 1. Hume.ai API Key (via env vars):
 *    - Added to .env.local: HUME_API_KEY, HUME_SECRET_KEY
 * 
 * 2. Hume.ai Features:
 *    - Emotional voice synthesis (happy, sad, excited, etc.)
 *    - Multiple voice IDs available
 *    - Streaming & non-streaming support
 * 
 * 3. Access the Celebrity Voice Agent:
 *    - Run `npm run dev`
 *    - Open http://localhost:3000
 *    - Click on the "🐟 Celebrity Voice" card
 *    - Select celebrity and generate custom messages
 * 
 * API Documentation: https://dev.hume.ai/docs/empathic-voice-interface-evi/api
 */

export interface FishAudioConfig {
  text: string;
  referenceId?: string;
  speed?: number;
  volume?: number;
  format?: "mp3" | "wav" | "pcm" | "opus";
  model?: "s1" | "speech-1.6" | "speech-1.5";
  temperature?: number;
  topP?: number;
}

export interface FishAudioResponse {
  success: boolean;
  audioBlob?: Blob;
  audioUrl?: string;
  error?: string;
  charactersUsed?: number;
}

// Celebrity Voice Mapping with Hume.ai Voice IDs
// These use Hume.ai's emotional voice models
export const CELEBRITY_VOICES = {
  "donald-trump": {
    referenceId: "9e068547-5ba4-4c8e-8e03-69282a008f04", // Hume.ai authoritative male voice
    name: "Donald Trump",
    language: "en-US",
    description: "Presidential, confident, assertive tone",
    style: "political-speech",
    emotion: "confident",
  },
  "amitabh-bachchan": {
    referenceId: "9e068547-5ba4-4c8e-8e03-69282a008f04", // Hume.ai deep voice
    name: "Amitabh Bachchan",
    language: "hi-IN",
    description: "Deep baritone, legendary Bollywood voice",
    style: "cinematic",
    emotion: "serious",
  },
  "custom": {
    referenceId: "9e068547-5ba4-4c8e-8e03-69282a008f04", // Hume.ai default voice
    name: "Custom Voice",
    language: "en-US",
    description: "User-provided Hume.ai voice model",
    style: "custom",
    emotion: "neutral",
  },
};

/**
 * Generate speech using Hume.ai Emotional TTS API
 * @param config Configuration for voice generation
 * @returns Promise with audio blob or error
 */
export async function generateFishAudio(
  config: FishAudioConfig
): Promise<FishAudioResponse> {
  const apiKey = process.env.HUME_API_KEY || "";
  const secretKey = process.env.HUME_SECRET_KEY || "";

  if (!apiKey) {
    return {
      success: false,
      error: "Hume.ai API key not configured. Add HUME_API_KEY to .env.local",
    };
  }

  try {
    // Using Hume.ai TTS with proper octave 1 endpoint
    const requestBody = {
      text: config.text,
    };

    const response = await fetch(
      `https://api.hume.ai/v0/evi/chat_audio?octave=1&text=${encodeURIComponent(config.text)}`,
      {
        method: "POST",
        headers: {
          "X-Hume-Api-Key": apiKey,
          "X-Hume-Secret-Key": secretKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return {
        success: false,
        error: errorData?.message || errorData?.error || `Hume.ai API error: ${response.status} ${response.statusText}`,
      };
    }

    // Hume.ai returns binary audio data
    const audioBlob = await response.blob();

    if (!audioBlob || audioBlob.size === 0) {
      return {
        success: false,
        error: "Received empty audio from Hume.ai API",
      };
    }

    return {
      success: true,
      audioBlob,
      charactersUsed: config.text.length,
    };
  } catch (error: any) {
    console.error("Hume.ai generation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate audio with Hume.ai",
    };
  }
}

/**
 * Generate celebrity voice message
 * @param celebrityId ID from CELEBRITY_VOICES
 * @param message Custom message to speak
 * @returns Promise with audio response
 */
export async function generateCelebrityVoice(
  celebrityId: keyof typeof CELEBRITY_VOICES,
  message: string
): Promise<FishAudioResponse> {
  const voice = CELEBRITY_VOICES[celebrityId];

  if (!voice) {
    return {
      success: false,
      error: `Celebrity voice '${celebrityId}' not found`,
    };
  }

  if (!voice.referenceId) {
    return {
      success: false,
      error: `Reference ID not configured for ${voice.name}. Please train the model in Fish Studio first.`,
    };
  }

  return generateFishAudio({
    text: message,
    referenceId: voice.referenceId,
    speed: celebrityId === "donald-trump" ? 1.1 : 0.9, // Trump speaks faster
    volume: 0,
    format: "mp3",
  });
}

/**
 * Get available celebrity voices
 */
export function getAvailableCelebrities() {
  return Object.entries(CELEBRITY_VOICES)
    .filter(([_, voice]) => voice.referenceId) // Only return configured voices
    .map(([id, voice]) => ({
      id,
      name: voice.name,
      language: voice.language,
      description: voice.description,
      style: voice.style,
    }));
}

/**
 * Validate Fish Audio API key
 */
export async function validateFishAudioKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.fish.audio/v1/tts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "model": "s1",
      },
      body: JSON.stringify({
        text: "Test",
        format: "mp3",
      }),
    });

    // 401 = invalid key, 200/422 = valid key
    return response.status !== 401;
  } catch {
    return false;
  }
}
