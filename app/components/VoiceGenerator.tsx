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
  const [error, setError] = useState<string | null>(null);

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

    try {
      // Try backend first (for ElevenLabs if configured)
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

      // If backend returns a data URI (likely mock/silent if no API key), 
      // OR if we want to ensure sound, let's use the browser TTS as a robust fallback/override for the demo.
      // The current backend mock is a silent MP3, which is confusing. 
      // Let's use browser TTS if the backend didn't give us a real remote URL or if it looks like the mock.

      const isMock = data.audio && data.audio.startsWith("data:audio/mp3;base64,//uQRA");

      if (!response.ok || isMock || !data.audio) {
        console.log("Using Browser TTS Fallback");
        // Fallback to Browser Speech Synthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(prompt);
          // Try to match voice style loosely
          const voices = window.speechSynthesis.getVoices();
          if (agent.category === "Business") utterance.voice = voices.find(v => v.name.includes("Male")) || null;
          if (agent.category === "Educational") utterance.voice = voices.find(v => v.name.includes("Female")) || null;

          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);

          setAudioUrl(null); // No visual player needed if speaking directly, or we could still show success
        } else {
          throw new Error("Browser text-to-speech not supported");
        }
      } else {
        setAudioUrl(data.audio);
      }

    } catch (err: any) {
      console.warn("Backend generation failed, trying browser fallback...", err);
      // Last resort fallback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(prompt);
        window.speechSynthesis.speak(utterance);
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
            ✅ Voice generated successfully!
          </div>
          <audio controls style={{ width: "100%" }}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
            Prompt: "{prompt}"
          </div>
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

