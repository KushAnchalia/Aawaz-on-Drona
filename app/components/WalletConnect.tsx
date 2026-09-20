"use client";

import { useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext";
import { isEmbeddedFrame } from "../context/WalletContext";
import { CHAIN_LIST, getChain, type ChainId } from "../lib/chains";

export default function WalletConnect() {
  const {
    connected,
    address,
    balance,
    connecting,
    chainId,
    connect,
    disconnect,
    refreshBalance,
    hasMetaMask,
    hasSolana,
    chain,
    setChain,
    symbol,
  } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);
  useEffect(() => {
    setEmbedded(isEmbeddedFrame());
  }, []);

  const openInTab = () => {
    // Break out of DronaHQ/portal iframes — wallets can't inject into frames
    // reliably, and MetaMask throws the 'origin' crash there.
    const url = window.location.href.replace(/[?&]embed=1/, "");
    window.open(url, "_blank", "noopener");
  };

  const onConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: any) {
      setError(err?.message || "Failed to connect wallet");
    }
  };

  const onRefresh = async () => {
    setLoading(true);
    try {
      await refreshBalance();
    } catch (err: any) {
      setError(err?.message || "Failed to refresh balance");
    } finally {
      setLoading(false);
    }
  };

  const cfg = getChain(chain);
  const isSol = cfg.family === "solana";
  const onCorrectNetwork = isSol ? true : chainId === cfg.chainId;
  const short = address && `${address.slice(0, 6)}...${address.slice(-4)}`;
  const needsWallet = isSol ? !hasSolana : !hasMetaMask;

  return (
    <div style={{ marginBottom: "2rem", textAlign: "center" }}>
      {embedded && !connected && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.4)",
            color: "#fcd34d",
            fontSize: "0.85rem",
          }}
        >
          Embedded view detected — wallets connect seamlessly in a full tab.{" "}
          <button
            onClick={openInTab}
            style={{
              marginLeft: "8px",
              padding: "5px 12px",
              borderRadius: "8px",
              border: "none",
              background: "#f59e0b",
              color: "black",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            Open in full tab ↗
          </button>
        </div>
      )}
      {/* ── Chain selector: Ethereum · Solana · Monad ── */}
      <label style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 800, letterSpacing: "1px" }}>
        CHOOSE CHAIN
      </label>
      <div
        style={{
          display: "flex",
          gap: "8px",
          justifyContent: "center",
          margin: "8px 0 12px",
          flexWrap: "wrap",
        }}
      >
        {CHAIN_LIST.map((c) => {
          const active = c.id === chain;
          return (
            <button
              key={c.id}
              onClick={() => setChain(c.id as ChainId)}
              title={`${c.label} (${c.symbol})`}
              style={{
                padding: "8px 14px",
                fontSize: "0.85rem",
                borderRadius: "10px",
                border: active ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                fontWeight: "800",
                background: active
                  ? "linear-gradient(135deg, #836EF9 0%, #200052 100%)"
                  : "rgba(30, 41, 59, 0.8)",
                color: "white",
              }}
            >
              {c.id.startsWith("ethereum") || c.id === "sepolia"
                ? "⟠ "
                : c.id.startsWith("solana")
                  ? "◎ "
                  : "🟣 "}
              {c.label.replace(" Mainnet", "").replace(" Testnet", "").replace("Ethereum ", "ETH ")}
            </button>
          );
        })}
      </div>

      {!connected ? (
        <button
          onClick={onConnect}
          disabled={connecting || needsWallet}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #836EF9, #200052)",
            color: "white",
            fontWeight: 800,
            cursor: connecting || needsWallet ? "not-allowed" : "pointer",
            opacity: connecting || needsWallet ? 0.7 : 1,
          }}
        >
          {connecting
            ? "Connecting..."
            : isSol
              ? hasSolana
                ? "Connect Phantom (Solana)"
                : "Install Phantom"
              : hasMetaMask
                ? `Connect Wallet (${cfg.label})`
                : "Install MetaMask"}
        </button>
      ) : (
        <button
          onClick={disconnect}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "#1e293b",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Disconnect {short}
        </button>
      )}

      {needsWallet && !connected && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#fbbf24" }}>
          {isSol ? (
            <>
              Install Phantom from{" "}
              <a href="https://phantom.app" target="_blank" rel="noreferrer" style={{ color: "#a78bfa" }}>
                phantom.app
              </a>
            </>
          ) : (
            <>
              Install MetaMask from{" "}
              <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: "#a78bfa" }}>
                metamask.io
              </a>
            </>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: "0.5rem",
            fontSize: "0.85rem",
            color: "#fca5a5",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "10px",
            padding: "10px 12px",
          }}
        >
          {error}
          {/blocked|overriding|full browser tab/i.test(error) && (
            <div style={{ marginTop: "6px", color: "#94a3b8", fontSize: "0.8rem" }}>
              Fixes: open in a full tab · unlock the wallet · set{" "}
              {isSol ? "Phantom" : "MetaMask"} as the default wallet · disable competing wallet extensions.
            </div>
          )}
        </div>
      )}

      {connected && address && (
        <div style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
          <div>
            Connected: {short} · {cfg.label}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "4px" }}>
            <span style={{ color: onCorrectNetwork ? "#34d399" : "#f87171" }}>
              {isSol ? `Solana · ${cfg.rpcUrl}` : onCorrectNetwork ? cfg.label : `Wrong chain (${chainId})`}
            </span>{" "}
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: "4px 8px",
                fontSize: "0.75rem",
                background: "#334155",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "not-allowed" : "pointer",
                marginLeft: "8px",
              }}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          <div
            style={{
              marginTop: "0.5rem",
              fontWeight: "bold",
              color: balance && balance > 0 ? "#10b981" : "#ef4444",
            }}
          >
            Balance: {balance !== null ? balance.toFixed(4) : "—"} {symbol}
          </div>
          {cfg.faucet && balance !== null && balance < 0.05 && (
            <a
              href={cfg.faucet}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginTop: "10px",
                padding: "5px 10px",
                fontSize: "0.8rem",
                background: "#836EF9",
                color: "white",
                borderRadius: "4px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Get test {symbol} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
