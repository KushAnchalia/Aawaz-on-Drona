// Fish Audio TTS integration (https://fish.audio)
// Server-side only — uses FISH_AUDIO_API_KEY from env.
// Hume.ai remains as an automatic fallback if the Fish key is missing.

/**
 * SETUP:
 *  1. Get a key at https://fish.audio/go-api
 *  2. Add to .env.local:
 *       FISH_AUDIO_API_KEY=your_key_here
 *       FISH_AUDIO_MODI_REFERENCE_ID=your_modi_voice_model_id  (from Fish Studio)
 *  3. Restart dev server.
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
  /** e.g. default voice was used because the model ID was invalid */
  note?: string;
}

// Celebrity voice mapping → Fish Audio voice model (reference) IDs.
// referenceId empty = uses the account default voice. Set real IDs from Fish Studio.
export const CELEBRITY_VOICES = {
  "narendra-modi": {
    referenceId: process.env.FISH_AUDIO_MODI_REFERENCE_ID || "",
    name: "Narendra Modi",
    language: "en-IN",
    description: "Iconic Indian orator — Hindi/English addresses",
    style: "political-speech",
    emotion: "confident",
  },
  "donald-trump": {
    referenceId: process.env.FISH_AUDIO_TRUMP_REFERENCE_ID || "",
    name: "Donald Trump",
    language: "en-US",
    description: "Presidential, confident, assertive tone",
    style: "political-speech",
    emotion: "confident",
  },
  "amitabh-bachchan": {
    referenceId: process.env.FISH_AUDIO_BACHCHAN_REFERENCE_ID || "",
    name: "Amitabh Bachchan",
    language: "hi-IN",
    description: "Deep baritone, legendary Bollywood voice",
    style: "cinematic",
    emotion: "serious",
  },
  "custom": {
    referenceId: "",
    name: "Custom Voice",
    language: "en-US",
    description: "Account default Fish Audio voice",
    style: "custom",
    emotion: "neutral",
  },
};

/**
 * HTTP POST that survives corporate proxies.
 * Node's fetch() ignores proxy env vars, so on networks that require a
 * proxy it hangs until timeout. When a proxy is configured we shell out to
 * the system curl (uses system certs + proxy env automatically).
 */
async function httpPost(
  url: string,
  headers: Record<string, string>,
  body: string
): Promise<{ status: number; body: Buffer }> {
  const proxy =
    process.env.https_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.http_proxy ||
    process.env.HTTP_PROXY;
  if (!proxy) {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(90000),
    });
    return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
  }
  const { execFile } = await import("child_process");
  const { tmpdir } = await import("os");
  const { join } = await import("path");
  const { readFile, unlink } = await import("fs/promises");
  const outFile = join(tmpdir(), `aawaz-tts-${Date.now()}-${Math.random().toString(36).slice(2)}.bin`);
  const headerArgs = Object.entries(headers).flatMap(([k, v]) => ["-H", `${k}: ${v}`]);
  const code: string = await new Promise<string>((resolve, reject) => {
    const child = execFile(
      "curl",
      [
        "-sS", "--max-time", "90", "-X", "POST", url,
        ...headerArgs, "--data-binary", "@-", "-o", outFile, "-w", "%{http_code}",
      ],
      { timeout: 95000, maxBuffer: 32 * 1024 * 1024 },
      (err, stdout) => {
        if (err && !stdout) reject(err);
        else resolve(String(stdout).trim().slice(-3));
      }
    );
    child.stdin?.write(body);
    child.stdin?.end();
  }).catch((e) => {
    throw new Error(`Voice request failed: ${e.message || e}`);
  });
  try {
    const data = await readFile(outFile);
    return { status: parseInt(code, 10) || 0, body: data };
  } finally {
    await unlink(outFile).catch(() => undefined);
  }
}

/**
 * Generate speech with Fish Audio (primary). Falls back to Hume.ai if the
 * Fish key is missing but Hume keys exist. Returns binary audio on success.
 */
