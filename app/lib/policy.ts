// Policy engine for Monad native MON transfers

const DAILY_LIMIT_MON = 100.0;
const MAX_PER_TXN_MON = 20.0;

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export function validateTransfer(amount: number, to: string): PolicyResult {
  if (amount <= 0) {
    return { allowed: false, reason: "Amount must be greater than 0" };
  }

  if (amount > MAX_PER_TXN_MON) {
    return {
      allowed: false,
      reason: `Amount exceeds maximum per transaction (${MAX_PER_TXN_MON} MON)`,
    };
  }

  if (!to || (to !== "OWN_WALLET" && !/^0x[a-fA-F0-9]{40}$/.test(to))) {
    return { allowed: false, reason: "Invalid recipient address (expected 0x... EVM address)" };
  }

  void DAILY_LIMIT_MON; // reserved for future session tracking
  return { allowed: true };
}

export function isValidMonadAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** @deprecated use isValidMonadAddress */
export function isValidSolanaAddress(address: string): boolean {
  return isValidMonadAddress(address);
}
