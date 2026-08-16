"use client";
import { useState, useRef, useEffect } from "react";

// NEW Component - Does NOT replace VoiceGenerator or any existing voice components

interface FishVoiceGeneratorProps {
  onSpeak?: (text: string) => void;
  onStopSpeech?: () => void;
}

export default function FishVoiceGenerator({ onSpeak, onStopSpeech }: FishVoiceGeneratorProps) {
  const [message, setMessage] = useState("");
  const [selectedCelebrity, setSelectedCelebrity] = useState<string>("donald-trump");
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [celebrities, setCelebrities] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch available celebrities on mount
  useEffect(() => {
    fetch("/api/fish-audio/generate")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.celebrities) {
          setCelebrities(data.celebrities);
        }
      })
      .catch((err) => console.error("Failed to load celebrities:", err));
  }, []);

  const handleGenerate = async () => {
    if (!message.trim()) {
      setStatus("❌ Please enter a message");
      return;
    }

    setIsGenerating(true);
    setStatus("🎙️ Generating celebrity voice...");
    onStopSpeech?.();

    try {
      const response = await fetch("/api/fish-audio/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: message,
          celebrityId: selectedCelebrity,
          format: "mp3",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate audio");
      }

      // Create audio blob URL
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setStatus("✅ Voice generated successfully!");

      // Auto-play
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (error: any) {
      console.error("Fish Audio generation error:", error);
      setStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = `${selectedCelebrity}-${Date.now()}.mp3`;
      a.click();
    }
  };

  const celebrityOptions = [
    { id: "donald-trump", name: "Donald Trump 🇺🇸", emoji: "🎤" },
    { id: "amitabh-bachchan", name: "Amitabh Bachchan 🇮🇳", emoji: "🎬" },
  ];

  return (
    <div style={{
      background: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(20px)",
      borderRadius: "30px",
      padding: "40px",
      border: "1px solid rgba(255, 255, 255, 0.05)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "15px",
        marginBottom: "30px",
      }}>
        <div style={{
          fontSize: "3rem",
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          padding: "15px",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          🐟
        </div>
        <div>
          <h2 style={{
            color: "white",
            fontSize: "1.8rem",
            fontWeight: "900",
            marginBottom: "5px",
          }}>
            Hume.ai Emotional Voice
          </h2>
          <p style={{
            color: "#94a3b8",
            fontSize: "0.9rem",
          }}>
            Generate messages with emotional AI voices
          </p>
        </div>
      </div>

      {/* Celebrity Selection */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{
          display: "block",
          color: "#f1f5f9",
          fontWeight: "700",
          marginBottom: "12px",
          fontSize: "0.95rem",
        }}>
          Select Celebrity Voice
        </label>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
        }}>
          {celebrityOptions.map((celeb) => (
            <button
              key={celeb.id}
              onClick={() => setSelectedCelebrity(celeb.id)}
              style={{
                padding: "18px",
                background: selectedCelebrity === celeb.id
                  ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                border: selectedCelebrity === celeb.id
                  ? "2px solid #818cf8"
                  : "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                color: "white",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>{celeb.emoji}</span>
              {celeb.name}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div style={{ marginBottom: "25px" }}>
        <label style={{
          display: "block",
          color: "#f1f5f9",
          fontWeight: "700",
          marginBottom: "12px",
          fontSize: "0.95rem",
        }}>
          Your Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g., Happy Birthday John! You're doing a tremendous job!"
          maxLength={5000}
          style={{
            width: "100%",
            minHeight: "120px",
            padding: "18px",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: "16px",
            color: "white",
            fontSize: "1rem",
            fontFamily: "inherit",
            resize: "vertical",
            outline: "none",
          }}
        />
        <div style={{
          color: "#94a3b8",
          fontSize: "0.85rem",
          marginTop: "8px",
          textAlign: "right",
        }}>
          {message.length} / 5000 characters
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !message.trim()}
        style={{
          width: "100%",
          padding: "18px",
          background: isGenerating
            ? "rgba(99, 102, 241, 0.3)"
            : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
          border: "none",
          borderRadius: "16px",
          color: "white",
          fontSize: "1.1rem",
          fontWeight: "900",
          cursor: isGenerating ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          boxShadow: "0 10px 30px rgba(99, 102, 241, 0.4)",
          marginBottom: "20px",
        }}
      >
        {isGenerating ? "🎙️ Generating..." : "🐟 Generate Voice"}
      </button>

      {/* Status */}
      {status && (
        <div style={{
          padding: "15px",
          background: status.includes("✅")
            ? "rgba(34, 197, 94, 0.1)"
            : status.includes("❌")
            ? "rgba(239, 68, 68, 0.1)"
            : "rgba(99, 102, 241, 0.1)",
          border: `1px solid ${status.includes("✅")
            ? "rgba(34, 197, 94, 0.3)"
            : status.includes("❌")
            ? "rgba(239, 68, 68, 0.3)"
            : "rgba(99, 102, 241, 0.3)"}`,
          borderRadius: "12px",
          color: "#f1f5f9",
          fontWeight: "600",
          marginBottom: "20px",
        }}>
          {status}
        </div>
      )}

      {/* Audio Player */}
      {audioUrl && (
        <div style={{
          padding: "25px",
          background: "rgba(99, 102, 241, 0.1)",
          borderRadius: "20px",
          border: "1px solid rgba(99, 102, 241, 0.3)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "15px",
          }}>
            <span style={{
              color: "white",
              fontWeight: "700",
              fontSize: "1rem",
            }}>
              🎧 Generated Audio
            </span>
            <button
              onClick={handleDownload}
              style={{
                padding: "10px 20px",
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "12px",
                color: "#22c55e",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              💾 Download
            </button>
          </div>
          <audio
            ref={audioRef}
            controls
            style={{
              width: "100%",
              borderRadius: "12px",
            }}
          />
        </div>
      )}

      {/* Info Box */}
      <div style={{
        marginTop: "30px",
        padding: "20px",
        background: "rgba(99, 102, 241, 0.05)",
        borderRadius: "16px",
        border: "1px dashed rgba(99, 102, 241, 0.2)",
      }}>
        <h4 style={{
          color: "#818cf8",
          fontSize: "0.95rem",
          fontWeight: "800",
          marginBottom: "10px",
        }}>
          ℹ️ How it Works
        </h4>
        <ul style={{
          color: "#94a3b8",
          fontSize: "0.85rem",
          lineHeight: "1.6",
          paddingLeft: "20px",
        }}>
          <li>Get your Hume.ai API key from <a href="https://beta.hume.ai" target="_blank" style={{ color: "#818cf8" }}>beta.hume.ai</a> (Already configured!)</li>
          <li>Using Hume.ai's emotional voice synthesis for realistic speech</li>
          <li>Type your message and select a celebrity voice style</li>
          <li>Download or share the generated audio file</li>
          <li>Optional: Mint generated audio as NFT on Monad blockchain</li>
        </ul>
      </div>
    </div>
  );
}
