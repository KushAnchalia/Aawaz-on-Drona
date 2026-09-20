import { BrowserProvider, JsonRpcProvider, formatEther, parseEther, isAddress } from "ethers";

/** ── Unified chain model: Ethereum · Solana · Monad ── */

export type ChainFamily = "evm" | "solana";
export type ChainId =
  | "ethereum"
  | "sepolia"
  | "monad-testnet"
  | "monad-mainnet"
  | "solana-devnet"
  | "solana-mainnet";

export interface ChainConfig {
  id: ChainId;
  label: string;
  family: ChainFamily;
  symbol: string;
  decimals: number;
  chainId?: number; // EVM only
  chainIdHex?: string; // EVM only
  rpcUrl: string;
  explorer: string;
  faucet?: string;
}

export const CHAINS: Record<ChainId, ChainConfig> = {
  ethereum: {
    id: "ethereum",
    label: "Ethereum Mainnet",
    family: "evm",
    symbol: "ETH",
    decimals: 18,
    chainId: 1,
    chainIdHex: "0x1",
    rpcUrl:
      process.env.NEXT_PUBLIC_ETH_RPC_URL || "https://ethereum-rpc.publicnode.com",
    explorer: "https://etherscan.io",
  },
  sepolia: {
    id: "sepolia",
    label: "Ethereum Sepolia",
    family: "evm",
    symbol: "ETH",
    decimals: 18,
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    rpcUrl:
      process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    explorer: "https://sepolia.etherscan.io",
    faucet: "https://sepoliafaucet.com",
  },
  "monad-testnet": {
    id: "monad-testnet",
    label: "Monad Testnet",
    family: "evm",
    symbol: "MON",
    decimals: 18,
    chainId: 10143,
    chainIdHex: "0x279f",
    rpcUrl: process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz",
    explorer: process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || "https://testnet.monadvision.com",
    faucet: "https://faucet.monad.xyz",
  },
  "monad-mainnet": {
    id: "monad-mainnet",
    label: "Monad Mainnet",
    family: "evm",
    symbol: "MON",
    decimals: 18,
    chainId: 143,
    chainIdHex: "0x8f",
    rpcUrl: process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC_URL || "https://rpc.monad.xyz",
    explorer: "https://monadscan.com",
  },
  "solana-devnet": {
    id: "solana-devnet",
    label: "Solana Devnet",
    family: "solana",
    symbol: "SOL",
    decimals: 9,
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC || "https://api.devnet.solana.com",
    explorer: "https://explorer.solana.com/?cluster=devnet",
    faucet: "https://faucet.solana.com",
  },
  "solana-mainnet": {
    id: "solana-mainnet",
    label: "Solana Mainnet",
    family: "solana",
    symbol: "SOL",
    decimals: 9,
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
    explorer: "https://explorer.solana.com",
  },
};

export const CHAIN_LIST: ChainConfig[] = Object.values(CHAINS);

export function getChain(id: ChainId): ChainConfig {
  return CHAINS[id];
}

export function isEvmChain(id: ChainId): boolean {
  return CHAINS[id].family === "evm";
}

export function explorerTxUrl(chain: ChainId, hash: string): string {
  const c = CHAINS[chain];
  if (c.family === "solana") return `${c.explorer}/tx/${hash}`;
  return `${c.explorer}/tx/${hash}`;
}

export function explorerAddressUrl(chain: ChainId, addr: string): string {
  const c = CHAINS[chain];
  if (c.family === "solana") return `${c.explorer}/address/${addr}`;
  return `${c.explorer}/address/${addr}`;
}

// ── EVM helpers (ethers v6) ──

export function getEvmProvider(chain: ChainId): JsonRpcProvider {
  const c = getChain(chain);
  if (c.family !== "evm" || !c.chainId) throw new Error(`${chain} is not an EVM chain`);
  return new JsonRpcProvider(c.rpcUrl, c.chainId);
}

