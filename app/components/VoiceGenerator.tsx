"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { VoiceAgent } from "../api/voice-agents/route";

interface VoiceGeneratorProps {
  agent: VoiceAgent;
}

export default function VoiceGenerator({ agent }: VoiceGeneratorProps) {
  const { address, connected } = useWallet();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fishVoiceFor = (): { celebrityId?: string; referenceId?: string } => {
    if (agent.referenceId && agent.referenceId.trim()) return { referenceId: agent.referenceId.trim() };
    const n = `${agent.name} ${agent.celebrityName || ""} ${agent.voiceId || ""} ${agent.id}`.toLowerCase();
    if (n.includes("modi")) return { celebrityId: "narendra-modi" };
    if (n.includes("bachchan") || n.includes("big b")) return { celebrityId: "amitabh-bachchan" };
    if (n.includes("trump")) return { celebrityId: "donald-trump" };
    return { celebrityId: "custom" };
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !address) {
      setError("Please connect your wallet first");
      return;
    }

    if (!prompt.trim()) {
      setError("Please enter what you want the voice to say");
      return;
    }

    setLoading(true);
    setError(null);
    setAudioUrl(null);
    setEngine(null);

    // 1) Fish Audio first (real celebrity voice)
    try {
      const fishRes = await fetch("/api/fish-audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prompt.trim(), format: "mp3", ...fishVoiceFor() }),
      });
      if (fishRes.ok) {
        const blob = await fishRes.blob();
        if (blob && blob.size > 0) {
          setAudioUrl(URL.createObjectURL(blob));
          const note = fishRes.headers.get("X-Aawaz-Voice-Note");
          setEngine(note ? `🐟 Fish Audio · ${note}` : "🐟 Fish Audio");
          setLoading(false);
          return;
        }
        throw new Error("Empty audio from Fish");
      }
      const fishErr = await fishRes.json().catch(() => ({} as any));
      throw new Error(fishErr.error || "Fish TTS unavailable");
    } catch (fishError: any) {
      console.warn("Fish generation failed, trying legacy backend...", fishError?.message);
    }

    try {
      // 2) Legacy backend (ElevenLabs/mock if configured)
      const response = await fetch("/api/voice/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          wallet: address,
          voiceId: agent.id,
          referenceId: agent.referenceId,
        }),
      });

      const data = await response.json();

      // The legacy backend returns a silent mock MP3 when no key is set — never serve silence.
      const isMock = data.audio && data.audio.startsWith("data:audio/mp3;base64,//uQRA");

      if (!response.ok || isMock || !data.audio) {
        throw new Error("Legacy voice backend has no real voice configured");
      }
      setAudioUrl(data.audio);
      setEngine("🔊 backend voice");
    } catch (err: any) {
      // 3) Last resort: honest browser demo voice (clearly labelled)
      console.warn("Backend generation failed, browser fallback...", err);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(prompt);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
        setEngine("🔊 browser demo — add FISH_AUDIO_API_KEY for the real voice");
      } else {
        setError(err.message || "Failed to generate voice");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "1.5rem", backgroundColor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
      <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#333" }}>
        🎙️ Generate Voice: {agent.name}
      </h3>

      {!connected && (
        <div style={{ padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "8px", color: "#92400e", marginBottom: "1rem" }}>
          ⚠️ Connect your wallet to generate voice
        </div>
      )}

      <form onSubmit={handleGenerate}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
            What should {agent.celebrityName || agent.name} say?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g., "Happy birthday Kush!" or "Welcome to my channel"`}
            rows={3}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "1rem",
              resize: "vertical",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !connected || !prompt.trim()}
          style={{
            width: "100%",
            padding: "1rem",
            backgroundColor: loading || !connected || !prompt.trim() ? "#9ca3af" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: "bold",
            cursor: loading || !connected || !prompt.trim() ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⏳ Generating Voice..." : "🎵 Generate Voice"}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "8px", color: "#991b1b" }}>
          ❌ {error}
        </div>
      )}

      {audioUrl && (
        <div style={{ marginTop: "1.5rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "#d1fae5", borderRadius: "8px", marginBottom: "1rem" }}>
            ✅ Voice generated successfully! <span style={{ fontSize: "0.85rem" }}>{engine}</span>
          </div>
          <audio controls autoPlay style={{ width: "100%" }}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
            Prompt: "{prompt}"
          </div>
        </div>
      )}

      {engine && !audioUrl && !error && (
        <div style={{ marginTop: "1rem", padding: "1rem", backgroundColor: "#fef3c7", borderRadius: "8px", color: "#92400e" }}>
          {engine} — playing now 🔊
        </div>
      )}

      <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#eff6ff", borderRadius: "8px", fontSize: "0.85rem", color: "#1e40af" }}>
        <strong>💡 Example prompts:</strong>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
          <li>"Happy birthday Kush!"</li>
          <li>"Welcome to my channel, subscribe for more"</li>
          <li>"Thank you for watching"</li>
        </ul>
      </div>
    </div>
  );
}

