import { NextRequest, NextResponse } from "next/server";
import { parseIntent } from "../../../lib/ai";

// PROVIDED SYSTEM PROMPT
const HYPERLIQUID_SYSTEM_PROMPT = `You are an AI trading assistant that executes cryptocurrency perpetual trades
ONLY on behalf of a single authorized user.

Your role is to:
1. Convert voice or text instructions into structured trading intents
2. Validate every intent against strict risk and safety rules
3. Output a machine-readable trade instruction ONLY if all rules pass
4. REFUSE and EXPLAIN if any rule is violated

🛑 HARD RISK RULES (NON-NEGOTIABLE)
MAX_LEVERAGE = 5x
MAX_RISK_PER_TRADE = 1% of account
MAX_DAILY_LOSS = 3% of account
ALLOWED_ASSETS = [BTC, ETH, SOL]
STOP_LOSS_REQUIRED = true

Enforcement rules:
- If leverage > 5 → REFUSE
- If risk > 1% → REFUSE
- If no stop-loss → REFUSE
- If asset not in [BTC, ETH, SOL] → REFUSE

🧾 OUTPUT FORMAT (STRICT)
If trade is APPROVED, output ONLY valid JSON:
{
  "status": "APPROVED",
  "action": "OPEN_POSITION",
  "asset": "BTC",
  "direction": "LONG",
  "order_type": "MARKET",
  "leverage": 3,
  "position_size_percent": 1,
  "stop_loss": 50000,
  "take_profit": 60000,
  "notes": "User voice command parsed successfully"
}

If trade is REJECTED, output ONLY valid JSON:
{
  "status": "REJECTED",
  "reason": "Leverage exceeds maximum allowed (5x)",
  "suggestion": "Reduce leverage to 5x or lower"
}

🧠 INTERPRETATION RULES
"Go big", "all in" -> REJECT
"Scalp" -> ask clarification
"Breakout" -> require price
NEVER assume missing values.`;

// Heuristic fallback for demo stability when LLM is offline
function parseHyperliquidHeuristic(text: string): any {
    const lower = text.toLowerCase();

    // Extract asset
    let asset = "SOL";
    if (lower.includes("btc")) asset = "BTC";
    else if (lower.includes("eth")) asset = "ETH";

    // Extract direction
    const direction = lower.includes("short") || lower.includes("sell") ? "SHORT" : "LONG";

    // Extract leverage
    const leverageMatch = lower.match(/(\d+)\s*x/);
    const leverage = leverageMatch ? parseInt(leverageMatch[1]) : 3; // Default 3x

    // Extract risk/size
    const riskMatch = lower.match(/(?:risk|size)\s*([\d.]+)\s*%/);
    const risk = riskMatch ? parseFloat(riskMatch[1]) : 1; // Default 1%

    // Extract Stop Loss (Required by policy)
    const slMatch = lower.match(/(?:stop|sl|loss)\s*(?:at|loss|loss at|is)?\s*([\d.]+)/);
    const stopLoss = slMatch ? parseFloat(slMatch[1]) : null;

    // VALIDATION against provided Hard Risk Rules
    if (leverage > 5) {
        return {
            status: "REJECTED",
            reason: "Leverage exceeds maximum allowed (5x)",
            suggestion: "Reduce leverage to 5x or lower for safety."
        };
    }

    if (risk > 1) {
        return {
            status: "REJECTED",
            reason: "Risk size exceeds 1% of account",
            suggestion: "Set risk to 1% or lower per trade."
        };
    }

    if (!stopLoss) {
        return {
            status: "REJECTED",
            reason: "Stop-loss is MANDATORY",
            suggestion: "Specify a stop-loss price (e.g. 'stop at 3150')"
        };
    }

    if (!["BTC", "ETH", "SOL"].includes(asset)) {
        return {
            status: "REJECTED",
            reason: "Asset not in allowlist (BTC, ETH, SOL)",
            suggestion: "Trade only supported assets for now."
        };
    }

    return {
        status: "APPROVED",
        action: "OPEN_POSITION",
        asset,
        direction,
        order_type: "MARKET",
        leverage,
        position_size_percent: risk,
        stop_loss: stopLoss,
        take_profit: lower.match(/(?:tp|target|take profit)\s*(?:at)?\s*([\d.]+)/)?.[1] || null,
        notes: "Parsed using high-integrity heuristic engine"
    };
}

export async function POST(req: NextRequest) {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No input provided" }, { status: 400 });
        }

        try {
            // Try LLM first
            const result = await parseIntent(text, HYPERLIQUID_SYSTEM_PROMPT);

            // If LLM returned a standard Solana intent or clarify, but input looks like a trade, try heuristic
            if (result.action === "clarify" || result.action === "transfer_sol") {
                const heuristic = parseHyperliquidHeuristic(text);
                // Only return heuristic if it actually found a trade or gave a rejection reason
                if (heuristic.status === "REJECTED" || (heuristic.status === "APPROVED" && lower_includes_trade(text))) {
                    return NextResponse.json(heuristic);
                }
            }

            return NextResponse.json(result);
        } catch (err) {
            // Fallback to heuristic
            return NextResponse.json(parseHyperliquidHeuristic(text));
        }
    } catch (error: any) {
        console.error("Hyperliquid trade error:", error);
        return NextResponse.json({
            status: "REJECTED",
            reason: error.message || "Failed to process trade request",
            suggestion: "Try speaking your trade clearly (e.g. 'Long BTC at 60k, 3x leverage, 1% risk, stop at 58k')"
        }, { status: 500 });
    }
}

function lower_includes_trade(text: string): boolean {
    const l = text.toLowerCase();
    return l.includes("long") || l.includes("short") || l.includes("buy") || l.includes("sell") || l.includes("trade") || l.includes("position");
}
