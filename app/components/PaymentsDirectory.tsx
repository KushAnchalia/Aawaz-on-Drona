"use client";

import { useEffect, useMemo, useState } from "react";
import { CHAIN_LIST, type ChainId } from "../lib/chains";
import {
  isValidAddressForChain,
  loadContacts,
  newId,
  normalizeHandle,
  pullContactsFromServer,
  saveContacts,
  type Contact,
} from "../lib/contacts";

interface PaymentsDirectoryProps {
  symbol: string;
  disabled?: boolean;
  onPay: (contact: Contact, amount: number) => Promise<void> | void;
}

const AVATAR_COLORS = [
  "linear-gradient(135deg,#4285F4,#0b57d0)",
  "linear-gradient(135deg,#34A853,#137333)",
  "linear-gradient(135deg,#FBBC04,#B06000)",
  "linear-gradient(135deg,#EA4335,#7f1d1d)",
  "linear-gradient(135deg,#9C27B0,#4a148c)",
  "linear-gradient(135deg,#00BCD4,#006064)",
  "linear-gradient(135deg,#FF6D00,#E65100)",
  "linear-gradient(135deg,#836EF9,#200052)",
];

function colorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function shortAddr(a: string): string {
  if (a.length <= 14) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
function initial(name: string): string {
  const t = (name || "?").trim().replace(/^\$/, "");
  return (t.charAt(0) || "?").toUpperCase();
}

const RECENT_KEY = "aawaz.recent_payees.v1";
function loadRecents(): string[] {
  try {
    const arr = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function pushRecent(id: string) {
  try {
    const cur = loadRecents().filter((x) => x !== id);
    localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...cur].slice(0, 8)));
  } catch {}
}

const QUICK_AMOUNTS = ["0.01", "0.05", "0.1", "0.5"];

