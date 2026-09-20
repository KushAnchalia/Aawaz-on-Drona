import { NextResponse } from "next/server";
import { CHAIN_LIST } from "@/app/lib/chains";

export async function GET() {
  return NextResponse.json({
    app: "aawaz",
    version: "0.3.0",
    chains: CHAIN_LIST.map((c) => ({ id: c.id, label: c.label, family: c.family, symbol: c.symbol })),
    features: ["multi-chain", "address-book-$handle", "voice", "dronahq-embed"],
    time: new Date().toISOString(),
  });
}
