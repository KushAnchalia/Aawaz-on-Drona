"use client";
import { OptimizationResult } from "@/app/api/transaction/optimize/route";

interface TransactionOptimizerProps {
  result: OptimizationResult;
}

export default function TransactionOptimizer({ result }: TransactionOptimizerProps) {
  const congestionColors = {
    LOW: "#10b981",
    MEDIUM: "#f59e0b",
    HIGH: "#ef4444",
  };

  return (
    <div>
      {/* Network Congestion */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Network Congestion</div>
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: congestionColors[result.network.congestion] + "20",
            color: congestionColors[result.network.congestion],
            borderRadius: "8px",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          {result.network.congestion}
        </div>
      </div>

      {/* Recommended Priority Fee */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Recommended Priority Fee</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
          {result.recommendations.priorityFeeSOL.toFixed(6)} gwei / MON fee
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>
          {(result.recommendations.priorityFeeSOL * 1e9).toLocaleString()} lamports)
        </div>
      </div>

      {/* Recommended Compute Unit Limit */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Recommended Compute Unit Limit</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
          {result.recommendations.estimatedGas.toLocaleString()}
        </div>
      </div>

      {/* Cost Comparison */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Cost Comparison</div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "#666" }}>Current Cost:</span>
            <span style={{ fontWeight: "500" }}>{result.costs.currentCost.toFixed(6)} SOL</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "#666" }}>Optimized Cost:</span>
            <span style={{ fontWeight: "500", color: "#10b981" }}>
              {result.costs.optimizedCost.toFixed(6)} SOL
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "0.5rem",
              borderTop: "1px solid #e5e7eb",
              fontWeight: "bold",
            }}
          >
            <span>Savings:</span>
            <span style={{ color: result.costs.savings >= 0 ? "#10b981" : "#ef4444" }}>
              {result.costs.savings >= 0 ? "+" : ""}
              {result.costs.savings.toFixed(6)} SOL ({result.costs.savingsPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Best Execution Time */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Best Execution Time</div>
        <div style={{ fontSize: "0.9rem", fontWeight: "500", color: "#333" }}>
          {new Date(result.timeRecommendation.bestTime).toLocaleString()}
        </div>
        <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>UTC</div>
      </div>

      {/* Success Probability */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>
          Success Probability: {(result.successProbability * 100).toFixed(1)}%
        </div>
        <div
          style={{
            width: "100%",
            height: "24px",
            backgroundColor: "#e5e7eb",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${result.successProbability * 100}%`,
              height: "100%",
              backgroundColor: result.successProbability > 0.7 ? "#10b981" : result.successProbability > 0.4 ? "#f59e0b" : "#ef4444",
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Optimization Score */}
      <div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Optimization Score</div>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            textAlign: "center",
            color:
              result.optimizationScore >= 70
                ? "#10b981"
                : result.optimizationScore >= 40
                ? "#f59e0b"
                : "#ef4444",
          }}
        >
          {result.optimizationScore}/100
        </div>
      </div>
    </div>
  );
}