/** Vertical sidebar directory: recents → contacts → select → amount → pay. */
export default function PaymentsDirectory({ symbol, disabled, onPay }: PaymentsDirectoryProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [chain, setChain] = useState<ChainId>("monad-testnet");
  const [formError, setFormError] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>([]);

  const reload = () => {
    let list = loadContacts();
    const FAKE = new Set([
      "0x1111111111111111111111111111111111111111",
      "0x2222222222222222222222222222222222222222",
      "0x3333333333333333333333333333333333333333",
      "0x4444444444444444444444444444444444444444",
    ]);
    if (list.some((c) => FAKE.has(c.address))) {
      list = list.filter((c) => !FAKE.has(c.address));
      try {
        saveContacts(list);
      } catch {}
    }
    setContacts(list);
    try {
      setRecents(loadRecents());
    } catch {}
    // Merge server mirror (DronaHQ) in the background
    void pullContactsFromServer().then((merged) => setContacts(merged));
  };

  useEffect(() => {
    reload();
    window.addEventListener("storage", reload);
    window.addEventListener("aawaz-contacts-changed", reload);
    return () => {
      window.removeEventListener("storage", reload);
      window.removeEventListener("aawaz-contacts-changed", reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (list: Contact[]) => {
    setContacts(list);
    saveContacts(list);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\$/, "").replace(/^@/, "");
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const recentContacts = useMemo(
    () => recents.map((id) => contacts.find((c) => c.id === id)).filter(Boolean) as Contact[],
    [recents, contacts]
  );

  const selected = contacts.find((c) => c.id === selectedId) ?? null;
  const amountNum = Number(amount);

  const handlePay = async () => {
    if (!selected || !amountNum || amountNum <= 0 || paying) return;
    setPaying(true);
    try {
      await onPay(selected, amountNum);
      pushRecent(selected.id);
      setRecents(loadRecents());
      setAmount("");
      setSelectedId(null);
    } finally {
      setPaying(false);
    }
  };

  const addContact = () => {
    setFormError(null);
    const handle = normalizeHandle(name);
    if (!handle) {
      setFormError("Enter a name like mom, alice, vault");
      return;
    }
    if (contacts.some((c) => c.name === handle)) {
      setFormError(`${handle} already exists — delete it first to replace.`);
      return;
    }
    if (!isValidAddressForChain(address, chain)) {
      setFormError(
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
    setShowAdd(false);
    setSelectedId(c.id);
  };

  const remove = (id: string) => {
    persist(contacts.filter((c) => c.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setAmount("");
    }
  };

  return (
    <div style={card}>
      {/* header: title + small ＋ icon */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={logoBadge}>₹</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: 900, fontSize: "1.05rem" }}>
            Contacts · {contacts.length}
          </div>
          <div style={{ color: "#94a3b8", fontSize: "0.75rem" }}>pay in {symbol}</div>
        </div>
        <button onClick={() => setShowAdd((v) => !v)} style={iconBtn} title="Add people">
          {showAdd ? "✕" : "＋"}
        </button>
      </div>

      {/* search */}
      <div style={searchWrap}>
        <span style={{ color: "#94a3b8" }}>🔍</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search name or address'
          style={searchInput}
        />
        {query && (
          <button onClick={() => setQuery("")} style={clearBtn}>
            ✕
          </button>
        )}
      </div>

      {/* add form */}
      {showAdd && (
        <div style={addBox}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name — e.g. mom" style={{ ...miniInput, flex: 1, minWidth: "120px" }} />
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={chain.startsWith("solana") ? "Solana address" : "0x address"} style={{ ...miniInput, flex: 2, minWidth: "200px" }} />
            <select value={chain} onChange={(e) => setChain(e.target.value as ChainId)} style={miniInput}>
              {CHAIN_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <button onClick={addContact} style={saveBtn}>
              Save
            </button>
          </div>
          {formError && <div style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "8px" }}>{formError}</div>}
        </div>
      )}

      {/* recents */}
      <div style={{ marginTop: "14px" }}>
        <div style={sectionTitle}>🕘 Recents</div>
        {recentContacts.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "6px" }}>
            No recents yet — people you pay appear here.
          </div>
        ) : (
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "8px 2px" }}>
            {recentContacts.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedId(c.id === selectedId ? null : c.id);
                  setAmount("");
                }}
                style={recentBtn(c.id === selectedId)}
              >
                <span style={avatar(c.name, "46px", "1.2rem")}>{initial(c.label || c.name)}</span>
                <span style={recentName}>{c.label || c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* vertical contacts list */}
      <div style={{ marginTop: "14px" }}>
        <div style={sectionTitle}>Contacts</div>
        {contacts.length === 0 ? (
          <div style={emptyMini}>
            <div style={{ fontSize: "2rem" }}>👥</div>
            <div style={{ color: "white", fontWeight: 800, marginTop: "6px", fontSize: "0.88rem" }}>No contacts yet</div>
            <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "4px" }}>
              Tap ＋ above to save your first contact.
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "8px" }}>
            No match for “{query}”.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
            {filtered.map((c) => {
              const active = c.id === selectedId;
              const chainLabel = CHAIN_LIST.find((x) => x.id === c.chain)?.label ?? c.chain;
              return (
                <div key={c.id} style={rowCard(active)}>
                  <button
                    onClick={() => {
                      setSelectedId(active ? null : c.id);
                      setAmount("");
                    }}
                    style={rowBtn}
                  >
                    <span style={avatar(c.name, "42px", "1.15rem")}>{initial(c.label || c.name)}</span>
                    <span style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                      <span style={personName}>{c.label || c.name}</span>
                      <span style={personSub}>
                        <code style={{ color: "#94a3b8" }}>{shortAddr(c.address)}</code> · {chainLabel}
                      </span>
                    </span>
                    <span style={{ color: active ? "#a78bfa" : "#475569", fontWeight: 900 }}>›</span>
                  </button>
                  {active && (
                    <div style={payPane}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {QUICK_AMOUNTS.map((q) => (
                          <button key={q} onClick={() => setAmount(q)} style={chip(amount === q)}>
                            {q}
                          </button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                          placeholder={`0.00 ${symbol}`}
                          inputMode="decimal"
                          autoFocus
                          style={amountInput}
                        />
                        <button
                          onClick={handlePay}
                          disabled={disabled || !amountNum || amountNum <= 0 || paying}
                          style={payBtn(!disabled && amountNum > 0 && !paying)}
                        >
                          {paying ? "…" : `Pay →`}
                        </button>
                      </div>
                      <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                        <button
                          onClick={() => navigator.clipboard?.writeText(c.address).catch(() => undefined)}
                          style={linkBtn}
                        >
                          Copy
                        </button>
                        <button onClick={() => remove(c.id)} style={{ ...linkBtn, color: "#fca5a5" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── styles ── */
const card: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.6)",
  border: "1px solid rgba(167,139,250,0.25)",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "16px",
};
const logoBadge: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  background: "linear-gradient(135deg,#4285F4,#34A853)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.2rem",
  color: "white",
  fontWeight: 900,
};
const iconBtn: React.CSSProperties = {
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  border: "1px solid rgba(167,139,250,0.4)",
  background: "rgba(131,110,249,0.15)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: "1rem",
  lineHeight: 1,
};
const searchWrap: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginTop: "12px",
  padding: "9px 14px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.7)",
};
const searchInput: React.CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  color: "white",
  fontSize: "0.88rem",
  outline: "none",
};
const clearBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
};
const addBox: React.CSSProperties = {
  marginTop: "10px",
  background: "rgba(131,110,249,0.08)",
  border: "1px solid rgba(167,139,250,0.3)",
  borderRadius: "12px",
  padding: "12px",
};
const sectionTitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "1px",
};
const avatar = (name: string, size: string, fontSize: string): React.CSSProperties => ({
  width: size,
  height: size,
  minWidth: size,
  borderRadius: "50%",
  background: colorFor(name),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: 900,
  fontSize,
});
const recentBtn = (active: boolean): React.CSSProperties => ({
  minWidth: "64px",
  border: active ? "2px solid #a78bfa" : "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
  background: active ? "rgba(131,110,249,0.2)" : "rgba(30,41,59,0.5)",
  padding: "8px 6px",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "5px",
});
const recentName: React.CSSProperties = {
  color: "white",
  fontSize: "0.7rem",
  fontWeight: 700,
  maxWidth: "64px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const emptyMini: React.CSSProperties = { textAlign: "center", padding: "18px 8px" };
const rowCard = (active: boolean): React.CSSProperties => ({
  background: active ? "rgba(131,110,249,0.14)" : "rgba(30,41,59,0.55)",
  border: active ? "1px solid rgba(167,139,250,0.5)" : "1px solid rgba(255,255,255,0.07)",
  borderRadius: "14px",
  padding: "10px 12px",
});
const rowBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  padding: 0,
};
const personName: React.CSSProperties = {
  display: "block",
  color: "white",
  fontSize: "0.88rem",
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const personSub: React.CSSProperties = {
  display: "block",
  color: "#64748b",
  fontSize: "0.7rem",
  marginTop: "2px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const payPane: React.CSSProperties = {
  marginTop: "10px",
  background: "rgba(2,6,23,0.55)",
  border: "1px solid rgba(167,139,250,0.25)",
  borderRadius: "10px",
  padding: "10px",
};
const chip = (active: boolean): React.CSSProperties => ({
  padding: "4px 12px",
  borderRadius: "20px",
  border: active ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.12)",
  background: active ? "rgba(131,110,249,0.25)" : "transparent",
  color: active ? "white" : "#94a3b8",
  fontSize: "0.75rem",
  fontWeight: 800,
  cursor: "pointer",
});
const amountInput: React.CSSProperties = {
  flex: 1,
  minWidth: "110px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.8)",
  color: "white",
  fontSize: "1rem",
  fontWeight: 800,
  outline: "none",
};
const payBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  borderRadius: "10px",
  border: "none",
  background: active ? "linear-gradient(135deg,#10b981,#059669)" : "#475569",
  color: "white",
  fontWeight: 900,
  cursor: active ? "pointer" : "not-allowed",
});
const linkBtn: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#6366f1",
  fontSize: "0.78rem",
  fontWeight: 700,
  cursor: "pointer",
  padding: 0,
};
const miniInput: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(2,6,23,0.7)",
  color: "white",
  fontSize: "0.88rem",
  outline: "none",
};
const saveBtn: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg,#836EF9,#200052)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};
