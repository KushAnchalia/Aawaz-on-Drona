import { NextRequest, NextResponse } from "next/server";
import { getGasPriceGwei, getJsonRpcProvider, getNetworkBlockNumber, getNetworkConfig, MONAD_BASELINE_GWEI, MonadNetwork } from "@/app/lib/monad";

async function fetchTps(
  network: MonadNetwork
): Promise<{ tps: number | null; blockNumber: number | null }> {
  try {
    const provider = getJsonRpcProvider(network);
    const blockNumber = await provider.getBlockNumber();

    // Sample recent blocks and measure real throughput from block timestamps
    const sampleSize = 5;
    const blocks = [];
    for (let i = 0; i < sampleSize; i++) {
      const block = await provider.getBlock(blockNumber - i);
      if (block) blocks.push(block);
    }
    if (blocks.length < 2) {
      return { tps: null, blockNumber };
    }

    const totalTxs = blocks.reduce((acc, b) => acc + (b.transactions?.length || 0), 0);
    const first = blocks[blocks.length - 1];
    const last = blocks[0];
    const elapsedSec = Math.max(Number(last.timestamp) - Number(first.timestamp), 1);

    const tps = Math.round((totalTxs / elapsedSec) * 10) / 10;
    return { tps, blockNumber };
  } catch {
    // RPC rate limits / timeouts must not take down the whole status endpoint
    return { tps: null, blockNumber: null };
  }
}

export async function GET(req: NextRequest) {
  const requested = req.nextUrl.searchParams.get("network") || "testnet";
  const network: MonadNetwork = requested === "mainnet" ? "mainnet" : "testnet";
  const cfg = getNetworkConfig(network);

  try {
    const [gasGwei, blockNumber] = await Promise.all([
      getGasPriceGwei(network),
      getNetworkBlockNumber(network),
    ]);
    const { tps } = await fetchTps(network);

    // Monad uses a fixed ~102 gwei baseline gas price (same on testnet & mainnet).
    // Measure congestion relative to that baseline, not raw gwei.
    const BASELINE_GWEI = MONAD_BASELINE_GWEI;
    const ratio = gasGwei / BASELINE_GWEI;
    let congestionLevel = "LOW";
    if (ratio >= 2) congestionLevel = "HIGH";
    else if (ratio >= 1.5) congestionLevel = "MEDIUM";

    return NextResponse.json({
      status: "operational",
      network: cfg.name,
      networkType: network,
      chainId: cfg.chainId,
      tps,
      averageFee: Math.round(gasGwei * 100) / 100,
      congestionLevel,
      slot: blockNumber,
      blockNumber,
      unit: "gwei",
    });
  } catch (error: any) {
    return NextResponse.json({
      status: "degraded",
      network: cfg.name,
      networkType: network,
      chainId: cfg.chainId,
      tps: null,
      averageFee: 0,
      congestionLevel: "LOW",
      slot: 0,
      blockNumber: 0,
      error: error.message,
    });
  }
}