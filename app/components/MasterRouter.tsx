"use client";
import dynamic from "next/dynamic";
import { useState, useRef, useEffect } from "react";
import AawazLogo from "./AawazLogo";

const TransactionAgent = dynamic(() => import("./TransactionAgent"), { ssr: false });
const SmartContractCreator = dynamic(() => import("./SmartContractCreator"), { ssr: false });
const SmartContractOptimizer = dynamic(() => import("./SmartContractOptimizer"), { ssr: false });
const NetworkAnalyzer = dynamic(() => import("./NetworkAnalyzer"), { ssr: false });
const VoiceAgentMarketplace = dynamic(() => import("./VoiceAgentMarketplace"), { ssr: false });
const ConversationalAgent = dynamic<{ onStopSpeech?: () => void, isLiveOnMount?: boolean }>(() => import("./ConversationalAgent"), { ssr: false });
const ExploreSection = dynamic(() => import("./ExploreSection"), { ssr: false });
const HyperliquidAgent = dynamic(() => import("./HyperliquidAgent"), { ssr: false });
const VoiceCommandHub = dynamic(() => import("./VoiceCommandHub"), { ssr: false });
const UICAgent = dynamic(() => import("./UICAgent"), { ssr: false });

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <div style={{ animation: `fadeIn 0.5s ease-out ${delay}s forwards`, opacity: 0 }}>
        {children}
    </div>
);

interface MasterRouterProps {
    initialCommand?: string;
    onBack?: () => void;
}

