"use client";
import { useState, useRef, ReactNode, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { getChain, explorerTxUrl, getEvmProvider } from "../lib/chains";
import { formatEther } from "ethers";
import { validateTransfer } from "../lib/policy";
import { parseWithRegex, ParsedIntent } from "../lib/ai";
import {
  expandDollarHandles,
  extractDollarHandle,
  loadContacts,
  normalizeHandle,
  resolveContact,
  type Contact,
} from "../lib/contacts";
import PaymentsDirectory from "./PaymentsDirectory";

interface TransactionAgentProps {
  onSpeak?: (text: string) => void;
  onStopSpeech?: () => void;
  initialCommand?: string;
}

export default function TransactionAgent({ onSpeak, onStopSpeech, initialCommand }: TransactionAgentProps) {
  const { address, connected, sendNative, chain, symbol, network } = useWallet();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [status, setStatus] = useState<ReactNode>("");
  const [mode, setMode] = useState<"voice" | "text">("text");
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
  const [linkedExchanges, setLinkedExchanges] = useState<string[]>([]);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const recognitionRef = useRef<any>(null);

  const reloadContacts = () => setContacts(loadContacts());
  useEffect(() => {
    reloadContacts();
    window.addEventListener("storage", reloadContacts);
    window.addEventListener("aawaz-contacts-changed", reloadContacts);
    return () => {
      window.removeEventListener("storage", reloadContacts);
      window.removeEventListener("aawaz-contacts-changed", reloadContacts);
    };
  }, []);

  /** Sidebar directory pay: selected contact + amount → confirm → send */
  const directoryPay = async (c: Contact, amt: number) => {
    if (!amt || amt <= 0) {
      setStatus("💰 Enter an amount first.");
      onSpeak?.("Enter an amount first.");
      return;
    }
    if (!address) {
      setStatus("⚠️ Please connect your wallet first.");
      return;
    }
    const ok = window.confirm(`Send ${amt} ${symbol} on ${getChain(chain).label} to ${c.label || c.name}?`);
    if (!ok) {
      setStatus("Transaction cancelled");
      return;
    }
    setTranscript(`Send ${amt} ${symbol} to ${c.label || c.name}`);
    await executeTransfer(amt, c.address, c.label || c.name);
  };

  const lower = (transcript || textInput || initialCommand || "").toLowerCase();
  const isMyWallet = lower.includes("my wallet") || lower.includes("my address") || lower.includes("my own");

  useEffect(() => {
    if (initialCommand && !hasProcessedInitial) {
      setHasProcessedInitial(true);
      processCommand(initialCommand);
    }
  }, [initialCommand, hasProcessedInitial]);

  /** Resolve 0x / solana addr / saved contact name / OWN_WALLET (also accepts old $handle/@handle) */
  const resolveRecipient = (rawTo: string | undefined, fullText: string): { address?: string; label: string; contact?: Contact } => {
    if (!rawTo && isMyWallet) return { address: address || undefined, label: "My Wallet" };
    if (!rawTo) {
      // plain name fallback, e.g. "send 0.1 to mom" / "can you send 0.5 mod to mom"
      // tolerates "dollar mom" voice artefacts and trailing punctuation.
      const all = [...fullText.matchAll(/(?:\bto\b|\bfor\b)\s+(?:dollar\s+)?\$?@?([a-zA-Z][a-zA-Z0-9_\-]*)/gi)];
      const RESERVED = new Set(["me", "my", "wallet", "dollar", "to", "for", "the", "a"]);
      for (let i = all.length - 1; i >= 0; i--) {
        const word = all[i][1];
        if (word && !RESERVED.has(word.toLowerCase())) {
          const c = resolveContact(word, loadContacts());
          if (c) return { address: c.address, label: c.label || c.name, contact: c };
          // non-contact word: still return it so the UI can say "unknown contact X"
          return { label: word };
        }
      }
      return { label: "" };
    }
    if (rawTo === "OWN_WALLET" || isMyWallet) return { address: address || undefined, label: "My Wallet" };
    const list = loadContacts();
    if (rawTo.startsWith("$") || rawTo.startsWith("@")) {
      const c = resolveContact(rawTo, list);
      if (c) return { address: c.address, label: c.label || c.name, contact: c };
      return { label: rawTo };
    }
    // plain name that matches a saved contact
    const plain = resolveContact(rawTo, list);
    if (plain && !/^0x/i.test(rawTo)) return { address: plain.address, label: plain.label || plain.name, contact: plain };
    return { address: rawTo, label: rawTo.slice(0, 8) + "..." + rawTo.slice(-6) };
  };

  const processCommand = async (rawText: string) => {
    if (!rawText.trim()) return;
    // Normalize voice artefacts up-front: "dollar mom" / "$mom" / "@mom" → plain "mom"
    const text = rawText.replace(/\bdollar\s+([a-zA-Z0-9_\-]+)/gi, "$1");

    setStatus("⏳ Processing & Parsing Intent...");
    onSpeak?.("Processing your request...");
    setTranscript(text);

    try {
      // Expand saved contact names before LLM so "to mom" becomes a real address (also supports old $mom)
      const expanded = expandDollarHandles(text, loadContacts());
      const dollarHandle = extractDollarHandle(text);

      let intent: ParsedIntent;
      try {
        const response = await fetch("/api/parse-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: expanded, linked_exchanges: linkedExchanges }),
        });
        if (!response.ok) throw new Error(`Server Busy`);
        intent = await response.json();
        // keep original contact name if server stripped it
        if ((!intent.to || intent.to === expanded) && dollarHandle) {
          const c = resolveContact(dollarHandle, loadContacts());
          if (c) intent.to = c.address;
        }
        // Plain-name fallback: LLM often drops "to mom" — recover it from the raw text
        if (!intent.to || intent.to === expanded) {
          const m = [...text.matchAll(/(?:\bto\b|\bfor\b)\s+(?:dollar\s+)?\$?@?([a-zA-Z][a-zA-Z0-9_\-]*)/gi)].pop();
          const RESERVED = new Set(["me", "my", "wallet", "dollar", "to", "for", "the", "a"]);
          if (m && m[1] && !RESERVED.has(m[1].toLowerCase())) {
            const c = resolveContact(m[1], loadContacts());
            if (c) intent.to = c.address;
            else intent.to = m[1];
          }
        }
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
          const resolved = resolveRecipient(intent.to, text);
          if (!intent.amount || !resolved.address) {
            const missingHandle = dollarHandle && !resolved.address;
            setContacts(loadContacts());
            setStatus(
              <div style={{ textAlign: "left", color: "#f1f5f9" }}>
                <strong style={{ color: "#a78bfa" }}>Transaction Intent Detected 🟣</strong>
                <br />
                <div style={{ marginTop: "5px", fontSize: "0.9rem" }}>
                  {!intent.amount && <div style={{ color: "#f87171" }}>❌ Missing Amount (e.g., &quot;0.1&quot;)</div>}
                  {!resolved.address && (
                    <div style={{ color: "#f87171" }}>
                      ❌ {missingHandle ? (
                        <>Unknown contact <strong>{normalizeHandle(dollarHandle)}</strong> — save it in Payments below, then retry.</>
                      ) : (
                        <>Missing Recipient — pick a saved contact below or paste a 0x/Solana address</>
                      )}
                    </div>
                  )}
                  {intent.amount && <div style={{ color: "#34d399" }}>✅ Amount: {intent.amount} {symbol}</div>}
                  {resolved.address && <div style={{ color: "#34d399" }}>✅ To: {resolved.label}</div>}
                </div>
                <p style={{ marginTop: "10px", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px" }}>
                  Try saying: <strong style={{ color: "white" }}>&quot;Send 0.05 {symbol} to mom&quot;</strong> or{" "}
                  <strong style={{ color: "white" }}>&quot;Send 0.05 {symbol} to 0x...&quot;</strong>
                </p>
              </div>
            );
            if (!intent.amount) onSpeak?.(`I couldn't catch the amount. How much ${symbol} do you want to send?`);
            else if (!resolved.address) onSpeak?.("Who should I send this to? Pick a saved contact.");
            return;
          }

          const recipient = resolved.address!;
          if (!address) {
            setStatus(<div style={{ color: "#f87171" }}>Please connect your wallet first.</div>);
            return;
          }

          const validation = validateTransfer(intent.amount, recipient);
          if (!validation.allowed) {
            setStatus(`❌ Error: ${validation.reason}`);
            onSpeak?.(`Error: ${validation.reason}`);
            return;
          }

          const confirmMessage = `Send ${intent.amount} ${symbol} on ${getChain(chain).label} to ${resolved.label}?`;
          const confirmed = window.confirm(confirmMessage);

          if (!confirmed) {
            setStatus("Transaction cancelled");
            onSpeak?.("Transaction cancelled.");
            return;
          }

          await executeTransfer(intent.amount, recipient, resolved.label);
        } else if (intent.action === "buy") {
          if (!intent.amount) {
            setStatus(
              <div style={{ color: "#f87171" }}>
                ❌ <strong>Missing Amount:</strong> How much {intent.asset || symbol} do you want to buy?
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
                  To buy <strong>{intent.amount} {intent.asset || symbol}</strong>, choose a destination:
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
            onSpeak?.(`To buy ${intent.amount} ${intent.asset || symbol}, please link an exchange.`);
            return;
          }

          const linkedEx = linkedExchanges[0] || intent.exchange;
          setStatus(
            <div style={{ color: "#f1f5f9" }}>
              Ready to buy <strong>{intent.amount} {intent.asset || symbol}</strong> via {linkedEx}.
              <br />
              <span style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                On-ramp execution is external — open {linkedEx} to complete acquisition, then transfer on {getChain(chain).label}.
              </span>
            </div>
          );
          onSpeak?.(`Buy ${intent.amount} ${intent.asset || symbol} on ${linkedEx} at market price?`);
        } else if (intent.action === "get_balance") {
          if (!address) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          setStatus("⏳ Fetching balance...");
          onSpeak?.("Fetching balance.");
          const cfg = getChain(chain);
          let balText: string;
          if (cfg.family === "solana") {
            const res = await fetch(cfg.rpcUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
            });
            const j = await res.json();
            const sol = (j?.result?.value ?? 0) / 1e9;
            balText = `Your balance is ${sol.toFixed(4)} SOL`;
          } else {
            const provider = getEvmProvider(chain);
            const bal = await provider.getBalance(address);
            balText = `Your balance is ${Number(formatEther(bal)).toFixed(4)} ${symbol}`;
          }
          setStatus(`💰 ${balText}`);
          onSpeak?.(balText);
        } else if (intent.action === "get_address") {
          if (!address) {
            setStatus("⚠️ Wallet not connected");
            return;
          }
          setStatus(
            <div style={{ wordBreak: "break-all", color: "#f1f5f9" }}>
              <strong style={{ color: "#a78bfa" }}>Your {getChain(chain).label} Address:</strong>
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
          setStatus("❌ Could not understand. Try e.g. “send 0.1 to mom”. Save mom in Payments first.");
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
      setStatus("⚠️ Please connect your wallet first");
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
      setStatus("🎤 Listening... (you can say “send 0.1 to mom”)");
      setTranscript("");
    };

    recognition.onresult = async (e: any) => {
      let text: string = e.results[0][0].transcript;
      // Voice often hears "dollar mom" — strip to plain "mom" so it matches saved contacts (no $ needed)
      text = text.replace(/\bdollar\s+([a-zA-Z0-9_\-]+)/gi, "$1");
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

  const executeTransfer = async (amount: number, to: string, label?: string) => {
    if (!address) {
      setStatus("⚠️ Wallet not connected");
      return;
    }

    try {
      setStatus("⏳ Checking balance & submitting...");
      console.log("Wallet", address, "Recipient", to, "Chain", chain);

      const hash = await sendNative(to, amount);
      const explorerUrl = explorerTxUrl(chain, hash);

      // Mirror to activity log (fans out to DronaHQ when configured)
      void fetch("/api/dronahq/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "send",
          amount,
          symbol,
          to,
          label,
          tx: hash,
          chain,
          user: address,
        }),
      }).catch(() => undefined);

      setStatus(
        <div style={{ color: "white" }}>
          <span style={{ color: "#10b981", fontWeight: "900" }}>✅ Success on {getChain(chain).label}!</span>
          <br />
          <span style={{ fontSize: "0.9rem" }}>Sent {amount} {symbol} → {label || to.slice(0, 8) + "..."}</span>
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
            View on explorer →
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
      {/* ★ Vertical contacts sidebar: recents → select → amount → pay */}
      <PaymentsDirectory symbol={symbol} disabled={!connected} onPay={directoryPay} />
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
              placeholder={`Send 0.1 ${symbol} to mom or 0x...`}
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
          ⚠️ Please connect your wallet ({getChain(chain).label}) to start
        </div>
      )}

      {/* Directory above already manages saved contacts; voice/text $handles resolve from the same book. */}
      <div style={{ display: "none" }}>{network}</div>
    </div>
  );
}
