"use client";
import { useState } from "react";

interface SmartContractOptimizerProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
}

export default function SmartContractOptimizer({ onSpeak, onStopSpeech }: SmartContractOptimizerProps) {
    const [code, setCode] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAudit = async () => {
        if (!code.trim()) return;
        setLoading(true);
        setResult(null);
        onSpeak?.("Starting security and optimization audit.");
        try {
            const res = await fetch("/api/contract/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();
            setResult(data);
            onSpeak?.("Audit complete. Your security score is " + data.score + " out of one hundred.");
        } catch (e) {
            alert("Audit failed");
            onSpeak?.("Audit failed. Please check the code format.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <p style={{ color: "#666", marginBottom: "20px" }}>
                Paste your Rust/Anchor code below for a security and gas optimization audit.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* Left: Input */}
                <div>
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// Paste your lib.rs code here..."
                        style={{
                            width: "100%",
                            height: "400px",
                            padding: "15px",
                            borderRadius: "12px",
                            border: "1px solid #e5e7eb",
                            fontFamily: "monospace",
                            fontSize: "0.9rem",
                            resize: "vertical"
                        }}
                    />
                    <button
                        onClick={() => { onStopSpeech?.(); handleAudit(); }}
                        disabled={loading || !code}
                        style={{
                            marginTop: "10px",
                            width: "100%",
                            padding: "12px",
                            background: "#f59e0b",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        {loading ? "Running Audit..." : "🔍 Run Security Audit"}
                    </button>
                </div>

                {/* Right: Output */}
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    {result ? (
                        <div>
                            <div style={{ marginBottom: "20px", textAlign: "center" }}>
                                <div style={{ fontSize: "1rem", color: "#666" }}>Security Score</div>
                                <div style={{
                                    fontSize: "3rem",
                                    fontWeight: "bold",
                                    color: result.score > 80 ? "#10b981" : result.score > 50 ? "#f59e0b" : "#ef4444"
                                }}>
                                    {result.score}/100
                                </div>
                            </div>

                            <h4 style={{ marginBottom: "10px", color: "#333" }}>🚨 Vulnerabilities Found</h4>
                            {result.vulnerabilities.length === 0 ? (
                                <p style={{ color: "#10b981" }}>No vulnerabilities detected.</p>
                            ) : (
                                <ul style={{ paddingLeft: "20px" }}>
                                    {result.vulnerabilities.map((v: any, i: number) => (
                                        <li key={i} style={{ marginBottom: "8px", color: v.severity === "HIGH" ? "#dc2626" : "#4b5563" }}>
                                            <strong>[{v.severity}]</strong> {v.message}
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <h4 style={{ marginTop: "20px", marginBottom: "10px", color: "#333" }}>💡 Optimization Suggestions</h4>
                            {result.suggestions.length === 0 ? (
                                <p style={{ color: "#666" }}>No specific optimizations found.</p>
                            ) : (
                                <ul style={{ paddingLeft: "20px" }}>
                                    {result.suggestions.map((s: string, i: number) => (
                                        <li key={i} style={{ marginBottom: "5px", color: "#059669" }}>{s}</li>
                                    ))}
                                </ul>
                            )}

                        </div>
                    ) : (
                        <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                            Results will appear here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