export default function MasterRouter({ initialCommand, onBack }: { initialCommand?: string, onBack?: () => void }) {
    const [activeAgent, setActiveAgent] = useState<"router" | "transaction" | "contract_creator" | "network" | "optimizer" | "marketplace" | "conversational" | "explore" | "hyperliquid" | "uic">("router");
    const [messages, setMessages] = useState<{ role: "user" | "system", text: string }[]>([
        { role: "system", text: "Hello! I am Aawaz, your Monad Super Agent. How can I help you today?" }
    ]);
    const [input, setInput] = useState("");
    const [voiceEnabled, setVoiceEnabled] = useState(true); // Enabled by default as requested
    const [isRouting, setIsRouting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [agentPrompt, setAgentPrompt] = useState(""); // Prompt to pass to redirected agent
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const speakText = (text: string) => {
        if (activeAgent === "conversational") return;
        if (!voiceEnabled) return;

        const performSpeech = () => {
            if (typeof window !== "undefined" && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);

                const voices = window.speechSynthesis.getVoices();
                const premiumVoices = voices.filter(v =>
                    (v.name.includes("Google") || v.name.includes("Premium") || v.name.includes("Natural")) &&
                    (v.lang.startsWith("en"))
                );

                if (premiumVoices.length > 0) {
                    utterance.voice = premiumVoices[Math.floor(Math.random() * premiumVoices.length)];
                }

                utterance.pitch = text.toLowerCase().includes("bachchan") || text.toLowerCase().includes("big b") ? 0.7 : (1.05 + (Math.random() * 0.1));
                utterance.rate = text.toLowerCase().includes("bachchan") || text.toLowerCase().includes("big b") ? 0.85 : 0.95;

                utterance.onstart = () => setIsSpeaking(true);
                utterance.onend = () => setIsSpeaking(false);
                utterance.onerror = () => setIsSpeaking(false);

                window.speechSynthesis.speak(utterance);
            }
        };

        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = performSpeech;
        } else {
            performSpeech();
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === "system") {
                speakText(lastMsg.text);
            }
        }
    }, [messages, voiceEnabled]);

    useEffect(() => {
        if (initialCommand) {
            handleTextCommand(initialCommand);
        }
    }, [initialCommand]);

    const handleTextCommand = (text: string) => {
        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Stop AI when user speaks
            setIsSpeaking(false);
        }
        const userMsg = text;
        setMessages(prev => [...prev, { role: "user", text: userMsg }]);

        const lower = userMsg.toLowerCase();
        setAgentPrompt(userMsg); // Save prompt for the next agent
        setIsRouting(true);
        setMessages(prev => [...prev, { role: "system", text: "Parsing Intent..." }]);

        setTimeout(() => {
            const isBuy = lower.includes("buy") || lower.includes("purchase") || lower.includes("get") || lower.includes("buye") || lower.includes("buyeme");
            const isSol = lower.includes("sol") || lower.includes("solaan") || lower.includes("native");

            if ((lower.includes("create") || lower.includes("make") || lower.includes("build") || lower.includes("generate") || lower.includes("write")) &&
                (lower.includes("contract") || lower.includes("program") || lower.includes("anchor"))) {
                setMessages(prev => [...prev, { role: "system", text: "Recognized Smart Contract Intent. Opening the Creator Agent now..." }]);
                setTimeout(() => { setActiveAgent("contract_creator"); setIsRouting(false); }, 1000);
            } else if ((lower.includes("optimize") || lower.includes("analyze") || lower.includes("audit") || lower.includes("security")) && lower.includes("contract")) {
                setMessages(prev => [...prev, { role: "system", text: "Opening the Contract Optimizer for you..." }]);
                setTimeout(() => { setActiveAgent("optimizer"); setIsRouting(false); }, 1000);
            } else if (lower.includes("hyperliquid") || lower.includes("trade") || lower.includes("perp") || lower.includes("leverage") || lower.includes("long") || lower.includes("short")) {
                setMessages(prev => [...prev, { role: "system", text: "Connecting to Hyperliquid Perps Agent..." }]);
                setTimeout(() => { setActiveAgent("hyperliquid"); setIsRouting(false); }, 1000);
            } else if (isBuy || lower.includes("transaction") || lower.includes("send") || lower.includes("transfer") || isSol || lower.includes("balance") || lower.includes("address") || lower.includes("pay")) {
                setMessages(prev => [...prev, { role: "system", text: "Routing you to the Transaction Voice Agent..." }]);
                setTimeout(() => { setActiveAgent("transaction"); setIsRouting(false); }, 1000);
            } else if (lower.includes("intent") || lower.includes("sign") || lower.includes("gesture") || lower.includes("accessibility") || lower.includes("uic")) {
                setMessages(prev => [...prev, { role: "system", text: "Opening Sign Language Accessibility Agent..." }]);
                setTimeout(() => { setActiveAgent("uic"); setIsRouting(false); }, 1000);
            } else {
                setMessages(prev => [...prev, { role: "system", text: "I'm not sure which agent you need. Please choose from: Transactions, Aawaz Live, or Contract Creation." }]);
                setIsRouting(false);
                setAgentPrompt(""); // Clear if not routing
            }
        }, 800);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        handleTextCommand(input);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSend();
    };

    const stopSpeech = () => {
        if (typeof window !== "undefined" && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
    };

    const TopNav = () => (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
            padding: "15px 25px",
            background: "rgba(15, 23, 42, 0.4)",
            borderRadius: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            backdropFilter: "blur(20px)"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ cursor: "pointer" }} onClick={() => { stopSpeech(); onBack?.(); }}>
                    <AawazLogo size="small" />
                </div>
            </div>
            <button
                onClick={() => { stopSpeech(); setActiveAgent("router"); }}
                style={{
                    padding: "10px 20px",
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.15)",
                    color: "#fca5a5",
                    fontWeight: "800",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    borderRadius: "12px",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    letterSpacing: "0.5px"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
            >
                ✕ Close Agent
            </button>
        </div>
    );

    const renderAgent = () => {
        const commonProps = {
            onSpeak: speakText,
            onStopSpeech: stopSpeech,
            initialCommand: agentPrompt
        };

        switch (activeAgent) {
            case "transaction":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">💸 Transaction Hub</h2>
                        <TransactionAgent {...commonProps} />
                    </div>
                );
            case "contract_creator":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">⚡ Smart Contract Studio</h2>
                        <div style={{ marginBottom: "20px", padding: "20px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                            <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: 0 }}>
                                🛡️ <strong style={{ color: "white" }}>Integrated Security:</strong> Generate Anchor programs with built-in vulnerability analysis and optimization recommendations
                            </p>
                        </div>
                        <SmartContractCreator {...commonProps} />
                    </div>
                );
            case "network":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">🌐 Network Monitor</h2>
                        <NetworkAnalyzer {...commonProps} />
                    </div>
                );
            case "optimizer":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">🛡️ Security Analyzer</h2>
                        <SmartContractOptimizer {...commonProps} />
                    </div>
                );
            case "marketplace":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">🎭 Voice NFT Market</h2>
                        <VoiceAgentMarketplace onSelectAgent={() => { }} onStopSpeech={stopSpeech} />
                    </div>
                );
            case "uic":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <div style={{ padding: "0 20px" }}>
                            <UICAgent
                                onSpeak={speakText}
                                onStopSpeech={stopSpeech}
                                onAction={(agent: any, command) => {
                                    setAgentPrompt(command);
                                    setActiveAgent(agent);
                                }}
                            />
                        </div>
                    </div>
                );
            case "conversational":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">⚡ Aawaz Live Studio</h2>
                        <ConversationalAgent onStopSpeech={stopSpeech} isLiveOnMount={true} />
                    </div>
                );
            case "explore":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <ExploreSection />
                    </div>
                );
            case "hyperliquid":
                return (
                    <div className="agent-container">
                        <TopNav />
                        <h2 className="agent-title">📊 Perps Trading Desk</h2>
                        <HyperliquidAgent {...commonProps} />
                    </div>
                );

            default:
                return (
                    <div className="router-interface">
                        <FadeIn>
                            <div style={{ marginBottom: "40px", position: "relative" }}>
                                {isSpeaking && (
                                    <div className="ai-speech-ripple" style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        width: "250px",
                                        height: "250px",
                                        background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)",
                                        borderRadius: "50%",
                                        zIndex: -1,
                                        animation: "rippleOut 2s infinite"
                                    }} />
                                )}
                                <VoiceCommandHub onCommand={(cmd) => {
                                    if (typeof window !== "undefined") window.speechSynthesis.cancel();
                                    setIsSpeaking(false);
                                    handleTextCommand(cmd);
                                }} size="large" />
                            </div>
                            <p
                                onClick={() => { stopSpeech(); onBack?.(); }}
                                style={{
                                    textAlign: "center",
                                    color: "white",
                                    marginBottom: "30px",
                                    fontSize: "1.4rem",
                                    fontWeight: "900",
                                    letterSpacing: "4px",
                                    textTransform: "uppercase",
                                    opacity: 0.6,
                                    cursor: "pointer"
                                }}
                            >
                                Aawaz
                            </p>
                        </FadeIn>

                        <div className="chat-window">
                            {messages.map((m, i) => (
                                <div key={i} className={`message ${m.role}`}>
                                    {m.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="input-area">
                            <div style={{
                                position: 'fixed',
                                bottom: '30px',
                                right: '30px',
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.8)',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    color: voiceEnabled ? '#10b981' : '#ef4444',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    {voiceEnabled ? 'AI Voice: ACTIVE 🎙️' : 'AI Voice: MUTED 🔇'}
                                </div>
                                <button
                                    onClick={() => setVoiceEnabled(!voiceEnabled)}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        background: voiceEnabled ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "#e5e7eb",
                                        color: voiceEnabled ? "white" : "#666",
                                        borderRadius: "50%",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "1.8rem",
                                        boxShadow: "0 10px 20px rgba(0,0,0,0.15)",
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                    }}
                                    className={voiceEnabled ? 'pulse-animation' : ''}
                                    title={voiceEnabled ? "Mute AI Assistant" : "Unmute AI Assistant"}
                                >
                                    {voiceEnabled ? "🔊" : "🔇"}
                                </button>
                            </div>
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{
                                    background: "rgba(15, 23, 42, 0.9)",
                                    border: "1px solid rgba(99, 102, 241, 0.3)",
                                    color: "white"
                                }}
                                placeholder="Type request (e.g., 'Make a crowdfunding contract', 'Trade MON', or 'Send 0.1 MON')..."
                            />
                            <button onClick={handleSend} style={{
                                borderRadius: '30px',
                                padding: '0 30px',
                                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                                boxShadow: "0 10px 20px rgba(99, 102, 241, 0.4)",
                                color: "white",
                                fontWeight: "900"
                            }}>Send ⚡</button>
                        </div>

                        <div className="quick-actions">
                            {[
                                { id: "transaction", label: "💸 Transaction Hub", desc: "Secure MON transfers & balance tracking" },
                                { id: "contract_creator", label: "⚡ Smart Contract Studio", desc: "AI-powered Anchor program creation & security" },
                                { id: "network", label: "🌐 Network Monitor", desc: "Real-time blockchain health analytics" },
                                { id: "hyperliquid", label: "📊 Perps Trading Desk", desc: "Voice-controlled perpetual trading" },
                                { id: "uic", label: "🤟 Gesture Interface", desc: "Sign language & accessibility hub" },
                                { id: "conversational", label: "⚡ Aawaz Live Studio", desc: "Continuous AI voice assistant" },
                                { id: "marketplace", label: "🎭 Voice NFT Market", desc: "Premium celebrity voice agents" },
                                { id: "explore", label: "🚀 Ecosystem Explorer", desc: "Discover Monad DeFi & tools" }
                            ].map((card) => (
                                <div
                                    key={card.id}
                                    onClick={() => { stopSpeech(); setActiveAgent(card.id as any); }}
                                    style={{
                                        border: "1px solid rgba(255, 255, 255, 0.05)",
                                        borderRadius: "24px",
                                        padding: "20px",
                                        background: "rgba(15, 23, 42, 0.4)",
                                        cursor: "pointer",
                                        transition: "all 0.4s",
                                        textAlign: "left",
                                        backdropFilter: "blur(20px)",
                                        flex: "1 1 200px"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-5px) scale(1.02)";
                                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                                        e.currentTarget.style.background = "rgba(30, 41, 59, 0.6)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                                        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                                        e.currentTarget.style.background = "rgba(15, 23, 42, 0.4)";
                                    }}
                                >
                                    <h4 style={{ color: "white", fontSize: "1.1rem", fontWeight: "900", marginBottom: "5px" }}>{card.label}</h4>
                                    <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: "1.4" }}>{card.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="master-router-wrapper">
            <style jsx global>{`
                .master-router-wrapper {
                    width: 100%;
                    max-width: 1200px;
                    margin: 0 auto;
                    min-height: 100vh;
                    position: relative;
                    overflow-x: hidden;
                    overflow-y: visible;
                    display: flex;
                    flex-direction: column;
                }
                .master-router-wrapper::before {
                    content: '';
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    background: radial-gradient(circle at center, #020617 0%, #0f172a 70%, #1e1b4b 100%);
                    z-index: -1;
                    pointer-events: none;
                }
                .router-interface {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 20px;
                    animation: fadeIn 0.5s ease;
                    padding: 40px 20px;
                }
                .chat-window {
                    width: 100%;
                    max-width: 800px;
                    height: 300px;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(30px);
                    border-radius: 30px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    padding: 25px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    box-shadow: 0 30px 60px rgba(0,0,0,0.4);
                }
                .message {
                    padding: 14px 22px;
                    border-radius: 20px;
                    max-width: 85%;
                    line-height: 1.5;
                    font-weight: 500;
                    animation: popIn 0.3s ease-out;
                }
                .message.system {
                    align-self: flex-start;
                    background: rgba(30, 41, 59, 0.6);
                    color: #f1f5f9;
                    border-bottom-left-radius: 5px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }
                .message.user {
                    align-self: flex-end;
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    color: white;
                    border-bottom-right-radius: 5px;
                    box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
                }
                .input-area {
                    display: flex;
                    gap: 15px;
                    width: 100%;
                    max-width: 800px;
                    margin-bottom: 30px;
                }
                .input-area input {
                    flex: 1;
                    padding: 18px 28px;
                    border-radius: 35px;
                    font-size: 1.05rem;
                    outline: none;
                    background: rgba(15, 23, 42, 0.9);
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    color: white;
                    font-family: 'Outfit', sans-serif;
                }
                .quick-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 15px;
                    justify-content: center;
                    max-width: 1000px;
                }
                .agent-container {
                    width: 100%;
                    background: rgba(15, 23, 42, 0.3);
                    backdrop-filter: blur(40px);
                    border-radius: 40px;
                    padding: 40px;
                    min-height: 80vh;
                    animation: slideUp 0.5s ease;
                    box-shadow: 0 30px 100px rgba(0,0,0,0.5);
                    border: 1px solid rgba(255,255,255,0.05);
                    margin-bottom: 50px;
                }
                .agent-title {
                    color: white;
                    font-size: 2.2rem;
                    font-weight: 950;
                    margin-bottom: 30px;
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    padding-bottom: 15px;
                    letter-spacing: -1.5px;
                }
                @keyframes rippleOut {
                    0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                    100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>

            {isRouting && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(3, 7, 18, 0.9)",
                    backdropFilter: "blur(25px)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    animation: "fadeIn 0.3s ease"
                }}>
                    <div style={{ fontSize: "6rem", marginBottom: "30px", animation: "floatPulse 2s infinite ease-in-out" }}>🎙️</div>
                    <h2 style={{ fontSize: "5rem", fontWeight: "950", color: "white", letterSpacing: "-3px" }}>Aawaz</h2>
                    <p style={{ color: "#818cf8", fontWeight: "900", marginTop: "15px", fontSize: "1.2rem", textTransform: "uppercase", letterSpacing: "3px" }}>Connecting Intelligent Agents...</p>
                </div>
            )}

            {renderAgent()}
        </div>
    );
}
