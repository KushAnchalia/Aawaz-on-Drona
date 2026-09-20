/**
 * Outbound DronaHQ sync — pushes app data (contacts, activity) to the
 * user's DronaHQ backend (Sheets/DB via their REST endpoint or automation
 * webhook). Fully optional: when DRONAHQ_SYNC_URL is unset everything is a
 * no-op and the app keeps working offline-first on localStorage.
 *
 * Env:
 *   DRONAHQ_SYNC_URL  e.g. https://<your-dronahq>/api/sheets/rows  (or automation webhook)
 *   DRONAHQ_SYNC_KEY  bearer token for that endpoint
 *   DRONAHQ_SYNC_TABLE_CONTACTS / _ACTIVITY  table/sheet names (defaults below)
 */

const SYNC_URL = process.env.DRONAHQ_SYNC_URL || "";
const SYNC_KEY = process.env.DRONAHQ_SYNC_KEY || "";

export const CONTACTS_TABLE = process.env.DRONAHQ_SYNC_TABLE_CONTACTS || "aawaz_contacts";
export const ACTIVITY_TABLE = process.env.DRONAHQ_SYNC_TABLE_ACTIVITY || "aawaz_activity";

export function isDronaSyncOn(): boolean {
  return Boolean(SYNC_URL);
}

type SyncResult = { ok: boolean; skipped?: boolean; error?: string };

async function push(payload: Record<string, unknown>): Promise<SyncResult> {
  if (!SYNC_URL) return { ok: false, skipped: true };
  try {
    const res = await fetch(SYNC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SYNC_KEY ? { Authorization: `Bearer ${SYNC_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `DronaHQ sync ${res.status}: ${t.slice(0, 160)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || "sync failed" };
  }
}

/** Fire-and-forget — never throws, never blocks the user flow. */
export function pushContactEvent(
  action: "upsert" | "delete" | "replace",
  contacts: unknown
): void {
  void push({ table: CONTACTS_TABLE, action, contacts, at: Date.now() }).then((r) => {
    if (!r.ok && !r.skipped) console.warn("[drona-sync] contacts:", r.error);
  });
}

export function pushActivityEvent(entry: {
  type: string;
  amount?: number;
  symbol?: string;
  to?: string;
  label?: string;
  tx?: string;
  chain?: string;
  user?: string;
}): void {
  void push({ table: ACTIVITY_TABLE, action: "append", entry, at: Date.now() }).then((r) => {
    if (!r.ok && !r.skipped) console.warn("[drona-sync] activity:", r.error);
  });
}
