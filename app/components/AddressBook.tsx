"use client";

import { useEffect, useState } from "react";
import { CHAIN_LIST, type ChainId } from "../lib/chains";
import {
  isValidAddressForChain,
  loadContacts,
  normalizeHandle,
  newId,
  saveContacts,
  type Contact,
} from "../lib/contacts";

export function useAddressBook() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  useEffect(() => {
    setContacts(loadContacts());
  }, []);
  const persist = (list: Contact[]) => {
    setContacts(list);
    saveContacts(list);
  };
  return { contacts, persist };
}

export default function AddressBook({ compact = false }: { compact?: boolean }) {
  const { contacts, persist } = useAddressBook();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<ChainId>("monad-testnet");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const add = () => {
    setError(null);
    const handle = normalizeHandle(name);
    if (!handle) {
      setError("Enter a handle like mom, alice, vault");
      return;
    }
    if (contacts.some((c) => c.name === handle)) {
      setError(`$${handle} already exists — delete it first to replace.`);
      return;
    }
    if (!isValidAddressForChain(address, chain)) {
      setError(
        chain.startsWith("solana")
          ? "Invalid Solana address (base58, 32–44 chars)"
          : "Invalid EVM address (0x + 40 hex chars)"
      );
      return;
    }
    const c: Contact = {
      id: newId(),
      name: handle,
      label: name.trim().replace(/^\$/, ""),
      address: address.trim(),
      chain,
      createdAt: Date.now(),
    };
    persist([c, ...contacts]);
    setName("");
    setAddress("");
  };

  const remove = (id: string) => persist(contacts.filter((c) => c.id !== id));

  const copyHint = (c: Contact) => {
    navigator.clipboard?.writeText(`$${c.name}`).catch(() => undefined);
    setCopied(c.id);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        border: "1px solid rgba(167,139,250,0.25)",
        borderRadius: "18px",
        padding: compact ? "16px" : "22px",
        marginTop: "16px",
      }}
    >
      <h3 style={{ color: "white", margin: 0, fontSize: "1.05rem", fontWeight: 900 }}>
        📖 Address Book — save once, send with <code style={{ color: "#a78bfa" }}>$name</code>
      </h3>
      <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: "6px 0 14px" }}>
        Say or type “send 0.1 MON to <strong style={{ color: "white" }}>$mom</strong>”. Works with voice
        🎙️ and text. Bookmarks are stored locally (and syncable via DronaHQ API).
      </p>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="$handle — e.g. mom"
          style={inputStyle}
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={chain.startsWith("solana") ? "Solana address (base58)" : "0x address"}
          style={{ ...inputStyle, minWidth: "260px", flex: 2 }}
        />
        <select value={chain} onChange={(e) => setChain(e.target.value as ChainId)} style={inputStyle}>
          {CHAIN_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <button onClick={add} style={addStyle}>
          ＋ Save
        </button>
      </div>
      {error && <div style={{ color: "#f87171", fontSize: "0.85rem", marginBottom: "8px" }}>{error}</div>}

      {contacts.length === 0 ? (
        <div style={{ color: "#64748b", fontSize: "0.85rem" }}>
          No bookmarks yet. Save your first contact above — e.g. <code>$mom</code>.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {contacts.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(30,41,59,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "10px 12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  background: "linear-gradient(135deg,#836EF9,#200052)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontWeight: 900,
                  color: "white",
                  fontSize: "0.85rem",
                }}
              >
                ${c.name}
              </span>
              <span style={{ color: "white", fontWeight: 700, fontSize: "0.9rem" }}>{c.label}</span>
              <code style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
                {c.address.slice(0, 10)}…{c.address.slice(-6)}
              </code>
              <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                {CHAIN_LIST.find((x) => x.id === c.chain)?.label ?? c.chain}
              </span>
              <span style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
                <button onClick={() => copyHint(c)} style={miniBtn}>
                  {copied === c.id ? "✓ Copied" : "Copy $tag"}
                </button>
                <button onClick={() => remove(c.id)} style={{ ...miniBtn, color: "#fca5a5" }}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.7)",
  color: "white",
  fontSize: "0.9rem",
  outline: "none",
  flex: 1,
  minWidth: "140px",
};

const addStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#836EF9,#200052)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const miniBtn: React.CSSProperties = {
  padding: "5px 10px",
  fontSize: "0.75rem",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.6)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};
