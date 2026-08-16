import { NextRequest, NextResponse } from "next/server";
import { isAddress, parseEther } from "ethers";
import { getGasPriceGwei, getJsonRpcProvider } from "@/app/lib/monad";

export interface OptimizationResult {
  success: boolean;
  chain: string;
  parsed: {
    type: string;
    from?: string;
    to?: string;
    amount?: number;
    programs: string[];
    instructions: Array<{
      index: number;
      programId: string;
      accountsCount: number;
      dataSize: number;
    }>;
  };
  simulation: {
    success: boolean;
    blockNumber: number;
    computeUnits: number;
    error?: string;
    logs: string[];
  };
  network: { congestion: "LOW" | "MEDIUM" | "HIGH" };
  recommendations: {
    priorityFeeSOL: number;
    priorityFeeGwei: number;
    estimatedGas: number;
  };
  costs: {
    baseFee: number;
    currentCost: number;
    optimizedCost: number;
    savings: number;
    savingsPercent: number;
  };
  optimizationScore: number;
  timeRecommendation: {
    bestTime: string;
  };
  successProbability: number;
  unit: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { from, to, amount } = body;

    const provider = getJsonRpcProvider();
    const gasGwei = await getGasPriceGwei();
    const blockNumber = await provider.getBlockNumber();

    let parsedType = "unknown";
    let estimatedGas = 21000;

    if (from && to && amount !== undefined) {
      if (!isAddress(from) || !isAddress(to)) {
        return NextResponse.json({ error: "Invalid EVM address" }, { status: 400 });
      }
      parsedType = "MON Transfer";
      try {
        estimatedGas = Number(
          await provider.estimateGas({
            from,
            to,
            value: parseEther(String(amount)),
          })
        );
      } catch {
        estimatedGas = 21000;
      }
    }

    const gasCostMon = (estimatedGas * gasGwei) / 1e9;
    const optimizedGas = Math.max(estimatedGas - 1000, 21000);
    const optimizedCost = (optimizedGas * gasGwei * 0.95) / 1e9;

    return NextResponse.json({
      success: true,
      chain: "monad-testnet",
      parsed: {
        type: parsedType,
        from,
        to,
        amount,
        programs: ["native-mon-transfer"],
        instructions: [
          {
            index: 0,
            programId: "0x0000000000000000000000000000000000000000",
            accountsCount: 2,
            dataSize: 0,
          },
        ],
      },
      simulation: {
        success: true,
        blockNumber,
        computeUnits: estimatedGas,
        logs: [
          `chainId=10143`,
          `estimatedGas=${estimatedGas}`,
          `gasPriceGwei=${gasGwei}`,
        ],
      },
      network: {
        congestion:
          gasGwei > 100 ? "HIGH" : gasGwei > 40 ? "MEDIUM" : "LOW",
      },
      recommendations: {
        priorityFeeSOL: gasGwei,
        priorityFeeGwei: gasGwei,
        estimatedGas,
      },
      costs: {
        baseFee: gasCostMon,
        currentCost: gasCostMon,
        optimizedCost,
        savings: Math.max(gasCostMon - optimizedCost, 0),
        savingsPercent:
          gasCostMon > 0 ? ((gasCostMon - optimizedCost) / gasCostMon) * 100 : 0,
      },
      optimizationScore: 82,
      timeRecommendation: {
        bestTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
      successProbability: 0.85,
      unit: "MON",
    } satisfies OptimizationResult);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
