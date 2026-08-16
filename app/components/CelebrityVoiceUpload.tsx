"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function CelebrityVoiceUpload({ onStopSpeech }: { onStopSpeech?: () => void }) {
  const { address, connected } = useWallet();
  const [celebrityName, setCelebrityName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("1.0");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);

      // Auto-stop after 5 minutes max
      setTimeout(() => {
        if (recording) {
          mediaRecorder.stop();
          setRecording(false);
        }
      }, 300000);
    } catch (error) {
      alert("Error accessing microphone. Please grant permissions.");
    }
  };

  const stopRecording = () => {
    setRecording(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStopSpeech?.();
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setExtracting(true);
      // Simulate extraction from video/audio
      setTimeout(() => {
        setExtracting(false);
        setAudioBlob(new Blob(["mock-extracted-audio"], { type: "audio/webm" }));
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !address) {
      alert("Please connect your wallet first");
      return;
    }

    if (!celebrityName || !audioBlob) {
      alert("Please provide celebrity name and record voice");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Step 1: Upload audio and create voice model
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice_recording.webm");
      formData.append("celebrityName", celebrityName);
      formData.append("description", description);

      // In production, this would:
      // 1. Upload audio to storage (IPFS/Arweave)
      // 2. Train/create voice model (ElevenLabs or custom)
      // 3. Get voiceId from the service

      // For now, create voiceId from name
      const voiceId = celebrityName.toLowerCase().replace(/\s+/g, "_");

      // Step 2: Create NFT metadata
      const nftResponse = await fetch("/api/voice-agents/mint-nft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet: address,
          voiceId,
          celebrityName,
          description,
          imageUrl: `https://via.placeholder.com/400?text=${encodeURIComponent(celebrityName)}`,
          usageType: "Personal",
          maxRequests: 1000,
        }),
      });

      if (!nftResponse.ok) {
        throw new Error("Failed to create NFT metadata");
      }

      // Step 3: Create voice agent listing
      const agentResponse = await fetch("/api/voice-agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `${celebrityName} Voice`,
          description,
          prompt: `You are ${celebrityName}. Speak in their distinctive voice and style.`,
          price: parseFloat(price),
          category: "Entertainment",
          voiceStyle: "Celebrity",
          creator: address,
          celebrityName,
          voiceId,
        }),
      });

      if (!agentResponse.ok) {
        throw new Error("Failed to create voice agent");
      }

      setSuccess(true);

      // Reset form
      setCelebrityName("");
      setDescription("");
      setPrice("1.0");
      setAudioBlob(null);

      setTimeout(() => setSuccess(false), 5000);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2.5rem", backgroundColor: "rgba(15, 23, 42, 0.4)", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}>
      <h3 style={{ fontSize: "2rem", marginBottom: "1.5rem", color: "white", fontWeight: "900", letterSpacing: "-1px" }}>
        🎬 Celebrity Voice Upload
      </h3>

      {!connected && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(245, 158, 11, 0.1)", borderRadius: "12px", color: "#fbbf24", marginBottom: "1.5rem", border: "1px solid rgba(245, 158, 11, 0.2)", fontWeight: "600" }}>
          ⚠️ Connect your wallet to upload celebrity voice
        </div>
      )}

      {success && (
        <div style={{ padding: "1rem", backgroundColor: "#d1fae5", borderRadius: "8px", color: "#065f46", marginBottom: "1rem" }}>
          ✅ Voice NFT created successfully! It's now available in the marketplace.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", color: "#cbd5e1" }}>
            Celebrity Name *
          </label>
          <input
            type="text"
            value={celebrityName}
            onChange={(e) => setCelebrityName(e.target.value)}
            onClick={() => onStopSpeech?.()}
            placeholder="e.g., Amitabh Bachchan"
            required
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: "1.05rem",
              fontFamily: "'Outfit', sans-serif"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", color: "#cbd5e1" }}>
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onClick={() => onStopSpeech?.()}
            placeholder="Describe the celebrity and their voice..."
            required
            rows={3}
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: "1.05rem",
              resize: "vertical",
              fontFamily: "'Outfit', sans-serif"
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "700", color: "#cbd5e1" }}>
            Price (MON) *
          </label>
          <input
            type="number"
            step="0.1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onClick={() => onStopSpeech?.()}
            required
            min="0"
            style={{
              width: "100%",
              padding: "1rem",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(15, 23, 42, 0.6)",
              color: "white",
              fontSize: "1.05rem",
              fontFamily: "'Outfit', sans-serif"
            }}
          />
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", marginBottom: "1rem", fontWeight: "700", color: "#cbd5e1" }}>
            Multimedia Upload (Video/Audio) or Record *
          </label>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{
              border: "2px dashed rgba(255,255,255,0.1)",
              borderRadius: "20px",
              padding: "20px",
              textAlign: "center",
              background: "rgba(15, 23, 42, 0.4)",
              position: "relative",
              transition: "all 0.3s"
            }}>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={handleFileUpload}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer"
                }}
              />
              <div style={{ fontSize: "2rem", marginBottom: "10px" }}>📁</div>
              <div style={{ fontWeight: "800", color: "white" }}>
                {fileName || "Click to upload Video/Audio file"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "5px" }}>
                We'll extract the voice automatically
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "15px", justifyContent: "center" }}>
              <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
              <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#6366f1" }}>OR RECORD LIVE</span>
              <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.1)" }} />
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              {!recording ? (
                <button
                  type="button"
                  onClick={() => { onStopSpeech?.(); startRecording(); }}
                  style={{
                    padding: "1rem 2.5rem",
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#fca5a5",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontWeight: "900",
                    transition: "all 0.3s"
                  }}
                >
                  🎤 Start Recording
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { onStopSpeech?.(); stopRecording(); }}
                  style={{
                    padding: "1rem 2.5rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "16px",
                    cursor: "pointer",
                    fontWeight: "900",
                    animation: "pulse 2s infinite"
                  }}
                >
                  ⏹️ Stop Recording
                </button>
              )}
            </div>
          </div>

          {extracting && (
            <div style={{ marginTop: "15px", padding: "1rem", backgroundColor: "rgba(99, 102, 241, 0.1)", borderRadius: "14px", color: "#a5b4fc", fontSize: "0.95rem", fontWeight: "700", textAlign: "center", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
              ⏳ Extracting high-quality voice patterns...
            </div>
          )}
          {recording && (
            <div style={{ marginTop: "15px", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "14px", color: "#fca5a5", fontSize: "0.95rem", fontWeight: "700", textAlign: "center", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
              🔴 Recording live... Speak clearly
            </div>
          )}
          {audioBlob && !recording && !extracting && (
            <div style={{ marginTop: "15px", padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: "14px", color: "#34d399", fontSize: "0.95rem", fontWeight: "700", textAlign: "center", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
              ✅ Audio ready for NFT generation!
            </div>
          )}
        </div>

        <button
          type="submit"
          onClick={() => onStopSpeech?.()}
          disabled={loading || !connected || !audioBlob}
          style={{
            width: "100%",
            padding: "1.2rem",
            backgroundColor: loading || !connected || !audioBlob ? "rgba(255,255,255,0.05)" : "#3b82f6",
            color: loading || !connected || !audioBlob ? "#475569" : "white",
            border: "none",
            borderRadius: "18px",
            fontSize: "1.1rem",
            fontWeight: "900",
            cursor: loading || !connected || !audioBlob ? "not-allowed" : "pointer",
            boxShadow: loading || !connected || !audioBlob ? "none" : "0 10px 20px rgba(59, 130, 246, 0.3)",
            transition: "all 0.3s"
          }}
        >
          {loading ? "⏳ Creating Voice NFT..." : "🚀 Mint Celebrity Voice NFT"}
        </button>
      </form>

      <div style={{ marginTop: "2rem", padding: "1.5rem", backgroundColor: "rgba(99, 102, 241, 0.05)", borderRadius: "18px", fontSize: "0.9rem", color: "#a5b4fc", border: "1px solid rgba(99, 102, 241, 0.1)" }}>
        <strong style={{ display: "block", marginBottom: "10px", fontSize: "1rem", color: "white" }}>📝 AI Extraction Instructions:</strong>
        <ol style={{ paddingLeft: "1.5rem", display: "flex", flexDirection: "column", gap: "8px", fontWeight: "500" }}>
          <li>Provide a high-quality video or audio source.</li>
          <li>Aawaz will isolate the primary voice patterns using the AI engine.</li>
          <li>Verify the extracted sample before minting your NFT.</li>
          <li>NFT holders will gain instant access to generate audio using this model.</li>
        </ol>
      </div>
    </div>
  );
}

