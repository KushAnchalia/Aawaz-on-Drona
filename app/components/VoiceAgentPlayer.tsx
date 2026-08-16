"use client";
import { useState, useRef } from "react";
import { VoiceAgent } from "../api/voice-agents/route";
import VoiceGenerator from "./VoiceGenerator";

interface VoiceAgentPlayerProps {
  agent: VoiceAgent | null;
  onClose: () => void;
}

export default function VoiceAgentPlayer({ agent, onClose }: VoiceAgentPlayerProps) {
  const [userInput, setUserInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  if (!agent) return null;

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    setLoading(true);
    setResponse("");

    try {
      // Use the agent's prompt to get a response
      const response = await fetch("/api/parse-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: userInput,
          customPrompt: agent.prompt, // Pass the agent's custom prompt
        }),
      });

      const data = await response.json();
      
      // For now, show the intent. In production, you'd use the agent's prompt
      // to generate a response in their style
      setResponse(`Agent "${agent.name}" says: I understand you want to ${data.action || "do something"}. ${agent.prompt.includes("friendly") ? "😊" : ""} Let me help you with that!`);
    } catch (error) {
      setResponse("Error processing request");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setUserInput(text);
      setIsListening(false);
      
      // Auto-submit
      const form = document.createElement("form");
      form.onsubmit = handleTextSubmit as any;
      const event = new Event("submit", { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "20px",
          padding: "2rem",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#333", margin: 0 }}>
              🎙️ {agent.name}
            </h3>
            <p style={{ color: "#666", fontSize: "0.9rem", margin: "0.25rem 0 0 0" }}>
              {agent.description}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#f3f4f6",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1.2rem",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
          <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>Agent Personality:</div>
          <div style={{ fontSize: "0.9rem", color: "#333", fontStyle: "italic" }}>"{agent.prompt}"</div>
        </div>

        <form onSubmit={handleTextSubmit}>
          <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder={`Talk to ${agent.name}...`}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
              }}
            />
            <button
              type="button"
              onClick={startListening}
              disabled={isListening}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: isListening ? "#ef4444" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              {isListening ? "🛑" : "🎤"}
            </button>
            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: loading || !userInput.trim() ? "#9ca3af" : "#10b981",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading || !userInput.trim() ? "not-allowed" : "pointer",
                fontWeight: "500",
              }}
            >
              {loading ? "⏳" : "Send"}
            </button>
          </div>
        </form>

        {response && (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#eff6ff",
              borderRadius: "8px",
              border: "1px solid #3b82f6",
              color: "#1e40af",
            }}
          >
            {response}
          </div>
        )}

        {/* Voice Generation Section */}
        {agent.celebrityName && (
          <div style={{ marginTop: "2rem", borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem" }}>
            <VoiceGenerator agent={agent} />
          </div>
        )}
      </div>
    </div>
  );
}

