"use client";
import { useState, useEffect, useRef } from "react";
import { useWallet } from "../context/WalletContext";
import { getExplorerTxUrl } from "../lib/monad";
import { VoiceAgent } from "../api/voice-agents/route";
import VoiceGenerator from "./VoiceGenerator";
import CelebrityVoiceUpload from "./CelebrityVoiceUpload";

/** Marketplace treasury — replace with your Monad Testnet address for Blitz demos */
const MARKETPLACE_TREASURY =
  process.env.NEXT_PUBLIC_MARKETPLACE_TREASURY ||
  "0x000000000000000000000000000000000000dEaD";

export default function VoiceAgentMarketplace({ onSelectAgent, onStopSpeech }: { onSelectAgent: (agent: VoiceAgent) => void, onStopSpeech?: () => void }) {
  const { address, connected, sendMon } = useWallet();
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeGeneratorAgent, setActiveGeneratorAgent] = useState<VoiceAgent | null>(null);
  const [showCreateNFT, setShowCreateNFT] = useState(false);

  const [ownedAgents, setOwnedAgents] = useState<string[]>([]);

  // Real Fish Audio previews: cached blob URLs + per-card state
  const sampleCache = useRef<Record<string, string>>({});
  const sampleAudio = useRef<HTMLAudioElement | null>(null);
  const [sampleState, setSampleState] = useState<Record<string, "loading" | "playing">>({});
  const [sampleEngine, setSampleEngine] = useState<Record<string, string>>({});

  /** Map a marketplace agent to a Fish voice (explicit model ID wins). */
  const fishVoiceFor = (agent: VoiceAgent): { celebrityId?: string; referenceId?: string } => {
    if (agent.referenceId && agent.referenceId.trim()) return { referenceId: agent.referenceId.trim() };
    const n = `${agent.name} ${agent.celebrityName || ""} ${agent.voiceId || ""} ${agent.id}`.toLowerCase();
    if (n.includes("modi")) return { celebrityId: "narendra-modi" };
    if (n.includes("bachchan") || n.includes("big b")) return { celebrityId: "amitabh-bachchan" };
    if (n.includes("trump")) return { celebrityId: "donald-trump" };
    return { celebrityId: "custom" };
  };

  const browserFallback = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
    }
  };

  const playSample = async (agent: VoiceAgent) => {
    onStopSpeech?.();
    sampleAudio.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    const msg = `Hello, I am ${agent.celebrityName || agent.name}. ${agent.description.slice(0, 120)}`;

    // Replay cached Fish sample instantly
    const cached = sampleCache.current[agent.id];
    if (cached) {
      const el = sampleAudio.current ?? new Audio();
      sampleAudio.current = el;
      el.src = cached;
      setSampleState((s) => ({ ...s, [agent.id]: "playing" }));
      el.onended = () => setSampleState((s) => {
        const c = { ...s };
        delete c[agent.id];
        return c;
      });
      await el.play().catch(() => undefined);
      return;
    }

    setSampleState((s) => ({ ...s, [agent.id]: "loading" }));
    try {
      const res = await fetch("/api/fish-audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg, format: "mp3", ...fishVoiceFor(agent) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({} as any))).error || "Fish TTS failed");
      const note = res.headers.get("X-Aawaz-Voice-Note");
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error("Empty audio");
      const url = URL.createObjectURL(blob);
      sampleCache.current[agent.id] = url;
      const el = sampleAudio.current ?? new Audio();
      sampleAudio.current = el;
      el.src = url;
      setSampleEngine((s) => ({ ...s, [agent.id]: note ? `🐟 Fish Audio · ${note}` : "🐟 Fish Audio" }));
      setSampleState((s) => ({ ...s, [agent.id]: "playing" }));
      el.onended = () => setSampleState((s) => {
        const c = { ...s };
        delete c[agent.id];
        return c;
      });
      await el.play().catch(() => undefined);
    } catch (e) {
      // No key / voice not configured → honest browser demo voice
      console.warn("Fish sample failed, browser fallback:", e);
      setSampleEngine((s) => ({ ...s, [agent.id]: "🔊 browser demo — add FISH_AUDIO_API_KEY for real voice" }));
      setSampleState((s) => {
        const c = { ...s };
        delete c[agent.id];
        return c;
      });
      browserFallback(msg);
    }
  };

  useEffect(() => {
    fetchAgents();
    // Load ownership from local storage
    const storedOwnership = localStorage.getItem("aawaz_owned_agents");
    if (storedOwnership) {
      try {
        setOwnedAgents(JSON.parse(storedOwnership));
      } catch (e) {
        console.error("Failed to parse owned agents:", e);
        setOwnedAgents([]);
      }
    }
  }, [category, search, sortBy]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append("category", category);
      if (search) params.append("search", search);
      params.append("sort", sortBy);

      const response = await fetch(`/api/voice-agents?${params.toString()}`);
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (agent: VoiceAgent) => {
    if (!connected || !address) {
      alert("Please connect MetaMask to purchase");
      return;
    }

    if (confirm(`Purchase "${agent.name}" for ${agent.price} MON?`)) {
      try {
        const hash = await sendMon(MARKETPLACE_TREASURY, agent.price);

        await fetch("/api/voice-agents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: agent.id, action: "purchase" }),
        });

        const newAgents = agents.map((a) =>
          a.id === agent.id ? { ...a, sales: a.sales + 1 } : a
        );
        setAgents(newAgents);

        const newOwned = [...ownedAgents, agent.id];
        setOwnedAgents(newOwned);
        localStorage.setItem("aawaz_owned_agents", JSON.stringify(newOwned));

        alert(`✅ Purchased! Tx: ${hash.slice(0, 10)}...\n${getExplorerTxUrl(hash)}`);
      } catch (error: any) {
        console.error("Purchase failed:", error);
        alert(`Purchase failed: ${error.message}`);
      }
    }
  };

  const [verifying, setVerifying] = useState(false);

  const handleGenerateClick = (agent: VoiceAgent) => {
    setVerifying(true);
    // Simulate NFT verification
    setTimeout(() => {
      setVerifying(false);
      setActiveGeneratorAgent(agent);
    }, 2000);
  };

  return (
    <div>
      {verifying && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(2, 6, 23, 0.95)',
          backdropFilter: 'blur(30px)',
          color: 'white'
        }}>
          <div style={{ fontSize: '5rem', animation: 'float 2s infinite ease-in-out' }}>🛡️</div>
          <h2 style={{ marginTop: '30px', fontSize: "2.5rem", fontWeight: "900", letterSpacing: "-1px" }}>Verifying NFT Ownership...</h2>
          <p style={{ color: '#6366f1', fontWeight: "800", marginTop: "10px" }}>Securing connection...</p>
        </div>
      )}

      {/* Create Your Own Voice NFT Section */}
      <div style={{
        marginBottom: "2rem",
        padding: "25px",
        background: "linear-gradient(135deg, rgba(30, 30, 30, 0.4) 0%, rgba(50, 50, 50, 0.3) 100%)",
        borderRadius: "25px",
        border: "2px solid rgba(100, 100, 100, 0.3)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showCreateNFT ? "20px" : "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "2.5rem" }}>🎬</span>
            <div>
              <h3 style={{ color: "white", fontSize: "1.6rem", fontWeight: "900", marginBottom: "5px", letterSpacing: "-0.5px" }}>
                Create Your Own Voice NFT
              </h3>
              <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                Upload celebrity voice samples and mint them as NFTs
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onStopSpeech?.();
              setShowCreateNFT(!showCreateNFT);
            }}
            style={{
              padding: "12px 25px",
              background: showCreateNFT ? "rgba(239, 68, 68, 0.2)" : "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
              border: showCreateNFT ? "1px solid rgba(239, 68, 68, 0.3)" : "none",
              borderRadius: "15px",
              color: "white",
              fontWeight: "800",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s ease"
            }}
          >
            {showCreateNFT ? "✕ Close" : "➕ Create NFT"}
          </button>
        </div>
        {showCreateNFT && (
          <div style={{ marginTop: "20px", animation: "fadeIn 0.3s ease" }}>
            <CelebrityVoiceUpload onStopSpeech={onStopSpeech} />
          </div>
        )}
      </div>

      {/* Explore New Voices Banner */}
      <div style={{
        marginBottom: "2rem",
        padding: "30px",
        background: "linear-gradient(135deg, rgba(50, 50, 50, 0.3) 0%, rgba(70, 70, 70, 0.2) 100%)",
        borderRadius: "25px",
        border: "2px solid rgba(100, 100, 100, 0.3)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "15px" }}>
          <span style={{ fontSize: "3rem" }}>🎙️</span>
          <div>
            <h3 style={{ color: "white", fontSize: "1.8rem", fontWeight: "900", marginBottom: "8px", letterSpacing: "-0.5px" }}>
              🎉 Explore New Celebrity Voices
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: "1.5" }}>
              Discover premium AI voice models trained on iconic personalities. Generate custom messages in celebrity voices!
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              onStopSpeech?.();
              setCategory("Iconic");
            }}
            style={{
              padding: "12px 25px",
              background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
              border: "none",
              borderRadius: "15px",
              color: "white",
              fontWeight: "800",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
              transition: "all 0.3s ease"
            }}
          >
            ⭐ View Celebrity Voices
          </button>
          <button
            onClick={() => {
              onStopSpeech?.();
              setCategory("Entertainment");
            }}
            style={{
              padding: "12px 25px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "15px",
              color: "white",
              fontWeight: "800",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            🎬 Entertainment
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search voice agents..."
          value={search}
          onChange={(e) => {
            onStopSpeech?.();
            setSearch(e.target.value);
          }}
          onClick={() => onStopSpeech?.()}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "1rem 1.5rem",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "white",
            fontSize: "1rem",
            outline: "none",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            fontFamily: "'Outfit', sans-serif"
          }}
        />
        <select
          value={category}
          onChange={(e) => {
            onStopSpeech?.();
            setCategory(e.target.value);
          }}
          onClick={() => onStopSpeech?.()}
          style={{
            padding: "1rem 1.5rem",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "white",
            fontSize: "1rem",
            outline: "none",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            cursor: "pointer"
          }}
        >
          <option value="" style={{ background: "#0f172a" }}>All Categories</option>
          <option value="General" style={{ background: "#0f172a" }}>General</option>
          <option value="Business" style={{ background: "#0f172a" }}>Business</option>
          <option value="Casual" style={{ background: "#0f172a" }}>Casual</option>
          <option value="Educational" style={{ background: "#0f172a" }}>Educational</option>
          <option value="Entertainment" style={{ background: "#0f172a" }}>🎬 Entertainment</option>
          <option value="Iconic" style={{ background: "#0f172a" }}>⭐ Iconic (Celebrity)</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => {
            onStopSpeech?.();
            setSortBy(e.target.value);
          }}
          onClick={() => onStopSpeech?.()}
          style={{
            padding: "1rem 1.5rem",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(15, 23, 42, 0.6)",
            color: "white",
            fontSize: "1rem",
            outline: "none",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            cursor: "pointer"
          }}
        >
          <option value="newest" style={{ background: "#0f172a" }}>Newest</option>
          <option value="price_asc" style={{ background: "#0f172a" }}>Price: Low to High</option>
          <option value="price_desc" style={{ background: "#0f172a" }}>Price: High to Low</option>
          <option value="rating" style={{ background: "#0f172a" }}>Highest Rated</option>
        </select>
      </div>

      {/* Agents Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          ⏳ Loading voice agents...
        </div>
      ) : agents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", background: "rgba(239, 68, 68, 0.05)", borderRadius: "20px", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h3 style={{ color: "white", marginBottom: "10px" }}>Marketplace Unavailable</h3>
          <p>No voice agents found or server is down. Please verify your connection or restart the server.</p>
          <button
            onClick={() => fetchAgents()}
            style={{ marginTop: "20px", padding: "0.8rem 1.5rem", background: "#6366f1", border: "none", borderRadius: "12px", color: "white", cursor: "pointer", fontWeight: "800" }}
          >
            🔄 Retry Connection
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {agents.map((agent, idx) => {
            const isOwned = ownedAgents.includes(agent.id) || agent.price === 0; // Free agents are owned
            const isCelebrity = agent.voiceStyle === "Iconic" || agent.celebrityName;
            return (
              <div
                key={agent.id}
                style={{
                  backgroundColor: isCelebrity ? "rgba(60, 60, 60, 0.4)" : "rgba(15, 23, 42, 0.6)",
                  borderRadius: "30px",
                  padding: "2rem",
                  border: isCelebrity ? "2px solid rgba(120, 120, 120, 0.5)" : "1px solid rgba(255,255,255,0.05)",
                  boxShadow: isCelebrity ? "0 20px 50px rgba(0, 0, 0, 0.6)" : "0 15px 40px rgba(0,0,0,0.3)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  backdropFilter: "blur(20px)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.2rem"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-10px) scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 30px 60px rgba(79, 70, 229, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.3)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                }}
              >
                {/* Visual Enrichment: Header Image/Icon */}
                <div style={{
                  width: "100%",
                  height: "140px",
                  background: isCelebrity 
                    ? `linear-gradient(135deg, #4a5568, #2d3748)` 
                    : `linear-gradient(135deg, ${idx % 2 === 0 ? "#374151, #1f2937" : "#4a5568, #2d3748"})`,
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "4rem",
                  marginBottom: "1rem",
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.2)",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.1)", backdropFilter: "blur(2px)" }} />
                  <span style={{ position: "relative", zIndex: 1 }}>{isCelebrity ? "🌟" : agent.category === "Entertainment" ? "🎬" : agent.category === "Business" ? "💼" : "👤"}</span>
                  {isCelebrity && (
                    <div style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "rgba(255, 215, 0, 0.9)",
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "0.75rem",
                      fontWeight: "900",
                      color: "#000",
                      boxShadow: "0 4px 15px rgba(255, 215, 0, 0.4)",
                      zIndex: 2
                    }}>
                      ⭐ CELEBRITY
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <h4 style={{ fontSize: "1.5rem", fontWeight: "900", color: "white", margin: 0, letterSpacing: "-0.5px" }}>
                    {agent.name}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <span
                      style={{
                        padding: "0.4rem 1rem",
                        backgroundColor: "rgba(99, 102, 241, 0.15)",
                        color: "#a5b4fc",
                        borderRadius: "15px",
                        fontSize: "0.8rem",
                        fontWeight: "800",
                        border: "1px solid rgba(99, 102, 241, 0.2)"
                      }}
                    >
                      {agent.category}
                    </span>
                    {agent.nftMintAddress && <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 'bold' }}>NFT VERIFIED</span>}
                  </div>
                </div>

                <p style={{ color: "#94a3b8", fontSize: "1rem", lineHeight: "1.6", minHeight: "60px" }}>
                  {agent.description}
                </p>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "1.2rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.95rem", color: "#818cf8", fontWeight: "900" }}>⭐ {agent.rating.toFixed(1)}</div>
                  <div style={{ fontSize: "1.1rem", color: "white", fontWeight: "900" }}>{agent.price} MON</div>
                </div>

                {/* Sample player row */}
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  padding: "12px 14px",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "1px solid rgba(255,255,255,0.05)"
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playSample(agent);
                    }}
                    disabled={sampleState[agent.id] === "loading"}
                    title={sampleState[agent.id] === "playing" ? "Replay sample" : "Play voice sample"}
                    style={{
                      minWidth: "38px",
                      width: "38px",
                      height: "38px",
                      borderRadius: "50%",
                      background: sampleState[agent.id] === "loading" ? "#475569" : "linear-gradient(135deg,#6366f1,#a855f7)",
                      border: "none",
                      color: "white",
                      cursor: sampleState[agent.id] === "loading" ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.85rem",
                      boxShadow: "0 6px 16px rgba(99,102,241,0.35)"
                    }}>{sampleState[agent.id] === "loading" ? "⏳" : "▶"}</button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: "white", fontSize: "0.82rem", fontWeight: 800 }}>Voice sample</div>
                    <div style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      marginTop: "2px",
                      color: !sampleEngine[agent.id] ? "#64748b" : sampleEngine[agent.id].startsWith("🐟") ? "#34d399" : "#fbbf24",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {sampleEngine[agent.id] || "tap ▶ to preview"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {!isOwned ? (
                    <button
                      onClick={() => { onStopSpeech?.(); handlePurchase(agent); }}
                      disabled={!connected}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        background: connected ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "#475569",
                        color: "white",
                        border: "none",
                        borderRadius: "15px",
                        fontSize: "1rem",
                        fontWeight: "900",
                        cursor: connected ? "pointer" : "not-allowed",
                        boxShadow: connected ? "0 10px 20px rgba(99, 102, 241, 0.3)" : "none"
                      }}
                    >
                      🛍️ Buy Now
                    </button>
                  ) : (
                    <button
                      onClick={() => { onStopSpeech?.(); handleGenerateClick(agent); }}
                      style={{
                        width: "100%",
                        padding: "1rem",
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "15px",
                        fontSize: "1rem",
                        fontWeight: "900",
                        cursor: "pointer",
                        boxShadow: "0 10px 20px rgba(16, 185, 129, 0.2)"
                      }}
                    >
                      🎙️ Generate
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Voice Generator Modal */}
      {activeGeneratorAgent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <div style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ textAlign: 'right', padding: '0.5rem' }}>
              <button
                onClick={() => { onStopSpeech?.(); setActiveGeneratorAgent(null); }}
                style={{ color: 'white', fontWeight: 'bold' }}
              >
                Close
              </button>
            </div>
            <VoiceGenerator
              agent={activeGeneratorAgent}
            />
            <style jsx global>{`
                @keyframes wave {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}
