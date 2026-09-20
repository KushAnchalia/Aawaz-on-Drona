import { NextResponse } from "next/server";
import { CHAINS } from "@/app/lib/chains";

/**
 * Solana helper for clients/DronaHQ that can't bundle web3.js.
 * Returns everything the browser needs to build + sign a transfer
 * with Phantom (fee payer = sender). No server key required.
 */
export async function POST(req: Request) {
  try {
    const { from, to, amount, cluster } = await req.json();
    const chainId = cluster === "solana-mainnet" ? "solana-mainnet" : "solana-devnet";
    const cfg = CHAINS[chainId];
    if (!from || !to || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "from, to, amount (>0) required" }, { status: 400 });
    }
    // fetch a fresh blockhash so the client tx doesn't expire
    const rpc = await fetch(cfg.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getLatestBlockhash", params: [{ commitment: "confirmed" }] }),
    });
    const j = await rpc.json();
    const blockhash = j?.result?.value?.blockhash;
    if (!blockhash) return NextResponse.json({ error: "solana RPC unavailable" }, { status: 502 });
    return NextResponse.json({
      from,
      to,
      lamports: Math.round(Number(amount) * 1e9),
      blockhash,
      rpcUrl: cfg.rpcUrl,
      explorer: cfg.explorer,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "bad request" }, { status: 400 });
  }
}
