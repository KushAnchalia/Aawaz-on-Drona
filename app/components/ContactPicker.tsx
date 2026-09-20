"use client";

import { useMemo, useState } from "react";
import { CHAIN_LIST } from "../lib/chains";
import type { Contact } from "../lib/contacts";

interface ContactPickerProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  amount: string;
  onAmountChange: (v: string) => void;
  onPay: () => void;
  symbol: string;
  disabled?: boolean;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#836EF9,#200052)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,#f59e0b,#b45309)",
  "linear-gradient(135deg,#ef4444,#7f1d1d)",
  "linear-gradient(135deg,#06b6d4,#0e7490)",
  "linear-gradient(135deg,#ec4899,#831843)",
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export default function ContactPicker({
  contacts,
  selectedId,
  onSelect,
  amount,
  onAmountChange,
  onPay,
  symbol,
  disabled,
}: ContactPickerProps) {
  const [query, setQuery] = useState("");
  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\$/, "");
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(167,139,250,0.25)",
        borderRadius: "18px",
        padding: "18px",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "1.4rem" }}>💸</span>
        <div>
          <div style={{ color: "white", fontWeight: 900, fontSize: "1.05rem" }}>
            {selected ? `Pay $${selected.name}` : "Send money — pick a contact"}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
            {selected
              ? `${selected.label} · pay in ${symbol}`
              : "Search or tap a person, enter amount, hit Pay"}
          </div>
        </div>
      </div>

      {/* Search — like GPay/PhonePe */}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search name, $handle or address…"
        style={{
          width: "100%",
          marginTop: "12px",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(2,6,23,0.7)",
          color: "white",
          fontSize: "0.9rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {contacts.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "10px" }}>
          No contacts yet — add one in the <strong style={{ color: "white" }}>Address Book</strong> below,
          then pick them here like GPay/PhonePe.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "10px" }}>
          No match for “{query}”. Try another name or save it in the Address Book below.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              padding: "14px 2px 6px",
            }}
          >
            {filtered.map((c) => {
              const active = c.id === selectedId;
              const chainLabel = CHAIN_LIST.find((x) => x.id === c.chain)?.label ?? c.chain;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelect(active ? null : c.id)}
                  title={`${c.label} ($${c.name}) · ${chainLabel} · ${c.address}`}
                  style={{
                    minWidth: "86px",
                    border: active ? "2px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    background: active ? "rgba(131,110,249,0.2)" : "rgba(30,41,59,0.5)",
                    padding: "12px 8px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: colorFor(c.name),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 900,
                      fontSize: "1.2rem",
                    }}
                  >
                    {(c.label || c.name).charAt(0).toUpperCase()}
                  </span>
                  <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 800 }}>${c.name}</span>
                  <span style={{ color: "#64748b", fontSize: "0.65rem" }}>
                    {chainLabel.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
          {selected && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                background: "rgba(131,110,249,0.1)",
                border: "1px solid rgba(167,139,250,0.35)",
                borderRadius: "14px",
                padding: "12px",
              }}
            >
              <span
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: colorFor(selected.name),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 900,
                }}
              >
                {(selected.label || selected.name).charAt(0).toUpperCase()}
              </span>
              <div style={{ color: "white", fontWeight: 800, fontSize: "0.9rem" }}>
                ${selected.name}
                <span style={{ color: "#94a3b8", fontWeight: 400 }}> · {selected.label}</span>
              </div>
              <button onClick={() => onSelect(null)} style={ghostBtn} title="Clear selection">
                ✕
              </button>
              <input
                value={amount}
                onChange={(e) => onAmountChange(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder={`0.00 ${symbol}`}
                inputMode="decimal"
                style={{
                  flex: 1,
                  minWidth: "120px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(2,6,23,0.7)",
                  color: "white",
                  fontSize: "1rem",
                  outline: "none",
                }}
              />
              <button
                onClick={onPay}
                disabled={disabled || !amount || Number(amount) <= 0}
                style={{
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  background:
                    !disabled && amount && Number(amount) > 0
                      ? "linear-gradient(135deg,#10b981,#059669)"
                      : "#475569",
                  color: "white",
                  fontWeight: 900,
                  cursor: !disabled && amount && Number(amount) > 0 ? "pointer" : "not-allowed",
                }}
              >
                Pay {symbol} →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: "0.8rem",
};
