"use client";

import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { MONAD_MAINNET_RPC_URL, MONAD_RPC_URL, MONAD_TESTNET, type MonadNetwork } from "../lib/monad";

export default function WalletConnect() {
  const {
    connected,
    address,
    balance,
    connecting,
    chainId,
    connect,
    disconnect,
    switchNetwork,
    refreshBalance,
    hasMetaMask,
    network,
  } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConnect = async () => {
    setError(null);
    try {
      await connect();
    } catch (err: any) {
      setError(err?.message || "Failed to connect MetaMask");
    }
  };

  const onRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshBalance();
    } catch (err: any) {
      setError(err?.message || "Failed to refresh balance");
    } finally {
      setLoading(false);
    }
  };

  const onSwitch = async (target: MonadNetwork) => {
    setError(null);
    try {
      await switchNetwork(target);
    } catch (err: any) {
      setError(err?.message || "Failed to switch network");
    }
  };

  const activeRpc = network === "mainnet" ? MONAD_MAINNET_RPC_URL : MONAD_RPC_URL;
  const onCorrectNetwork = chainId === (network === "mainnet" ? 143 : MONAD_TESTNET.chainId);
  const networkLabel = network === "mainnet" ? "Monad Mainnet" : "Monad Testnet";
  const short =
    address && `${address.slice(0, 6)}...${address.slice(-4)}`;

  const toggleButton = (target: MonadNetwork) => ({
    padding: "8px 16px",
    fontSize: "0.85rem",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    fontWeight: "800",
    background: network === target ? "linear-gradient(135deg, #836EF9 0%, #200052 100%)" : "rgba(30, 41, 59, 0.8)",
    color: "white",
    transition: "all 0.3s",
    opacity: connected ? 1 : 0.8,
  });

  return (
    <div style={{ marginBottom: "2rem", textAlign: "center" }}>
      {/* Network Toggle */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "1rem" }}>
        <button onClick={() => onSwitch("testnet")} style={toggleButton("testnet")}>
          🧪 Testnet
        </button>
        <button onClick={() => onSwitch("mainnet")} style={toggleButton("mainnet")}>
          🌐 Mainnet
        </button>
      </div>

      {!connected ? (
        <button
          onClick={onConnect}
          disabled={connecting || !hasMetaMask}
          style={{
            padding: "12px 20px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #836EF9, #200052)",
            color: "white",
            fontWeight: 800,
            cursor: connecting || !hasMetaMask ? "not-allowed" : "pointer",
            opacity: connecting || !hasMetaMask ? 0.7 : 1,
          }}
        >
          {connecting
            ? "Connecting..."
            : hasMetaMask
              ? "Connect MetaMask"
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

      {!hasMetaMask && (
        <div style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "#fbbf24" }}>
          Install MetaMask from{" "}
          <a href="https://metamask.io" target="_blank" rel="noreferrer" style={{ color: "#a78bfa" }}>
            metamask.io
          </a>
        </div>
      )}

      {connected && address && (
        <div style={{ marginTop: "1rem", color: "#94a3b8", fontSize: "0.9rem" }}>
          <div>Connected: {short}</div>

          <div
            style={{
              fontSize: "0.8rem",
              color: "#888",
              marginBottom: "0.2rem",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: onCorrectNetwork ? "#34d399" : "#f87171" }}>
              Network: {onCorrectNetwork ? networkLabel : `Wrong chain (${chainId})`}
            </span>
            <span style={{ fontSize: "0.7rem" }}>({activeRpc})</span>
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
            Balance: {balance !== null ? balance.toFixed(4) : "—"} MON
          </div>

          {error && (
            <div style={{ marginTop: "0.25rem", fontSize: "0.8rem", color: "#ef4444" }}>
              {error}
            </div>
          )}

          {balance !== null && balance < 0.1 && network === "testnet" && (
            <a
              href={MONAD_TESTNET.faucetUrl}
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
              Get Testnet MON ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}
