import { NextResponse } from "next/server";
import { pushActivityEvent, isDronaSyncOn } from "@/app/lib/dronaSync";

/**
 * Payment activity log — mirrors successful sends for DronaHQ dashboards.
 * POST { type, amount?, symbol?, to?, label?, tx?, chain?, user? }
 * GET  ?user=<id>&limit=<n>  → recent entries (in-memory fallback)
 */

export type ActivityEntry = {
  type: string;
  amount?: number;
  symbol?: string;
  to?: string;
  label?: string;
  tx?: string;
  chain?: string;
  user?: string;
  at: number;
};

const log: ActivityEntry[] = (global as any).__aawazActivity ?? [];
(global as any).__aawazActivity = log;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const user = searchParams.get("user") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 200);
  const list = (user ? log.filter((e) => (e.user || "") === user) : log).slice(-limit).reverse();
  return NextResponse.json({ activity: list, count: list.length, synced: isDronaSyncOn() });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.type) return NextResponse.json({ error: "type required" }, { status: 400 });
    const entry: ActivityEntry = {
      type: String(body.type),
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      symbol: body.symbol ? String(body.symbol) : undefined,
      to: body.to ? String(body.to) : undefined,
      label: body.label ? String(body.label) : undefined,
      tx: body.tx ? String(body.tx) : undefined,
      chain: body.chain ? String(body.chain) : undefined,
      user: body.user ? String(body.user) : undefined,
      at: Date.now(),
    };
    log.push(entry);
    if (log.length > 500) log.splice(0, log.length - 500);
    pushActivityEvent(entry);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}
