import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the Sign Language Intent Capture Agent for Awaz.

Your role is to understand user intent exclusively from VISUAL human expression, including:
- Uploaded videos or recorded gestures
- Sign language (ASL/ISL equivalents)
- Demonstrative actions or facial expressions

Your goal is to convert these visual human expressions into a structured, executable Web3 use case.

──────────────
INPUT HANDLING
──────────────
1. Detect sign language, gestures, facial expressions, or demonstrated actions from the visual input.
2. Infer intent from motion, symbols, or repeated actions.
3. If input is ambiguous, provide a best-guess intent but flag low confidence.

──────────────
INTENT EXTRACTION
──────────────
Convert all inputs into a standardized JSON intent format:

{
  "intent_type": "TRANSFER | TRADE | NFT | CONTRACT | QUERY | OTHER",
  "action": "brief action description",
  "asset": "SOL | TOKEN | NFT | CONTRACT",
  "amount": "numeric or null",
  "recipient": "wallet address or identifier",
  "constraints": {
    "confirmation_required": true
  },
  "confidence_score": 0.0 - 1.0
}

──────────────
ACCESSIBILITY RULES
──────────────
- Focus on users who communicate using sign language or gestures.
- Prefer non-verbal confirmation flows.
- If confidence_score < 0.7, do NOT execute directly.

──────────────
SECURITY & SAFETY
──────────────
- Require explicit confirmation before executing.
- Reject sign impersonation without verified consent NFT.

──────────────
OUTPUT
──────────────
Return:
1. Parsed intent JSON
2. Human-readable explanation
3. Required confirmation steps
4. Recommended agent to execute the task

You are precise, visual-first, and inclusive.`;

export async function POST(req: NextRequest) {
    try {
        const { text, modality } = await req.json();

        // Specific mock logic for visual/sign intents
        const lower = (text || "").toLowerCase();

        let intent: any = {
            intent_type: "OTHER",
            action: "Analyzing visual expression...",
            asset: null,
            amount: null,
            recipient: null,
            constraints: { confirmation_required: true },
            confidence_score: 0.8
        };

        let explanation = "Detected visual intent, but details are unclear. Please repeat the gesture.";
        let agent = "router";

        if (lower.includes("send") || lower.includes("transfer") || lower.includes("money") || lower.includes("gesture")) {
            intent = {
                intent_type: "TRANSFER",
                action: "Visual Sign: Transfer MON",
                asset: "MON",
                amount: 0.1,
                recipient: "Recent Contact",
                confidence_score: 0.95
            };
            explanation = "Captured Sign Language: You want to send 0.1 MON to your most recent contact.";
            agent = "transaction";
        } else if (lower.includes("build") || lower.includes("create")) {
            intent = {
                intent_type: "CONTRACT",
                action: "Visual Sign: Program Creation",
                asset: "CONTRACT",
                confidence_score: 0.9
            };
            explanation = "Captured Sign Language: Intent to open the Smart Contract Creator.";
            agent = "contract_creator";
        } else if (lower.includes("trade") || lower.includes("perp")) {
            intent = {
                intent_type: "TRADE",
                action: "Visual Sign: Hyperliquid Trade",
                asset: "PERP",
                confidence_score: 0.85
            };
            explanation = "Captured Gesture: Open Hyperliquid Trading Agent.";
            agent = "hyperliquid";
        }

        return NextResponse.json({
            intent,
            explanation,
            confirmation_steps: ["Visual Confirmation", "Haptic Feedback"],
            recommended_agent: agent
        });

    } catch (error) {
        return NextResponse.json({ error: "Failed to process visual intent" }, { status: 500 });
    }
}
