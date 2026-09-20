import type { ChainId } from "./chains";

/**
 * Address Book — save a person's number/address once,
 * then send with `$name` (voice or text).
 * e.g. save { name: "mom", address: "0x..." } → "send 0.1 MON to $mom"
 * Persisted in localStorage so it works in DronaHQ iframes too.
 */

export interface Contact {
  id: string;
  name: string; // lowercase handle, no spaces
  label: string; // display name
  address: string; // 0x... (EVM) or base58 (Solana)
  chain: ChainId;
  note?: string;
  createdAt: number;
}

const KEY = "aawaz.contacts.v1";

export function normalizeHandle(raw: string): string {
  return raw.trim().toLowerCase().replace(/^\$/, "").replace(/[^a-z0-9_\-]/g, "");
}

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seedContacts();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function seedContacts(): Contact[] {
  return [];
}

export function saveContacts(list: Contact[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(list));
  // Notify open pickers/forms in the same tab (storage event only fires cross-tab)
  window.dispatchEvent(new Event("aawaz-contacts-changed"));
  // Best-effort mirror to server (fans out to DronaHQ when configured)
  void pushContactsToServer(list);
}

/** Push local book to the server mirror (never throws). */
export async function pushContactsToServer(list: Contact[]): Promise<void> {
  try {
    await fetch("/api/dronahq/contacts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contacts: list }),
    });
  } catch {}
}

/** Pull server mirror and merge with local book (local entries win on conflict). */
export async function pullContactsFromServer(): Promise<Contact[]> {
  const local = loadContacts();
  try {
    const res = await fetch("/api/dronahq/contacts");
    if (!res.ok) return local;
    const data = await res.json();
    const remote: Contact[] = Array.isArray(data.contacts) ? data.contacts : [];
    const seen = new Set(local.map((c) => `${c.name}|${c.address}`.toLowerCase()));
    const merged = [...local];
    for (const c of remote) {
      if (!c?.name || !c?.address) continue;
      const k = `${c.name}|${c.address}`.toLowerCase();
      if (!seen.has(k)) {
        seen.add(k);
        merged.push({
          id: newId(),
          name: String(c.name),
          label: String(c.label || c.name),
          address: String(c.address),
          chain: (c.chain as ChainId) || "monad-testnet",
          createdAt: c.createdAt || Date.now(),
        });
      }
    }
    if (merged.length !== local.length) {
      localStorage.setItem(KEY, JSON.stringify(merged));
      window.dispatchEvent(new Event("aawaz-contacts-changed"));
    }
    return merged;
  } catch {
    return local;
  }
}

export function resolveContact(input: string | undefined, list: Contact[]): Contact | null {
  if (!input) return null;
  const t = input.trim();
  // direct address passthrough → no contact
  if (/^0x[a-fA-F0-9]{40}$/.test(t) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(t)) return null;
  const handle = normalizeHandle(t.replace(/^@/, ""));
  return list.find((c) => c.name === handle || c.label.toLowerCase() === t.toLowerCase()) ?? null;
}

/** Extract $handle tokens from free text, e.g. "send 0.5 sol to $mom" */
export function extractDollarHandle(text: string): string | null {
  const m = text.match(/\$([a-zA-Z0-9_\-]+)/);
  return m ? normalizeHandle(m[1]) : null;
}

/** Replace $handle with the contact's address for downstream parsers */
export function expandDollarHandles(text: string, list: Contact[]): string {
  return text.replace(/\$([a-zA-Z0-9_\-]+)/g, (full, h) => {
    const c = list.find((x) => x.name === normalizeHandle(h));
    return c ? c.address : full;
  });
}

export function isValidAddressForChain(address: string, chain: ChainId): boolean {
  const solana = chain.startsWith("solana");
  if (solana) return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address.trim());
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
