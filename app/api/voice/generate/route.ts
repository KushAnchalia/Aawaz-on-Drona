import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "ethers";
import { getWalletBalance } from "@/app/lib/monad";

/**
 * Voice generation gate — verifies the wallet has MON on Monad Testnet.
 * (Previously checked Solana token accounts.)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, wallet, agentId } = body;

    if (!prompt || !wallet) {
      return NextResponse.json({ error: "prompt and wallet required" }, { status: 400 });
    }

    if (!isAddress(wallet)) {
      return NextResponse.json({ error: "Invalid Monad / EVM wallet address" }, { status: 400 });
    }

    const balance = await getWalletBalance(wallet);
    if (balance <= 0) {
      return NextResponse.json(
        {
          error: "Wallet has 0 MON on Monad Testnet. Fund via https://faucet.monad.xyz",
          balance,
        },
        { status: 402 }
      );
    }

    // TTS is handled client-side / Fish Audio when configured
    return NextResponse.json({
      success: true,
      message: "Wallet verified on Monad Testnet",
      balance,
      agentId: agentId || null,
      chain: "monad-testnet",
      fallback: "browser-tts",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}
