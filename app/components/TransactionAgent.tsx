"use client";
import { useState, useRef, ReactNode, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { getExplorerTxUrl, getWalletBalance, MONAD_RPC_URL } from "../lib/monad";
import { validateTransfer } from "../lib/policy";
import { parseWithRegex, ParsedIntent } from "../lib/ai";

interface TransactionAgentProps {
  onSpeak?: (text: string) => void;
  onStopSpeech?: () => void;
  initialCommand?: string;
}

export default function TransactionAgent({ onSpeak, onStopSpeech, initialCommand }: TransactionAgentProps) {
  const { address, connected, sendMon, network } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<ReactNode>("");
  const [mode, setMode] = useState<"voice" | "text">("text");
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
  const [linkedExchanges, setLinkedExchanges] = useState<string[]>([]);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const lower = (transcript || textInput || initialCommand || "").toLowerCase();
  const isMyWallet = lower.includes("my wallet") || lower.includes("my address") || lower.includes("my own");

  useEffect(() => {
    if (initialCommand && !hasProcessedInitial) {
      setHasProcessedInitial(true);
      processCommand(initialCommand);
    }
  }, [initialCommand, hasProcessedInitial]);

  const processCommand = async (text: string) => {
    if (!text.trim()) return;

    setStatus("⏳ Processing & Parsing Intent...");
    onSpeak?.("Processing your request...");
    setTranscript(text);

    try {
      let intent: ParsedIntent;
      try {
        const response = await fetch("/api/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, linked_exchanges: linkedExchanges }),
        });
        if (!response.ok) throw new Error(`Server Busy`);
        intent = await response.json();
      } catch (error: any) {
        console.warn("Server-side parsing failed, using local browser fallback.", error);
        intent = parseWithRegex(text);
      }

      // Normalize legacy Solana action name
      if ((intent as any).action === "transfer_sol") {
        intent.action = "transfer_mon";
      }

      if (intent) {
        await new Promise((r) => setTimeout(r, 400));

        if (intent.action === "transfer_mon") {
          if (!intent.amount || (!intent.to && !isMyWallet)) {
            setStatus(
              <div style={{ textAlign: "left", color: "#f1f5f9" }}>
                <strong style={{ color: "#a78bfa" }}>Transaction Intent Detected 🟣</strong>
                <br />
                <div style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                  {!intent.amount && <div style={{ color: "#f87171" }}>❌ Missing Amount (e.g., &quot;0.1&quot;)</div>}
                  {!intent.to && !isMyWallet && <div style={{ color: "#f87171" }}>❌ Missing Recipient Address</div>}
                  {intent.amount && <div style={{ color: "#34d399" }}>✅ Amount: {intent.amount} MON</div>}
                  {(intent.to || isMyWallet) && (
                    <div style={{ color: "#34d399" }}>
                      ✅ To: {intent.to === "OWN_WALLET" || isMyWallet ? "My Wallet" : (intent.to || "").slice(0, 10) + "..."}
                    </div>
                  )}
                </div>
                <p style={{ marginTop: "10px", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                  Try saying: <strong style={{ color: "white" }}>&quot;Send 0.05 MON to 0x...&quot;</strong>
                </p>
              </div>
            );
            if (!intent.amount) onSpeak?.("I couldn't catch the amount. How much MON do you want to send?");
            else if (!intent.to && !isMyWallet) onSpeak?.("Who should I send this to?");
            return;
          }

          const recipient = intent.to === "OWN_WALLET" || isMyWallet ? address || undefined : intent.to;
          if (!recipient) {
            setStatus(<div style={{ color: "#f87171" }}>Please connect MetaMask to use &quot;on my address&quot;.</div>);
            return;
          }

          const validation = validateTransfer(intent.amount, recipient);
          if (!validation.allowed) {
            setStatus(`❌ Error: ${validation.reason}`);
            onSpeak?.(`Error: ${validation.reason}`);
            return;
          }

          const displayAddr =
            intent.to === "OWN_WALLET" || isMyWallet
              ? "My Wallet"
              : recipient.slice(0, 8) + "..." + recipient.slice(-6);
          const confirmMessage = `Send ${intent.amount} MON to ${displayAddr}?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setStatus("Transaction cancelled");
            onSpeak?.("Transaction cancelled.");
            return;
          }

          await executeTransfer(intent.amount, recipient);
        } else if (intent.action === "buy") {
          if (!intent.amount) {
            setStatus(
              <div style={{ color: "#f87171" }}>
                ❌ <strong>Missing Amount:</strong> How much {intent.asset || "MON"} do you want to buy?
              </div>
            );
            onSpeak?.("Please specify the amount you want to buy.");
            return;
          }

          if (linkedExchanges.length === 0 || intent.status === "ACTION_REQUIRED") {
            setPendingCommand(text);
            const options = intent.supported_exchanges || ["Binance", "Coinbase", "OKX", "Bybit", "CoinDCX"];
            setStatus(
              <div style={{ textAlign: "left", color: "#f1f5f9" }}>
                <strong style={{ color: "#a78bfa" }}>Link an exchange to buy 🎙️</strong>
                <p style={{ marginTop: "15px", fontSize: "0.95rem" }}>
                  To buy <strong>{intent.amount} {intent.asset || "MON"}</strong>, choose a destination:
                </p>
                <div style={{ marginTop: "15px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {options.map((ex: string) => (
                    <button
                      key={ex}
                      onClick={async () => {
                        setLinkedExchanges([ex]);
                        setStatus(<div style={{ color: "#34d399" }}>✅ {ex} linked! Resuming your order...</div>);
                        onSpeak?.(`${ex} linked.`);
                        if (pendingCommand || text) {
                          setTimeout(() => processCommand(pendingCommand || text), 600);
                        }
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid rgba(167,139,250,0.4)",
                        background: "rgba(131, 110, 249, 0.15)",
                        color: "white",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            );
            onSpeak?.(`To buy ${intent.amount} ${intent.asset || "MON"}, please link an exchange.`);
            return;
          }

          const linkedEx = linkedExchanges[0] || intent.exchange;
          setStatus(
            <div style={{ color: "#f1f5f9" }}>
              Ready to buy <strong>{intent.amount} {intent.asset || "MON"}</strong> via {linkedEx}.
              <br />
              <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                On-ramp execution is external — open {linkedEx} to complete acquisition, then transfer MON on Monad.
              </span>
            </div>
          );
          onSpeak?.(`Buy ${intent.amount} ${intent.asset || "MON"} on ${linkedEx} at market price?`);
        } else if (intent.action === "get_balance") {
          if (!address) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          setStatus("⏳ Fetching balance...");
          onSpeak?.("Fetching balance.");
          const balance = await getWalletBalance(address, network);
          const balText = `Your balance is ${balance.toFixed(4)} MON`;
          setStatus(`💰 ${balText}`);
          onSpeak?.(balText);
        } else if (intent.action === "get_address") {
          if (!address) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          setStatus(
            <div style={{ wordBreak: "break-all", color: "#f1f5f9" }}>
              <strong style={{ color: "#a78bfa" }}>Your Monad Address:</strong>
              <br />
              <code
                style={{
                  background: "rgba(30, 41, 59, 0.8)",
                  padding: "12px",
                  borderRadius: "12px",
                  display: "block",
                  marginTop: "10px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "white",
                }}
              >
                {address}
              </code>
            </div>
          );
          onSpeak?.("Your account address is " + address);
        } else if (intent.action === "clarify") {
          setStatus("❌ Could not understand. Please try again.");
        } else if (intent.action === "cancel") {
          setStatus("Cancelled");
        } else if (intent.action === "analyze_transaction") {
          setStatus("Transaction analysis is available in the Network / Optimizer agents.");
        }
      }
    } catch (error: any) {
      console.error("Error processing command:", error);
      setStatus(
        <div style={{ color: "#f87171", padding: "15px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "14px" }}>
          <div style={{ fontWeight: "900", marginBottom: "8px" }}>❌ Error</div>
          <div style={{ fontSize: "0.9rem" }}>{error?.message || "Command processing failed"}</div>
        </div>
      );
      onSpeak?.("Something went wrong while processing your command.");
    }
  };

  const startListening = () => {
    if (!connected || !address) {
      setStatus("⚠️ Please connect MetaMask first");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("❌ Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("🎤 Listening...");
      setTranscript("");
    };

    recognition.onresult = async (e: any) => {
      const text = e.results[0][0].transcript;
      await processCommand(text);
    };

    recognition.onerror = (e: any) => {
      setIsListening(false);
      setStatus(`❌ Error: ${e.error}`);
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

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    await processCommand(textInput);
    setTextInput("");
  };

  const executeTransfer = async (amount: number, to: string) => {
    if (!address) {
      setStatus("⚠️ Wallet not connected");
      return;
    }

    try {
      setStatus("⏳ Checking balance...");
      const balance = await getWalletBalance(address, network);
      if (balance < amount) {
        setStatus(
          `❌ Insufficient balance! You have ${balance.toFixed(4)} MON, but need ${amount.toFixed(4)} MON + gas.`
        );
        return;
      }

      setStatus("✍️ Confirm in MetaMask...");
      console.log("MetaMask", address, "Recipient", to, "RPC", MONAD_RPC_URL);

      const hash = await sendMon(to, amount);
      const explorerUrl = getExplorerTxUrl(hash, network);

      setStatus(
        <div style={{ color: "white" }}>
          <span style={{ color: "#10b981", fontWeight: "900" }}>✅ Success!</span>
          <br />
          <span style={{ fontSize: "0.9rem" }}>Transaction Hash:</span>
          <br />
          <code
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              padding: "0.5rem",
              borderRadius: "8px",
              fontSize: "0.85em",
              display: "block",
              marginTop: "5px",
              border: "1px solid rgba(255,255,255,0.1)",
              wordBreak: "break-all",
            }}
          >
            {hash}
          </code>
          <br />
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#a78bfa",
              textDecoration: "underline",
              marginTop: "0.8rem",
              display: "inline-block",
              fontWeight: "800",
            }}
          >
            View on {network === "mainnet" ? "MonadScan" : "MonadVision"} →
          </a>
        </div>
      );
      onSpeak?.("Transaction successful.");
    } catch (error: any) {
      console.error("Transaction processing error:", error);
      setStatus(
        <div style={{ color: "#f87171", padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "10px" }}>
          ❌ <strong>Transaction failed:</strong> {error?.message || "Unknown error"}
        </div>
      );
      onSpeak?.("Transaction failed.");
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", justifyContent: "center" }}>
        <button
          onClick={() => {
            onStopSpeech?.();
            setMode("text");
          }}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: mode === "text" ? "#836EF9" : "rgba(30, 41, 59, 0.4)",
            color: "white",
            border: mode === "text" ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "800",
          }}
        >
          ⌨️ Text Input
        </button>
        <button
          onClick={() => {
            onStopSpeech?.();
            setMode("voice");
          }}
          style={{
            padding: "0.75rem 1.5rem",
            fontSize: "1rem",
            backgroundColor: mode === "voice" ? "#836EF9" : "rgba(30, 41, 59, 0.4)",
            color: "white",
            border: mode === "voice" ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
            borderRadius: "14px",
            cursor: "pointer",
            fontWeight: "800",
          }}
        >
          🎤 Voice Command
        </button>
      </div>

      {mode === "text" && (
        <form onSubmit={handleTextSubmit} style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Send 0.1 MON to 0x..."
              disabled={!connected}
              style={{
                flex: 1,
                padding: "1rem 1.5rem",
                fontSize: "1rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(15, 23, 42, 0.6)",
                color: "white",
                borderRadius: "14px",
                outline: "none",
                opacity: connected ? 1 : 0.5,
              }}
            />
            <button
              type="submit"
              disabled={!connected || !textInput.trim()}
              style={{
                padding: "1rem 2.5rem",
                fontSize: "1rem",
                background: connected && textInput.trim() ? "linear-gradient(135deg, #836EF9 0%, #200052 100%)" : "#475569",
                color: "white",
                border: "none",
                borderRadius: "14px",
                cursor: connected && textInput.trim() ? "pointer" : "not-allowed",
                fontWeight: "900",
              }}
            >
              Send
            </button>
          </div>
        </form>
      )}

      {mode === "voice" && (
        <div style={{ textAlign: "center", marginBottom: "1rem" }}>
          <button
            onClick={() => {
              onStopSpeech?.();
              isListening ? stopListening() : startListening();
            }}
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
            {isListening ? "🛑 Stop Listening" : "🎤 Start Voice Command"}
          </button>
        </div>
      )}

      {transcript && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            backgroundColor: "rgba(30, 41, 59, 0.4)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <strong style={{ color: "#a78bfa" }}>Your {mode === "voice" ? "voice" : "text"} command:</strong>
          <p style={{ marginTop: "0.8rem", color: "#f1f5f9", wordBreak: "break-word", fontSize: "1.1rem" }}>
            {transcript}
          </p>
        </div>
      )}

      {status && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1.2rem",
            backgroundColor: "rgba(99, 102, 241, 0.15)",
            borderRadius: "16px",
            border: "1px solid rgba(167, 139, 250, 0.3)",
            color: "#e0e7ff",
            fontWeight: "600",
          }}
        >
          {status}
        </div>
      )}

      {!connected && (
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem",
            backgroundColor: "#fef3c7",
            borderRadius: "8px",
            border: "1px solid #f59e0b",
            color: "#92400e",
            textAlign: "center",
          }}
        >
          ⚠️ Please connect MetaMask ({network === "mainnet" ? "Monad Mainnet" : "Monad Testnet"}) to start
        </div>
      )}
    </div>
  );
}
