"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function VoiceAgentCreator() {
  const { address, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0.1");
  const [category, setCategory] = useState("General");
  const [uploading, setUploading] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [status, setStatus] = useState("");
  const [mintedAddress, setMintedAddress] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMint = async () => {
    if (!address || !file) {
      alert("Please connect MetaMask and select a file");
      return;
    }

    try {
      setUploading(true);
      setStatus("⏳ Uploading to IPFS...");

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          name,
          description,
          chain: "monad-testnet",
          attributes: [
            { trait_type: "Voice", value: "Custom" },
            { trait_type: "Category", value: category },
            { trait_type: "Creator", value: address },
          ],
        })
      );

      const uploadRes = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success && !uploadData.uri) {
        throw new Error("Upload failed: " + (uploadData.error || "Unknown error"));
      }

      setUploading(false);
      setRegistering(true);
      setStatus("⏳ Publishing voice listing on Monad marketplace...");

      const voiceId = `monad-${Date.now()}-${address.slice(2, 10)}`;
      setMintedAddress(voiceId);

      const regRes = await fetch("/api/voice-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: parseFloat(price),
          creator: address,
          prompt: "Custom Voice Agent",
          category,
          voiceStyle: "Custom",
          nftMintAddress: voiceId,
          image: uploadData.imageUri,
          voiceId,
          chain: "monad-testnet",
        }),
      });

      if (!regRes.ok) throw new Error("Backend registration failed.");

      setStatus("✅ Voice listing published on Monad!");
      alert("Voice agent published successfully on Monad Testnet marketplace!");

      setName("");
      setDescription("");
      setFile(null);
      setPrice("0.1");
    } catch (error: any) {
      console.error("Publish error:", error);
      setStatus(`❌ Error: ${error.message}`);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setRegistering(false);
    }
  };

  return (
    <div
      style={{
        padding: "1.5rem",
        backgroundColor: "#f9fafb",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
      }}
    >
      <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#333" }}>
        🎙️ Create Voice Listing (Monad)
      </h3>

      {!connected ? (
        <div
          style={{
            textAlign: "center",
            padding: "1rem",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            color: "#92400e",
          }}
        >
          Please connect MetaMask to create a voice listing.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>
              Voice Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              placeholder="e.g. My Custom Voice"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              rows={3}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>
              Price (MON)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
              step="0.01"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            >
              <option>General</option>
              <option>Celebrity</option>
              <option>Narration</option>
              <option>Community</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "500", color: "#333", marginBottom: "0.5rem" }}>
              Voice Sample / Image
            </label>
            <input type="file" onChange={handleFileChange} />
          </div>

          <button
            onClick={handleMint}
            disabled={uploading || registering || !name || !file}
            style={{
              padding: "0.9rem",
              borderRadius: "10px",
              border: "none",
              background: "#836EF9",
              color: "white",
              fontWeight: 800,
              cursor: uploading || registering ? "not-allowed" : "pointer",
              opacity: uploading || registering ? 0.7 : 1,
            }}
          >
            {uploading || registering ? "Publishing..." : "Publish on Monad"}
          </button>

          {status && <div style={{ fontSize: "0.9rem", color: "#334155" }}>{status}</div>}
          {mintedAddress && (
            <div style={{ fontSize: "0.8rem", color: "#64748b", wordBreak: "break-all" }}>
              Listing ID: {mintedAddress}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
