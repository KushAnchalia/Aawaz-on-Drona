export interface ParsedIntent {
  action:
    | "transfer_mon"
    | "transfer_sol" // legacy alias — treat as transfer_mon
    | "analyze_transaction"
    | "get_balance"
    | "get_address"
    | "clarify"
    | "cancel"
    | "buy";
  status?: "ACTION_REQUIRED" | "READY_FOR_CONFIRMATION" | "EXECUTED";
  amount?: number;
  to?: string;
  from?: string;
  rawTransaction?: string;
  error?: string;
  asset?: string;
  execution_path?: "CEX" | "DEX";
  exchange?: string;
  price_type?: "MARKET" | "LIMIT";
  requires_confirmation?: boolean;
  supported_exchanges?: string[];
  message?: string;
}

// System prompt for intent parsing
const SYSTEM_PROMPT = `You are the Link-First Buy Execution Router for Aawaz on Monad Testnet.
Your responsibility is to ensure that NO buy action is attempted unless an exchange is linked.

Allowed actions:
- buy: ACQUIRE assets via CEX or DEX
- transfer_mon: MOVE existing MON (native Monad token) to an EVM address (0x...)
- analyze_transaction: Analyze a transaction
- get_balance: Check MON balance
- get_address: Get public address
- clarify: Request info
- cancel: Stop process

Address format: Ethereum-style 0x + 40 hex characters.
Native asset symbol: MON (NOT SOL).

────────────────────────
MANDATORY LINKING RULE
────────────────────────
1. "buy" ALWAYS means ACQUIRE.
2. IF linked_exchanges is missing or empty, you MUST return:
   {
     "action": "buy",
     "status": "ACTION_REQUIRED",
     "message": "To buy, please link a centralized exchange first.",
     "supported_exchanges": ["Binance", "Coinbase", "OKX", "Bybit", "CoinDCX"]
   }
3. NEVER assume a default exchange if none is linked.

────────────────────────
SUPPORTED EXCHANGES
────────────────────────
Binance, Coinbase, OKX, Bybit, CoinDCX

────────────────────────
FLOW
────────────────────────
- No link -> ACTION_REQUIRED
- Link exists but no confirmation -> READY_FOR_CONFIRMATION
- Execution granted -> EXECUTED (handled by execution logic)

Example Ready Response:
{
  "action": "buy",
  "status": "READY_FOR_CONFIRMATION",
  "exchange": "Binance",
  "asset": "MON",
  "amount": 0.2,
  "price_type": "MARKET"
}

Example Transfer:
{
  "action": "transfer_mon",
  "amount": 0.1,
  "to": "0x1234567890123456789012345678901234567890"
}`;
// Parse response and extract JSON
function extractJSON(text: string): ParsedIntent | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ParsedIntent;
    }
    return null;
  } catch {
    return null;
  }
}

// Option 1: Ollama (Open Source - Local or Remote)
async function parseWithOllama(text: string, systemPrompt: string): Promise<ParsedIntent> {
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1";

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content || "";

    const parsed = extractJSON(content);
    if (parsed) return parsed;

    // Fallback: try direct parse
    try {
      return JSON.parse(content) as ParsedIntent;
    } catch {
      return extractJSON(content) || { action: "clarify" };
    }
  } catch (error) {
    console.error("Ollama error:", error);
    throw error;
  }
}

// Option 2: Hugging Face Inference API (Open Source Models)
async function parseWithHuggingFace(text: string, systemPrompt: string): Promise<ParsedIntent> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HUGGINGFACE_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  if (!apiKey) {
    throw new Error("HUGGINGFACE_API_KEY not set");
  }

  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: `<s>[INST] ${systemPrompt}\n\nUser: ${text} [/INST]`,
          parameters: {
            return_full_text: false,
            temperature: 0.1,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text || "" : data.generated_text || "";

    const parsed = extractJSON(content);
    if (parsed) return parsed;

    return { action: "clarify" };
  } catch (error) {
    console.error("Hugging Face error:", error);
    throw error;
  }
}

// Option 3: Groq (Fast inference with open models)
async function parseWithGroq(text: string, systemPrompt: string): Promise<ParsedIntent> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

  if (!apiKey) {
    throw new Error("GROQ_API_KEY not set");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "";

    if (!content) {
      return { action: "clarify" };
    }

    try {
      return JSON.parse(content) as ParsedIntent;
    } catch {
      return extractJSON(content) || { action: "clarify" };
    }
  } catch (error) {
    console.error("Groq error:", error);
    throw error;
  }
}

// Main function - tries providers in order
export async function parseIntent(text: string, customPrompt?: string): Promise<ParsedIntent> {
  const provider = process.env.LLM_PROVIDER || "groq";

  // Use custom prompt if provided (for voice agents)
  const systemPrompt = customPrompt
    ? `${customPrompt}\n\nYou are helping with Solana transactions. Parse the user's intent and return JSON.`
    : SYSTEM_PROMPT;

  try {
    switch (provider.toLowerCase()) {
      case "ollama":
        return await parseWithOllama(text, systemPrompt);
      case "huggingface":
      case "hf":
        return await parseWithHuggingFace(text, systemPrompt);
      case "groq":
        return await parseWithGroq(text, systemPrompt);
      default:
        // Default to Ollama
        return await parseWithOllama(text, systemPrompt);
    }
  } catch (error: any) {
    console.warn("LLM parsing failed, falling back to regex:", error);
    return parseWithRegex(text);
  }
}