export async function ensureEvmNetwork(ethereum: any, chain: ChainId): Promise<void> {
  const c = getChain(chain);
  if (c.family !== "evm") return;
  if (!ethereum) throw new Error("MetaMask not found. Install MetaMask to continue.");
  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: c.chainIdHex }],
    });
  } catch (err: any) {
    if (err?.code === 4902 || err?.code === -32603) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: c.chainIdHex,
            chainName: c.label,
            nativeCurrency: { name: c.symbol, symbol: c.symbol, decimals: c.decimals },
            rpcUrls: [c.rpcUrl],
            blockExplorerUrls: [c.explorer],
          },
        ],
      });
      return;
    }
    throw err;
  }
}

export async function sendEvmNative(
  provider: BrowserProvider,
  to: string,
  amount: number
): Promise<string> {
  if (!isAddress(to)) throw new Error("Invalid EVM recipient address");
  if (amount <= 0) throw new Error("Amount must be greater than 0");
  const signer = await provider.getSigner();
  const from = await signer.getAddress();
  const balance = await provider.getBalance(from);
  const value = parseEther(amount.toString());
  if (balance < value) {
    throw new Error(`Insufficient funds. Balance: ${formatEther(balance)}, need ${amount} + gas`);
  }
  const tx = await signer.sendTransaction({ to, value });
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction submitted but receipt missing");
  return receipt.hash;
}

// ── Back-compat re-exports for existing Monad code ──
export const MONAD_TESTNET = {
  chainId: 10143,
  chainIdHex: "0x279f",
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: [CHAINS["monad-testnet"].rpcUrl],
  blockExplorerUrls: [CHAINS["monad-testnet"].explorer],
  faucetUrl: "https://faucet.monad.xyz",
} as const;

export const MONAD_MAINNET = {
  chainId: 143,
  chainIdHex: "0x8f",
  name: "Monad Mainnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: [CHAINS["monad-mainnet"].rpcUrl],
  blockExplorerUrls: [CHAINS["monad-mainnet"].explorer],
} as const;

export type MonadNetwork = "testnet" | "mainnet";
export function getNetworkConfig(network: MonadNetwork = "testnet") {
  return network === "mainnet" ? MONAD_MAINNET : MONAD_TESTNET;
}
export const MONAD_RPC_URL = CHAINS["monad-testnet"].rpcUrl;
export const MONAD_MAINNET_RPC_URL = CHAINS["monad-mainnet"].rpcUrl;
export const MONAD_BASELINE_GWEI = Number(process.env.MONAD_BASELINE_GWEI) || 102;
export const MONAD_EXPLORER_URL = CHAINS["monad-testnet"].explorer;
export function getJsonRpcProvider(network: MonadNetwork = "testnet"): JsonRpcProvider {
  return getEvmProvider(network === "mainnet" ? "monad-mainnet" : "monad-testnet");
}
export function getExplorerTxUrl(txHash: string, network: MonadNetwork = "testnet"): string {
  return explorerTxUrl(network === "mainnet" ? "monad-mainnet" : "monad-testnet", txHash);
}
export function getExplorerAddressUrl(address: string, network: MonadNetwork = "testnet"): string {
  return explorerAddressUrl(network === "mainnet" ? "monad-mainnet" : "monad-testnet", address);
}
export function isValidMonadAddress(address: string): boolean {
  return isAddress(address);
}
export async function getWalletBalance(address: string, network: MonadNetwork = "testnet"): Promise<number> {
  const provider = getJsonRpcProvider(network);
  const balance = await provider.getBalance(address);
  return Number(formatEther(balance));
}
export async function ensureMonadNetwork(ethereum: any, network: MonadNetwork = "testnet"): Promise<void> {
  return ensureEvmNetwork(ethereum, network === "mainnet" ? "monad-mainnet" : "monad-testnet");
}
export async function sendNativeTransfer(provider: BrowserProvider, to: string, amountMon: number): Promise<string> {
  return sendEvmNative(provider, to, amountMon);
}
export async function getNetworkBlockNumber(network: MonadNetwork = "testnet"): Promise<number> {
  return getJsonRpcProvider(network).getBlockNumber();
}
export async function getGasPriceGwei(network: MonadNetwork = "testnet"): Promise<number> {
  const fee = await getJsonRpcProvider(network).getFeeData();
  return Number(fee.gasPrice ?? 0n) / 1e9;
}
