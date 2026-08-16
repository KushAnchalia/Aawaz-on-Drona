"use client";
import { useState, useRef } from "react";
import { useWallet } from "../context/WalletContext";
import { getExplorerTxUrl } from "../lib/monad";
import { validateTransfer } from "../lib/policy";

export default function VoiceButton() {
  const { address, connected, sendMon } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState("");
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (!connected || !address) {
      setStatus("Please connect MetaMask first");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Listening...");
      setTranscript("");
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus("Processing...");

      try {
        const response = await fetch("/api/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        const intent = await response.json();
        const action =
          intent.action === "transfer_sol" ? "transfer_mon" : intent.action;

        if (action === "transfer_mon") {
          const validation = validateTransfer(intent.amount, intent.to);
          if (!validation.allowed) {
            setStatus(`Error: ${validation.reason}`);
            return;
          }

          const confirmMessage = `Send ${intent.amount} MON to ${intent.to.slice(0, 8)}...${intent.to.slice(-6)}?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setStatus("Transaction cancelled");
            return;
          }

          await executeTransfer(intent.amount, intent.to);
        } else if (action === "clarify") {
          setStatus("Could not understand. Please try again.");
        } else if (action === "cancel") {
          setStatus("Cancelled");
        } else {
          setStatus(`Handled intent: ${action}`);
        }
      } catch (error) {
        console.error("Error processing voice command:", error);
        setStatus("Error processing command");
      }
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`Error: ${e.error}`);
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

  const executeTransfer = async (amount: number, to: string) => {
    if (!address) {
      setStatus("Wallet not connected");
      return;
    }

    try {
      setStatus("Confirm in MetaMask...");
      const hash = await sendMon(to, amount);
      setStatus(`✅ Success! ${hash.slice(0, 10)}... — ${getExplorerTxUrl(hash)}`);
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus(`Error: ${error.message || "Transaction failed"}`);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button
        onClick={isListening ? stopListening : startListening}
        disabled={!connected}
        style={{
          padding: "1.5rem 3rem",
          fontSize: "1.2rem",
          backgroundColor: isListening ? "#ef4444" : "#836EF9",
          color: "white",
          border: "none",
          borderRadius: "12px",
          cursor: connected ? "pointer" : "not-allowed",
          opacity: connected ? 1 : 0.5,
          fontWeight: "bold",
        }}
      >
        {isListening ? "🛑 Stop" : "🎤 Start Voice Command"}
      </button>

      {transcript && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            color: "white",
          }}
        >
          <strong>You said:</strong> {transcript}
        </div>
      )}

      {status && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "rgba(255,255,255,0.2)",
            borderRadius: "8px",
            color: "white",
            fontWeight: "500",
            wordBreak: "break-all",
          }}
        >
          {status}
        </div>
      )}

      {!connected && (
        <p style={{ marginTop: "1rem", color: "white" }}>
          Connect MetaMask to start
        </p>
      )}
    </div>
  );
}
