"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import Navigation from "../components/Navigation";
import TransactionMaker from "./components/TransactionMaker";
import TransactionAnalyzer from "./components/TransactionAnalyzer";
import TransactionOptimizer from "./components/TransactionOptimizer";
import { OptimizationResult } from "../../app/api/transaction/optimize/route";

const DynamicTransactionAgent = dynamic(() => import("../components/TransactionAgent"), {
  ssr: false,
});

export default function TransactionWorkbenchPage() {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (data: {
    type: "transfer" | "raw";
    from?: string;
    to?: string;
    amount?: number;
    rawTransaction?: string;
  }) => {
    setLoading(true);
    setError(null);
    setOptimizationResult(null);

    try {
      const response = await fetch("/api/transaction/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction: data.rawTransaction,
          from: data.from,
          to: data.to,
          amount: data.amount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze transaction");
      }

      const result = await response.json();
      setOptimizationResult(result);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: "2rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <div style={{ maxWidth: "1600px", margin: "0 auto" }}>
        <Navigation />
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "0.5rem",
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          🔧 Transaction Workbench
        </h1>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.9)", marginBottom: "2rem" }}>
          Analyze, optimize, and prepare transactions before execution
        </p>

        {/* Voice Agent Integration */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}>
            🎤 Voice Agent - Create Transactions by Voice
          </h3>
          <DynamicTransactionAgent />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {/* LEFT: Transaction Maker */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
              📝 Transaction Maker
            </h2>
            <TransactionMaker onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* CENTER: Transaction Analyzer */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
              🔍 Transaction Analyzer
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                Analyzing transaction...
              </div>
            ) : error ? (
              <div style={{ padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "8px", color: "#991b1b" }}>
                ❌ {error}
              </div>
            ) : optimizationResult ? (
              <TransactionAnalyzer result={optimizationResult} />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                Create or paste a transaction to analyze
              </div>
            )}
          </div>

          {/* RIGHT: Transaction Optimizer */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "1.5rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#333" }}>
              ⚡ Transaction Optimizer
            </h2>
            {loading ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
                <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
                Optimizing...
              </div>
            ) : optimizationResult ? (
              <TransactionOptimizer result={optimizationResult} />
            ) : (
              <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                Optimization recommendations will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

