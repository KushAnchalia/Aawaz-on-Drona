"use client";
import { useState, useEffect } from "react";

interface NetworkAnalyzerProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
}

export default function NetworkAnalyzer({ onSpeak, onStopSpeech }: NetworkAnalyzerProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [lastSpoken, setLastSpoken] = useState(0);
    const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");

    const fetchStats = async (isManual = false, targetNetwork = network) => {
        if (isManual) setLoading(true);
        try {
            const res = await fetch(`/api/network/status?network=${targetNetwork}`);
            const data = await res.json();
            setStats(data);

            // Speak only on manual refresh or first load to avoid polling noise
            if (isManual || lastSpoken === 0) {
                const statusText = `${data.network} is currently ${data.congestionLevel}, with ${data.tps ? data.tps.toLocaleString() + " tx/s" : "N/A"} throughput and ${data.averageFee} gwei priority fees.`;
                onSpeak?.(statusText);
                setLastSpoken(Date.now());
            }
        } catch (e) {
            console.error(e);
        } finally {
            if (isManual) setLoading(false);
            else setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats(false, network);
        const interval = setInterval(() => fetchStats(false, network), 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [network]);

    if (loading && !stats) return <div style={{ color: "#94a3b8", fontWeight: "bold" }}>⏳ Synchronizing Monad Network data...</div>;

    const congestionColor = stats?.congestionLevel === "LOW" ? "#10b981" : stats?.congestionLevel === "MEDIUM" ? "#f59e0b" : "#ef4444";
    const congestionText = stats?.congestionLevel === "LOW" ? "NORMAL" : stats?.congestionLevel;
    const deployAdvice = stats?.congestionLevel === "HIGH" ? "⚠️ Wait for drop" : "🚀 Ready to deploy!";
    const networkLabel = stats?.network || (network === "mainnet" ? "Monad Mainnet" : "Monad Testnet");

    const toggleButton = (target: "testnet" | "mainnet") => ({
        padding: "10px 20px",
        borderRadius: "12px",
        border: "none",
        cursor: "pointer",
        fontWeight: "900",
        fontSize: "0.9rem",
        background: network === target ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "rgba(55, 65, 81, 0.4)",
        color: "white",
        transition: "all 0.3s",
        boxShadow: network === target ? "0 8px 16px rgba(99, 102, 241, 0.4)" : "none"
    });

    return (
        <div>
            {/* Network Toggle */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "25px", alignItems: "center" }}>
                <button
                    onClick={() => { onStopSpeech?.(); setNetwork("testnet"); setLoading(true); }}
                    style={toggleButton("testnet")}
                >
                    🧪 Monad Testnet
                </button>
                <button
                    onClick={() => { onStopSpeech?.(); setNetwork("mainnet"); setLoading(true); }}
                    style={toggleButton("mainnet")}
                >
                    🌐 Monad Mainnet
                </button>
                <span style={{ color: "#94a3b8", fontSize: "0.85rem", marginLeft: "auto" }}>
                    Chain ID: {stats?.chainId ?? (network === "mainnet" ? 143 : 10143)}
                </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>

                {/* TPS Card */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Current TPS</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "900", color: "white", letterSpacing: "-1px" }}>
                        {stats.tps ? stats.tps.toLocaleString() : "—"}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#10b981", marginTop: "10px", fontWeight: "700" }}>{networkLabel}</div>
                </div>

                {/* Congestion Card */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Network Congestion</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "900", color: congestionColor, letterSpacing: "-1px" }}>
                        {congestionText}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "10px" }}>Traffic load is stable</div>
                </div>

                {/* Fees Card */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Priority Fee (Avg)</h3>
                    <div style={{ fontSize: "3rem", fontWeight: "900", color: "#f1f5f9", letterSpacing: "-1px" }}>
                        {stats.averageFee?.toLocaleString() ?? "—"}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#94a3b8", marginTop: "10px" }}>gwei / unit</div>
                </div>

                {/* Recommendation Card */}
                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "30px", borderRadius: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "#94a3b8", marginBottom: "10px", fontWeight: "800" }}>Deploy Advice</h3>
                    <div style={{ fontSize: "1.4rem", fontWeight: "900", margin: "10px 0", color: "white" }}>
                        {deployAdvice}
                    </div>
                    <button
                        style={{
                            width: "100%",
                            padding: "15px",
                            borderRadius: "15px",
                            border: "none",
                            background: "linear-gradient(135deg, #374151 0%, #1f2937 100%)",
                            color: "white",
                            fontWeight: "900",
                            cursor: "pointer",
                            boxShadow: "0 10px 20px rgba(0, 0, 0, 0.4)",
                            transition: "all 0.3s"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-3px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                        onClick={() => { onStopSpeech?.(); fetchStats(true); }}
                    >
                        Refresh Status ⚡
                    </button>
                </div>

            </div>
        </div>
    );
}