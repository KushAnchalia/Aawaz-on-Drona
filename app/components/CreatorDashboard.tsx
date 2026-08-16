"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";

export default function CreatorDashboard() {
  const { address, connected } = useWallet();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [mintedAddress, setMintedAddress] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleMint = async () => {
    if (!address || !file) return;

    try {
      setUploading(true);

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
            { trait_type: "Creator", value: address },
          ],
        })
      );

      const uploadRes = await fetch("/api/ipfs/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadData.success && !uploadData.uri) throw new Error("Upload failed");

      setUploading(false);
      setMinting(true);

      const voiceId = `monad-${Date.now()}-${address.slice(2, 10)}`;
      setMintedAddress(voiceId);

      await fetch("/api/voice-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price: price || "0.1",
          creator: address,
          prompt: "Custom Voice Agent",
          category: "Community",
          voiceStyle: "Custom",
          nftMintAddress: voiceId,
          image: uploadData.imageUri,
          chain: "monad-testnet",
        }),
      });

      alert("Voice listing published on Monad Testnet!");
    } catch (error: any) {
      console.error("Publish error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setUploading(false);
      setMinting(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Create Voice Listing (Monad)</h2>

      {!connected ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          Please connect MetaMask to create a voice listing.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Voice Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="e.g. My Custom Voice"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Describe the voice..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (MON)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="0.1"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input type="file" onChange={handleFileChange} className="w-full" />
          </div>

          <button
            onClick={handleMint}
            disabled={uploading || minting || !name || !file}
            className="w-full py-3 rounded-lg text-white font-bold"
            style={{ background: "#836EF9", opacity: uploading || minting ? 0.7 : 1 }}
          >
            {uploading || minting ? "Publishing..." : "Publish on Monad"}
          </button>

          {mintedAddress && (
            <p className="text-sm text-gray-500 break-all">Listing ID: {mintedAddress}</p>
          )}
        </div>
      )}
    </div>
  );
}
