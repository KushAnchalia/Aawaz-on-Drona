import { NextResponse } from "next/server";
import { pushContactEvent, isDronaSyncOn } from "@/app/lib/dronaSync";

/**
 * DronaHQ bridge — address book as a REST data source + sync target.
 * - DronaHQ REST connector → GET  /api/dronahq/contacts?user=<id>&q=<search>
 * - POST   single upsert  { name, label, address, chain, note?, user? }
 * - PUT    bulk replace   { contacts: [...], user? }  (authoritative mirror)
 * - DELETE ?name=<handle>&user=<id>
 *
 * Browser localStorage stays the offline-first source of truth; every
 * mutation here also fans out to DRONAHQ_SYNC_URL when configured.
 */

type Stored = {
  name: string;
  label: string;
  address: string;
  chain: string;
  note?: string;
  user?: string;
  createdAt: number;
};

// In-memory fallback (swap for real DB in production)
const store: Stored[] = (global as any).__aawazContacts ?? [];
(global as any).__aawazContacts = store;

function normalizeName(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\$/, "")
    .replace(/[^a-z0-9_\-]/g, "");
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user") || undefined;
  const q = (searchParams.get("q") || "").toLowerCase();
  let list = user ? store.filter((c) => (c.user || "") === user) : store;
  if (q) list = list.filter((c) => c.name.includes(q) || c.label.toLowerCase().includes(q));
  return NextResponse.json({ contacts: list, count: list.length, synced: isDronaSyncOn() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, address, chain, label, note, user } = body ?? {};
    if (!name || !address || !chain) {
      return NextResponse.json(
        { error: "name, address, chain are required" },
        { status: 400 }
      );
    }
    const handle = normalizeName(name);
    if (!handle) return NextResponse.json({ error: "invalid name" }, { status: 400 });
    const key = user || "";
    const existing = store.find((c) => c.name === handle && (c.user || "") === key);
    const row: Stored = {
      name: handle,
      label: label || handle,
      address: String(address).trim(),
      chain: String(chain),
      note,
      user,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    if (existing) Object.assign(existing, row);
    else store.unshift(row);
    pushContactEvent("upsert", [row]);
    return NextResponse.json({ ok: true, contact: row }, { status: existing ? 200 : 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const incoming: Stored[] = Array.isArray(body?.contacts) ? body.contacts : [];
    const user = body?.user || "";
    const clean: Stored[] = [];
    for (const c of incoming) {
      const handle = normalizeName((c as any)?.name);
      if (!handle || !(c as any)?.address || !(c as any)?.chain) continue;
      clean.push({
        name: handle,
        label: (c as any).label || handle,
        address: String((c as any).address).trim(),
        chain: String((c as any).chain),
        note: (c as any).note,
        user: (c as any).user ?? (user || undefined),
        createdAt: (c as any).createdAt || Date.now(),
      });
    }
    // Replace this user's slice (or everything when no user scoping)
    for (let i = store.length - 1; i >= 0; i--) {
      if (!user || (store[i].user || "") === user) store.splice(i, 1);
    }
    store.unshift(...clean);
    pushContactEvent("replace", clean);
    return NextResponse.json({ ok: true, count: clean.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = normalizeName(searchParams.get("name"));
    const user = searchParams.get("user") || "";
    if (!handle) return NextResponse.json({ error: "name required" }, { status: 400 });
    const before = store.length;
    for (let i = store.length - 1; i >= 0; i--) {
      if (store[i].name === handle && (store[i].user || "") === user) store.splice(i, 1);
    }
    const removed = before - store.length;
    if (removed > 0) pushContactEvent("delete", [{ name: handle, user }]);
    return NextResponse.json({ ok: true, removed });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}
