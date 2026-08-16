"use client";
import { useState, useRef, ReactNode, useEffect } from "react"; // Added useEffect

interface HyperliquidAgentProps {
    onSpeak?: (text: string) => void;
    onStopSpeech?: () => void;
    initialCommand?: string;
}

export default function HyperliquidAgent({ onSpeak, onStopSpeech, initialCommand }: HyperliquidAgentProps) {
    const [transcript, setTranscript] = useState("");
    const [textInput, setTextInput] = useState("");
    const [status, setStatus] = useState<ReactNode>("");
    const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // This block was provided as useState, but for side effects on mount, useEffect is appropriate.
    // Assuming the intent was useEffect based on the instruction "UseEffect to trigger parseTradeCommand on mount".
    useEffect(() => {
        if (initialCommand && !hasProcessedInitial) {
            setHasProcessedInitial(true);
            // Only trigger if it looks like a trade command
            const lower = initialCommand.toLowerCase();
            if (lower.includes("trade") || lower.includes("long") || lower.includes("short") || lower.includes("perp")) {
                // Note: setCommand and parseTradeCommand are not defined in the original code.
                // This change assumes these functions will be defined elsewhere or are placeholders.
                // For this specific change, we'll call processTrade directly as it's the existing trade processing function.
                // If setCommand and parseTradeCommand are meant to be new, they would need to be added.
                // For now, adapting to existing `processTrade`.
                setTextInput(initialCommand);
                processTrade(initialCommand);
            }
        }
    }, [initialCommand, hasProcessedInitial]); // Dependencies for useEffect

    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<"voice" | "text">("text");

    const processTrade = async (text: string) => {
        if (!text.trim()) return;
        setLoading(true);
        setStatus("🔍 Validating trade against risk rules...");
        onSpeak?.("Validating your trade against risk rules.");

        try {
            const res = await fetch("/api/hyperliquid/trade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });
            const data = await res.json();

            if (data.status === "APPROVED") {
                setStatus(
                    <div style={{ animation: "popIn 0.3s ease-out" }}>
                        <div style={{ color: "#10b981", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "10px" }}>
                            ✅ TRADE APPROVED
                        </div>
                        <div style={{ background: "#f0fdf4", padding: "15px", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.9rem" }}>
                                <strong>Asset:</strong> <span>{data.asset}</span>
                                <strong>Direction:</strong> <span style={{ color: data.direction === "LONG" ? "#10b981" : "#ef4444", fontWeight: 'bold' }}>{data.direction}</span>
                                <strong>Leverage:</strong> <span>{data.leverage}x</span>
                                <strong>Size:</strong> <span>{data.position_size_percent}%</span>
                                <strong>Stop Loss:</strong> <span>{data.stop_loss}</span>
                                <strong>TP:</strong> <span>{data.take_profit || "None"}</span>
                            </div>
                        </div>
                        <p style={{ marginTop: "15px", color: "#666", fontSize: "0.85rem" }}>
                            Trade instruction sent to decentralized executor.
                        </p>
                    </div>
                );
                onSpeak?.(`Trade approved! Opening a ${data.leverage}x ${data.direction} on ${data.asset}.`);
            } else {
                setStatus(
                    <div style={{ animation: "popIn 0.3s ease-out" }}>
                        <div style={{ color: "#ef4444", fontWeight: "bold", fontSize: "1.2rem", marginBottom: "10px" }}>
                            ❌ TRADE REJECTED
                        </div>
                        <div style={{ background: "#fef2f2", padding: "15px", borderRadius: "12px", border: "1px solid #fee2e2" }}>
                            <p style={{ margin: 0, fontWeight: "500" }}>{data.reason}</p>
                            <p style={{ marginTop: "10px", color: "#666", fontSize: "0.85rem", borderTop: "1px solid #fee2e2", paddingTop: "10px" }}>
                                💡 Suggestion: {data.suggestion}
                            </p>
                        </div>
                    </div>
                );
                onSpeak?.(`Trade rejected. ${data.reason}.`);
            }
        } catch (e) {
            setStatus(
                <div style={{ color: "#ef4444", padding: "12px", background: "#fef2f2", borderRadius: "8px" }}>
                    Failed to connect to trading engine.
                </div>
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processTrade(textInput);
        setTextInput("");
    };

    const startListening = () => {
        onStopSpeech?.();
        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setStatus(<div style={{ color: "#ef4444" }}>❌ Speech recognition not supported in this browser. Please use text input.</div>);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            setIsListening(true);
            setStatus("🎤 Listening... Speak your trade command");
        };

        recognition.onresult = async (e: any) => {
            const text = e.results[0][0].transcript;
            setTranscript(text);
            setIsListening(false);
            await processTrade(text);
        };

        recognition.onerror = (e: any) => {
            setIsListening(false);
            setStatus(<div style={{ color: "#ef4444" }}>❌ Voice error: {e.error}</div>);
        };

        recognition.onend = () => setIsListening(false);

        recognition.start();
        recognitionRef.current = recognition;
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    };

    return (
        <div className="hyperliquid-wrapper">
            <p style={{ color: "#666", marginBottom: "20px" }}>
                Voice-to-JSON Perpetual Trading Agent. Execute trades on Hyperliquid with strict 5x leverage & 1% risk limits.
            </p>

            <div className="agent-ui">
                <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                        <button
                            onClick={() => { onStopSpeech?.(); setMode("text"); }}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "20px",
                                border: "none",
                                background: mode === "text" ? "#6366f1" : "#f3f4f6",
                                color: mode === "text" ? "white" : "#666",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            ⌨️ Keyboard
                        </button>
                        <button
                            onClick={() => { onStopSpeech?.(); setMode("voice"); }}
                            style={{
                                padding: "8px 20px",
                                borderRadius: "20px",
                                border: "none",
                                background: mode === "voice" ? "#6366f1" : "#f3f4f6",
                                color: mode === "voice" ? "white" : "#666",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            🎤 Voice
                        </button>
                    </div>

                    {mode === "text" ? (
                        <form onSubmit={handleTextSubmit} style={{ display: "flex", gap: "10px" }}>
                            <input
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder="e.g. 'Long SOL 3x leverage risk 1% stop 140'"
                                style={{
                                    flex: 1,
                                    padding: "12px 20px",
                                    borderRadius: "12px",
                                    border: "1px solid #e5e7eb",
                                    fontSize: "1rem"
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    padding: "0 25px",
                                    background: "#10b981",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "12px",
                                    fontWeight: "bold",
                                    cursor: "pointer"
                                }}
                            >
                                Execute
                            </button>
                        </form>
                    ) : (
                        <div style={{
                            padding: "30px",
                            background: "#f8fafc",
                            borderRadius: "15px",
                            textAlign: "center",
                            border: "2px dashed #e2e8f0"
                        }}>
                            <button
                                style={{
                                    fontSize: "3rem",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    animation: "float 2s infinite"
                                }}
                                onClick={() => {
                                    onStopSpeech?.();
                                    isListening ? stopListening() : startListening();
                                }}
                            >
                                {isListening ? "⏹️" : "🎙️"}
                            </button>
                            <p style={{ marginTop: "10px", color: "#666" }}>
                                {isListening ? "Listening... click to stop" : "Click to speak trade command"}
                            </p>
                            {transcript && (
                                <p style={{ marginTop: "10px", color: "#333", fontWeight: "600" }}>"{transcript}"</p>
                            )}
                        </div>
                    )}
                </div>

                {status && (
                    <div style={{
                        marginTop: "20px",
                        padding: "20px",
                        background: "white",
                        borderRadius: "15px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                        border: "1px solid #f1f5f9"
                    }}>
                        {status}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
        </div>
    );
}
