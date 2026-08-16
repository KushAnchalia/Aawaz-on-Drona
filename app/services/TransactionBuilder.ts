import {
  ContractTransaction,
  JsonRpcProvider,
  Wallet,
  parseEther,
  isAddress,
} from "ethers";
import { getJsonRpcProvider, MONAD_RPC_URL } from "../lib/monad";

/**
 * Lightweight EVM transaction builder for Monad Testnet.
 * Native MON transfers (18 decimals).
 */
export class TransactionBuilder {
  private provider: JsonRpcProvider;

  constructor() {
    this.provider = getJsonRpcProvider();
  }

  async buildTransfer(
    fromAddress: string,
    toAddress: string,
    amountMon: number
  ): Promise<{
    from: string;
    to: string;
    value: bigint;
    chainId: number;
  }> {
    if (!isAddress(fromAddress) || !isAddress(toAddress)) {
      throw new Error("Invalid EVM address");
    }

    return {
      from: fromAddress,
      to: toAddress,
      value: parseEther(amountMon.toString()),
      chainId: Number((await this.provider.getNetwork()).chainId),
    };
  }

  getRpcUrl() {
    return MONAD_RPC_URL;
  }
}

export const transactionBuilder = new TransactionBuilder();

export { Wallet, parseEther };
export type { ContractTransaction };
