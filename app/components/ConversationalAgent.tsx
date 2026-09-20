"use client";
import { useState, useEffect, useRef } from "react";

export default function ConversationalAgent({ onStopSpeech, isLiveOnMount = false }: { onStopSpeech?: () => void, isLiveOnMount?: boolean }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [response, setResponse] = useState("");
    const [isIndefinite, setIsIndefinite] = useState(isLiveOnMount);
    const [status, setStatus] = useState(isLiveOnMount ? "Ready for Live Chat" : "Idle");
    const recognitionRef = useRef<any>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            const recognition = new SpeechRecognition();
            recognition.continuous = true; // Allow long recording (1 min+)
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
                let finalTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => prev + " " + finalTranscript);
                }
            };

            recognition.onend = () => {
                if (isListening) {
                    // If stopped unexpectedly, restart? Or just update state
                    // For "1 minute" we usually want manual stop or silence detection
                    // We'll let user stop manually to ensure "1 minute" capability
                    // setIsListening(false); 
                }
            };

            recognitionRef.current = recognition;
        }
    }, [isListening]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            setStatus("Processing...");
            handleProcessQuery(transcript);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        } else {
            setTranscript("");
            setResponse("");
            startVisualizer();
            recognitionRef.current?.start();
            setIsListening(true);
            setStatus("Listening... (Speak for up to 1 minute)");
        }
    };

    const startVisualizer = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current!);
            draw();
        } catch (err) {
            console.error("Mic error:", err);
            simulateDraw();
        }
    };

    const draw = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const render = () => {
            animationFrameRef.current = requestAnimationFrame(render);
            analyserRef.current!.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] / 2;
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#ec4899');
                ctx.fillStyle = gradient;
                ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth, barHeight);
                x += barWidth + 1;
            }
        };
        render();
    };

    const simulateDraw = () => {
        if (!canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;
        const render = () => {
            animationFrameRef.current = requestAnimationFrame(render);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < 50; i++) {
                const h = Math.random() * 50 + 10;
                const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#ec4899');
                ctx.fillStyle = gradient;
                ctx.fillRect(i * 12, canvas.height / 2 - h / 2, 8, h);
            }
        };
        render();
    };

    const handleProcessQuery = async (text: string) => {
        if (!text.trim()) return;
        setStatus("Thinking...");
        // HIGH SPEED: Reduced delay to 400ms for "Live" feel
        setTimeout(() => {
            const reply = generateReply(text);
            setResponse(reply);
            setStatus("Speaking...");
            speak(reply);
        }, 1000);
    };

    const generateReply = (text: string) => {
        // Simple heuristic bot for demo 
        // In production, send to LLM API
        const lower = text.toLowerCase();
        if (lower.includes("hello") || lower.includes("hi")) return "Hello there! I am Aawaz, your Txn Super Agent.";
        if (lower.includes("price") || lower.includes("market")) return "The market is looking interesting today. Everything is moving fast!";
        if (lower.includes("solana") || lower.includes("monad") || lower.includes("ethereum")) return "Aawaz works across chains — Ethereum, Solana and more. Just say who to pay and how much.";
        return "That's interesting! Tell me more about " + (text.split(" ").slice(-1)[0] || "it") + ".";
    };

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);

            // Premium Voice selection
            const voices = window.speechSynthesis.getVoices();
            const premium = voices.find(v => v.name.includes("Google") || v.name.includes("Premium"));
            if (premium) utterance.voice = premium;
            utterance.pitch = 1.1;
            utterance.rate = 1.0;
            utterance.onend = () => {
                setStatus("Idle");
                if (isIndefinite) {
                    // Slight delay before resuming to avoid hearing its own voice
                    setTimeout(() => {
                        if (!isListening) {
                            recognitionRef.current?.start();
                            setIsListening(true);
                            setStatus("Listening (Indefinite Mode)...");
                        }
                    }, 500);
                }
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    return (
        <div style={{
            padding: "4rem 2rem",
            background: "rgba(15, 23, 42, 0.4)",
            borderRadius: "40px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(40px)",
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto",
            minHeight: "500px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden"
        }}>
            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: isListening ? "400px" : "200px",
                height: isListening ? "400px" : "200px",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)",
                borderRadius: "50%",
                transition: "all 0.5s ease",
                animation: isListening ? "pulseRing 2s infinite" : "none",
                zIndex: 0
            }} />
            <div style={{
                position: "relative",
                width: "100%",
                height: "150px",
                marginBottom: "30px",
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <canvas
                    ref={canvasRef}
                    width={600}
                    height={150}
                    style={{
                        width: "100%",
                        height: "100%",
                        filter: "drop-shadow(0 0 15px rgba(99, 102, 241, 0.5))"
                    }}
                />
            </div>

            <div style={{ fontSize: "6rem", marginBottom: "30px", zIndex: 1, position: "relative" }}>
                {isListening ? "✨" : "🎙️"}
            </div>

            <h2 style={{ marginBottom: "10px", color: "white", fontSize: "2.5rem", fontWeight: "950", letterSpacing: "-1.5px", zIndex: 1 }}>Aawaz Live</h2>
            <p style={{ color: "#818cf8", marginBottom: "40px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.9rem", zIndex: 1 }}>
                {status}
            </p>

            <div style={{
                minHeight: "120px",
                padding: "25px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: "24px",
                marginBottom: "30px",
                textAlign: "left",
                fontSize: "1.2rem",
                color: "#f1f5f9",
                border: "1px solid rgba(255, 255, 255, 0.05)",
                zIndex: 1,
                position: "relative"
            }}>
                {transcript || <span style={{ color: "#475569" }}>Listening for your voice...</span>}
            </div>

            {response && (
                <div style={{
                    padding: "30px",
                    background: "rgba(99, 102, 241, 0.1)",
                    borderRadius: "30px",
                    marginBottom: "30px",
                    textAlign: "center",
                    color: "white",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    animation: "pulseGlow 2s infinite ease-in-out",
                    fontSize: "1.4rem",
                    fontWeight: "600"
                }}>
                    {response}
                </div>
            )}

            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", alignItems: "center", zIndex: 1, position: "relative" }}>
                <button
                    onClick={toggleListening}
                    style={{
                        padding: "20px 60px",
                        fontSize: "1.3rem",
                        borderRadius: "40px",
                        border: "none",
                        background: isListening ? "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)" : "linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)",
                        color: "white",
                        fontWeight: "900",
                        cursor: "pointer",
                        boxShadow: isListening ? "0 0 30px rgba(239, 68, 68, 0.4)" : "0 15px 35px rgba(99, 102, 241, 0.3)",
                        transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
                    }}
                >
                    {isListening ? "Stop Live Session" : "Start Aawaz Live"}
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <input
                        type="checkbox"
                        id="indefiniteMode"
                        checked={isIndefinite}
                        onChange={(e) => setIsIndefinite(e.target.checked)}
                        style={{ width: "22px", height: "22px", cursor: "pointer" }}
                    />
                    <label htmlFor="indefiniteMode" style={{ cursor: "pointer", fontWeight: "800", color: "#94a3b8" }}>
                        Continuous Chat 🔄
                    </label>
                </div>
            </div>

            <style jsx>{`
                @keyframes pulseRing {
                    0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
                    50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.2; }
                    100% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.5; }
                }
                @keyframes pulseGlow {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.02); opacity: 1; box-shadow: 0 0 50px rgba(99, 102, 241, 0.4); }
                    100% { transform: scale(1); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}
