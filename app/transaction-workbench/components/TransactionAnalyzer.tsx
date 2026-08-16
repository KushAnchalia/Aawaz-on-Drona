"use client";
import { OptimizationResult } from "@/app/api/transaction/optimize/route";

interface TransactionAnalyzerProps {
  result: OptimizationResult;
}

export default function TransactionAnalyzer({ result }: TransactionAnalyzerProps) {
  return (
    <div>
      {/* Transaction Type */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Transaction Type</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>{result.parsed.type}</div>
      </div>

      {/* Programs Involved */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Programs Involved</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {result.parsed.programs.map((program, idx) => (
            <span
              key={idx}
              style={{
                padding: "0.25rem 0.75rem",
                backgroundColor: "#e0e7ff",
                color: "#1e40af",
                borderRadius: "6px",
                fontSize: "0.85rem",
                fontFamily: "monospace",
              }}
            >
              {program.slice(0, 8)}...
            </span>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Instructions</div>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb" }}>
                <th style={{ padding: "0.5rem", textAlign: "left", fontSize: "0.85rem", color: "#666" }}>Index</th>
                <th style={{ padding: "0.5rem", textAlign: "left", fontSize: "0.85rem", color: "#666" }}>Program</th>
                <th style={{ padding: "0.5rem", textAlign: "left", fontSize: "0.85rem", color: "#666" }}>Accounts</th>
                <th style={{ padding: "0.5rem", textAlign: "left", fontSize: "0.85rem", color: "#666" }}>Data Size</th>
              </tr>
            </thead>
            <tbody>
              {result.parsed.instructions.map((ix) => (
                <tr key={ix.index} style={{ borderTop: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "0.5rem", fontSize: "0.9rem" }}>{ix.index}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.85rem", fontFamily: "monospace" }}>
                    {ix.programId.slice(0, 8)}...
                  </td>
                  <td style={{ padding: "0.5rem", fontSize: "0.9rem" }}>{ix.accountsCount}</td>
                  <td style={{ padding: "0.5rem", fontSize: "0.9rem" }}>{ix.dataSize} bytes</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compute Units */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Compute Units</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
          {result.simulation.computeUnits.toLocaleString()}
        </div>
      </div>

      {/* Simulation Result */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Simulation Result</div>
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: result.simulation.success ? "#d1fae5" : "#fee2e2",
            color: result.simulation.success ? "#065f46" : "#991b1b",
            borderRadius: "8px",
            fontWeight: "500",
          }}
        >
          {result.simulation.success ? "✅ Success" : "❌ Failed"}
        </div>
        {result.simulation.error && (
          <div
            style={{
              marginTop: "0.5rem",
              padding: "0.75rem",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            {result.simulation.error}
          </div>
        )}
      </div>

      {/* Logs */}
      {result.simulation.logs.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.5rem" }}>Simulation Logs</div>
          <div
            style={{
              padding: "0.75rem",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              maxHeight: "200px",
              overflowY: "auto",
              fontSize: "0.8rem",
              fontFamily: "monospace",
            }}
          >
            {result.simulation.logs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: "0.25rem", color: "#666" }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estimated Base Fee */}
      <div>
        <div style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.25rem" }}>Estimated Base Fee</div>
        <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#333" }}>
          {result.costs.baseFee.toFixed(6)} MON
        </div>
      </div>
    </div>
  );
}