// Fallback: Regex-based parsing for demo stability (multi-chain: EVM + Solana + saved contact names)
export function parseWithRegex(text: string): ParsedIntent {
  const lower = text.toLowerCase();
  const EVM_ADDR = /0x[a-fA-F0-9]{40}/;
  const SOL_ADDR = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/;
  const HANDLE = /\$([a-zA-Z0-9_\-]+)/;

  // Helper: plain saved-contact name after "to"/"for" (e.g. "send 0.5 to mom", "pay 0.1 mod to alice").
  // Skips reserved words and a lone "dollar" from cut-off voice transcripts.
  const RESERVED = new Set(["me", "my", "wallet", "dollar", "to", "for", "the", "a"]);
  const plainNameAfterTo = (): string | undefined => {
    const matches = [...text.matchAll(/(?:\bto\b|\bfor\b)\s+(?:dollar\s+)?\$?@?([a-zA-Z][a-zA-Z0-9_\-]*)/gi)];
    for (let i = matches.length - 1; i >= 0; i--) {
      const w = (matches[i][1] || "").toLowerCase();
      if (w && !RESERVED.has(w)) return matches[i][1];
    }
    return undefined;
  };

  // 1. Strict match: send/transfer/pay X [symbol-typo tolerant] to 0x... | sol-addr | $handle | plain name | "me"/"my wallet"
  const strictMatch = text.match(
    /(?:send|transfer|pay)\s+([\d.]+)\s*[a-zA-Z]*\s+to\s+(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}|\$[a-zA-Z0-9_\-]+|@[a-zA-Z0-9_\-]+|my wallet|me|[a-zA-Z][a-zA-Z0-9_\-]*)/i
  );
  if (strictMatch) {
    const rawTo = strictMatch[2];
    const lowTo = rawTo.toLowerCase();
    if (!RESERVED.has(lowTo)) {
      return {
        action: "transfer_mon",
        amount: parseFloat(strictMatch[1]),
        to: rawTo,
        asset: "MON",
      };
    }
    // lone "dollar" etc — fall through to generic handling (amount known, recipient missing)
    if (!isNaN(parseFloat(strictMatch[1]))) {
      return { action: "transfer_mon", amount: parseFloat(strictMatch[1]), to: undefined, asset: "MON" };
    }
  }

  const isAcquisition =
    lower.includes("buy") ||
    lower.includes("purchase") ||
    lower.includes("acquire") ||
    lower.includes("buye") ||
    (lower.includes("get") && !lower.includes("address") && !lower.includes("balance"));
  const isTransfer =
    lower.includes("send") ||
    lower.includes("transfer") ||
    lower.includes("give") ||
    lower.includes("pay");

  const amountMatch = lower.match(
    /(?:buy|send|get|transfer|want|me|a|some|acquire|pay)\s+([\d.]+)\s*(?:mon|monad|eth|ether|sol|solana)?/i
  );
  const addressMatch = text.match(EVM_ADDR) || text.match(SOL_ADDR);
  const handleMatch = text.match(HANDLE);

  if (isAcquisition && !isTransfer) {
    return {
      action: "buy",
      status: "ACTION_REQUIRED",
      amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
      asset: "MON",
      message: "Please link a supported exchange to continue",
      supported_exchanges: ["Binance", "Coinbase", "OKX", "Bybit", "CoinDCX"],
    };
  }

  if (isTransfer || amountMatch || addressMatch || handleMatch) {
    const amount = amountMatch ? parseFloat(amountMatch[1]) : undefined;
    const plain = plainNameAfterTo();
    const to = addressMatch
      ? addressMatch[0]
      : handleMatch
        ? handleMatch[0] // keep $handle — resolved against address book downstream
        : plain
          ? plain // plain saved-contact name, e.g. "mom"
          : lower.includes("my wallet") || lower.includes("me some")
            ? "OWN_WALLET"
            : undefined;

    if (amount || to || lower.includes("send") || lower.includes("transfer")) {
      return {
        action: "transfer_mon",
        amount,
        to,
        asset: "MON",
      };
    }
  }

  if (
    lower.includes("hyperliquid") ||
    lower.includes("trade") ||
    lower.includes("perp") ||
    lower.includes("long") ||
    lower.includes("short") ||
    lower.includes("leverage")
  ) {
    return { action: "analyze_transaction", rawTransaction: text };
  }

  if (lower.includes("analyze") && (lower.includes("transaction") || lower.includes("tx"))) {
    return { action: "analyze_transaction", rawTransaction: text };
  }

  if (
    lower.includes("address") ||
    lower.includes("public key") ||
    lower.includes("what is my account") ||
    lower.includes("who am i")
  ) {
    return { action: "get_address" };
  }

  if (
    lower.includes("balance") ||
    lower.includes("how much mon") ||
    lower.includes("how much sol") ||
    (lower.includes("my account") && !lower.includes("buy"))
  ) {
    return { action: "get_balance" };
  }

  const looksLikeStopLoss = lower.match(/stop\s*(?:loss|loss at|at|is)?\s*[\d.]+/);
  if (lower.includes("cancel") || (lower.includes("stop") && !looksLikeStopLoss)) {
    return { action: "cancel" };
  }

  return { action: "clarify" };
}
