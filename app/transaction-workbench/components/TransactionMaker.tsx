"use client";
import { useState } from "react";

interface TransactionMakerProps {
  onAnalyze: (data: {
    type: "transfer" | "raw";
    from?: string;
    to?: string;
    amount?: number;
    rawTransaction?: string;
  }) => void;
  loading: boolean;
}

export default function TransactionMaker({ onAnalyze, loading }: TransactionMakerProps) {
  const [mode, setMode] = useState<"transfer" | "raw">("transfer");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [rawTransaction, setRawTransaction] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === "transfer") {
      if (!from || !to || !amount) {
        alert("Please fill in all fields");
        return;
      }
      onAnalyze({
        type: "transfer",
        from,
        to,
        amount: parseFloat(amount),
      });
    } else {
      if (!rawTransaction.trim()) {
        alert("Please paste a transaction");
        return;
      }
      onAnalyze({
        type: "raw",
        rawTransaction: rawTransaction.trim(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Mode Selector */}
      <div style={{ marginBottom: "1.5rem" }}>
        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
          Transaction Type
        </label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "transfer" | "raw")}
          style={{
            width: "100%",
            padding: "0.75rem",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            fontSize: "1rem",
          }}
        >
          <option value="transfer">MON Transfer</option>
          <option value="raw">Paste Raw Transaction</option>
        </select>
      </div>

      {mode === "transfer" ? (
        <>
          {/* From Address */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              From Address
            </label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Enter sender public key"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
              }}
            />
          </div>

          {/* To Address */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              To Address
            </label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Enter recipient public key"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
              }}
            />
          </div>

          {/* Amount */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
              Amount (MON)
            </label>
            <input
              type="number"
              step="0.000000001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              style={{
                width: "100%",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "1rem",
              }}
            />
          </div>
        </>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "500", color: "#333" }}>
            Raw Transaction (Base64 or Base58)
          </label>
          <textarea
            value={rawTransaction}
            onChange={(e) => setRawTransaction(e.target.value)}
            placeholder="Paste base64 or base58 encoded transaction"
            rows={8}
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              fontSize: "0.9rem",
              fontFamily: "monospace",
              resize: "vertical",
            }}
          />
        </div>
      )}

      {/* Analyze Button */}
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "1rem",
          backgroundColor: loading ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
      >
        {loading ? "⏳ Analyzing..." : "🔍 Analyze Transaction"}
      </button>
    </form>
  );
}

