"use client";
import { useState, useEffect, useRef } from "react";

interface VoiceCommandHubProps {
    onCommand?: (text: string) => void;
    onStopSpeech?: () => void;
    size?: "small" | "large";
}

export default function VoiceCommandHub({ onCommand, onStopSpeech, size = "large" }: VoiceCommandHubProps) {
    const [isListening, setIsListening] = useState(false);
    const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(10).fill(20));
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                recognitionRef.current.continuous = false;
                recognitionRef.current.interimResults = false;

                recognitionRef.current.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    console.log("Master Voice Command:", transcript);
                    onCommand?.(transcript);
                    setIsListening(false);
                };

                recognitionRef.current.onerror = () => setIsListening(false);
                recognitionRef.current.onend = () => setIsListening(false);
            }
        }
    }, [onCommand]);

    useEffect(() => {
        let interval: any;
        if (isListening) {
            interval = setInterval(() => {
                setVisualizerBars(prev => prev.map(() => Math.floor(Math.random() * 60) + 10));
            }, 100);
        } else {
            setVisualizerBars(new Array(10).fill(20));
        }
        return () => clearInterval(interval);
    }, [isListening]);

    const toggleListening = () => {
        onStopSpeech?.();
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setIsListening(true);
            recognitionRef.current.start();
        }
    };

    const isLarge = size === "large";

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
            <div
                onClick={toggleListening}
                style={{
                    width: isLarge ? "120px" : "60px",
                    height: isLarge ? "120px" : "60px",
                    borderRadius: "50%",
                    background: isListening ? "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)" : "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: isListening ? "0 0 30px rgba(239, 68, 68, 0.5)" : "0 15px 35px rgba(99, 102, 241, 0.3)",
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: isListening ? "scale(1.1)" : "scale(1)",
                    border: "4px solid white",
                    position: "relative"
                }}
            >
                <span style={{ fontSize: isLarge ? "3rem" : "1.5rem" }}>
                    {isListening ? "⏹️" : "🎙️"}
                </span>

                {isListening && (
                    <div style={{
                        position: "absolute",
                        top: "-10px",
                        left: "-10px",
                        right: "-10px",
                        bottom: "-10px",
                        borderRadius: "50%",
                        border: "2px solid #ef4444",
                        animation: "ping 1.5s infinite"
                    }} />
                )}
            </div>

            {isListening && (
                <div style={{ display: "flex", gap: "4px", height: "40px", alignItems: "center" }}>
                    {visualizerBars.map((h, i) => (
                        <div key={i} style={{
                            width: "4px",
                            height: `${h}px`,
                            background: "linear-gradient(to top, #6366f1, #ec4899)",
                            borderRadius: "2px",
                            transition: "height 0.1s ease"
                        }} />
                    ))}
                </div>
            )}

            {!isListening && isLarge && (
                <p style={{
                    color: "#6b7280",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    animation: "fadeIn 1s"
                }}>
                    Click to speak your command
                </p>
            )}

            <style jsx>{`
                @keyframes ping {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.5); opacity: 0; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