export async function generateFishAudio(
  config: FishAudioConfig
): Promise<FishAudioResponse> {
  const fishKey = process.env.FISH_AUDIO_API_KEY || "";
  if (fishKey) return generateWithFish(config, fishKey);

  const humeKey = process.env.HUME_API_KEY || "";
  if (humeKey) return generateWithHume(config);

  return {
    success: false,
    error: "Fish Audio API key not configured. Add FISH_AUDIO_API_KEY to .env.local and restart.",
  };
}

async function generateWithFish(
  config: FishAudioConfig,
  apiKey: string
): Promise<FishAudioResponse> {
  try {
    const body: Record<string, unknown> = {
      text: config.text,
      format: config.format || "mp3",
      mp3_bitrate: 128,
      normalize: true,
      latency: "balanced",
    };
    if (config.referenceId) body.reference_id = config.referenceId;
    if (config.temperature !== undefined) body.temperature = config.temperature;
    if (config.topP !== undefined) body.top_p = config.topP;
    if (config.model) body.model = config.model;

    const { status, body: raw } = await httpPost(
      "https://api.fish.audio/v1/tts",
      {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      JSON.stringify(body)
    ).catch((e) => {
      return { status: 0, body: Buffer.from("") as Buffer };
    });

    if (status < 200 || status >= 300) {
      const errText = raw.toString("utf8");
      // Invalid/unknown voice model ID → retry once with the default voice
      // instead of failing the whole request.
      if (config.referenceId && /reference_id/i.test(errText)) {
        console.warn("Fish voice model invalid, retrying with default voice:", errText.slice(0, 120));
        const retry = await generateWithFish({ ...config, referenceId: undefined }, apiKey);
        if (retry.success) {
          retry.note = "default voice - your Fish Studio model ID was rejected, check it";
          return retry;
        }
      }
      return {
        success: false,
        error: status === 0 ? "Voice request failed (network)" : `Fish Audio error ${status}: ${errText.slice(0, 200)}`,
      };
    }

    const audioBlob = new Blob([new Uint8Array(raw)], { type: "audio/mpeg" });
    if (audioBlob.size === 0) {
      return { success: false, error: "Received empty audio from Fish Audio" };
    }
    return { success: true, audioBlob, charactersUsed: config.text.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reach Fish Audio" };
  }
}

async function generateWithHume(config: FishAudioConfig): Promise<FishAudioResponse> {
  const apiKey = process.env.HUME_API_KEY || "";
  const secretKey = process.env.HUME_SECRET_KEY || "";
  try {
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
      return { success: false, error: `Hume.ai API error: ${response.status} ${response.statusText}` };
    }
    const audioBlob = await response.blob();
    if (!audioBlob || audioBlob.size === 0) {
      return { success: false, error: "Received empty audio from Hume.ai" };
    }
    return { success: true, audioBlob, charactersUsed: config.text.length };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate audio with Hume.ai" };
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

  return generateFishAudio({
    text: message,
    referenceId: voice.referenceId || undefined,
    format: "mp3",
  });
}

/**
 * Is a given celebrity voice actually playable? (Fish key + model configured)
 */
export function isVoiceConfigured(celebrityId: keyof typeof CELEBRITY_VOICES): boolean {
  if (!process.env.FISH_AUDIO_API_KEY) return false;
  if (celebrityId === "custom") return true; // default voice needs no model
  return Boolean(CELEBRITY_VOICES[celebrityId]?.referenceId);
}

/**
 * Get available celebrity voices (with configured flag so UI can badge them)
 */
export function getAvailableCelebrities() {
  return Object.entries(CELEBRITY_VOICES).map(([id, voice]) => ({
    id,
    name: voice.name,
    language: voice.language,
    description: voice.description,
    style: voice.style,
    configured: isVoiceConfigured(id as keyof typeof CELEBRITY_VOICES),
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
