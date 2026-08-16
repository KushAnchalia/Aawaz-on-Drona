import { BrowserProvider, JsonRpcProvider, formatEther, parseEther, isAddress } from "ethers";

/** Monad Testnet — required network for Monad Blitz hackathons */
export const MONAD_TESTNET = {
  chainId: 10143,
  chainIdHex: "0x279f",
  name: "Monad Testnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://testnet-rpc.monad.xyz"],
  blockExplorerUrls: ["https://testnet.monadvision.com"],
  faucetUrl: "https://faucet.monad.xyz",
} as const;

/** Monad Mainnet — production network (chain ID 143 / 0x8f) */
export const MONAD_MAINNET = {
  chainId: 143,
  chainIdHex: "0x8f",
  name: "Monad Mainnet",
  nativeCurrency: {
    name: "MON",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: ["https://rpc.monad.xyz"],
  blockExplorerUrls: ["https://monadscan.com"],
} as const;

export type MonadNetwork = "testnet" | "mainnet";

export function getNetworkConfig(network: MonadNetwork = "testnet") {
  return network === "mainnet" ? MONAD_MAINNET : MONAD_TESTNET;
}

export const MONAD_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_RPC_URL || MONAD_TESTNET.rpcUrls[0];

export const MONAD_MAINNET_RPC_URL =
  process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC_URL || MONAD_MAINNET.rpcUrls[0];

export const MONAD_BASELINE_GWEI = Number(process.env.MONAD_BASELINE_GWEI) || 102;

export const MONAD_EXPLORER_URL =
  process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL || MONAD_TESTNET.blockExplorerUrls[0];

export function getJsonRpcProvider(network: MonadNetwork = "testnet"): JsonRpcProvider {
  const cfg = getNetworkConfig(network);
  const url = network === "mainnet" ? MONAD_MAINNET_RPC_URL : MONAD_RPC_URL;
  return new JsonRpcProvider(url, cfg.chainId);
}

export function getExplorerTxUrl(txHash: string, network: MonadNetwork = "testnet"): string {
  const base = network === "mainnet" ? MONAD_MAINNET.blockExplorerUrls[0] : MONAD_EXPLORER_URL;
  return `${base}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, network: MonadNetwork = "testnet"): string {
  const base = network === "mainnet" ? MONAD_MAINNET.blockExplorerUrls[0] : MONAD_EXPLORER_URL;
  return `${base}/address/${address}`;
}

export function isValidMonadAddress(address: string): boolean {
  return isAddress(address);
}

export async function getWalletBalance(
  address: string,
  network: MonadNetwork = "testnet"
): Promise<number> {
  const provider = getJsonRpcProvider(network);
  const balance = await provider.getBalance(address);
  return Number(formatEther(balance));
}

/** Switch MetaMask to the selected Monad network (adds network if missing). */
export async function ensureMonadNetwork(
  ethereum: any = typeof window !== "undefined" ? (window as any).ethereum : null,
  network: MonadNetwork = "testnet"
): Promise<void> {
  if (!ethereum) throw new Error("MetaMask not found. Install MetaMask to continue.");
  const cfg = getNetworkConfig(network);

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: cfg.chainIdHex }],
    });
  } catch (switchError: any) {
    // 4902 = chain not added yet
    if (switchError?.code === 4902 || switchError?.code === -32603) {
      await ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: cfg.chainIdHex,
            chainName: cfg.name,
            nativeCurrency: cfg.nativeCurrency,
            rpcUrls: [...cfg.rpcUrls],
            blockExplorerUrls: [...cfg.blockExplorerUrls],
          },
        ],
      });
      return;
    }
    throw switchError;
  }
}

export async function sendNativeTransfer(
  provider: BrowserProvider,
  to: string,
  amountMon: number
): Promise<string> {
  if (!isValidMonadAddress(to)) {
    throw new Error("Invalid recipient address");
  }
  if (amountMon <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  const signer = await provider.getSigner();
  const from = await signer.getAddress();
  const balance = await provider.getBalance(from);
  const value = parseEther(amountMon.toString());

  if (balance < value) {
    throw new Error(
      `Insufficient MON. Balance: ${formatEther(balance)} MON, need ${amountMon} MON + gas`
    );
  }

  const tx = await signer.sendTransaction({ to, value });
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction submitted but receipt missing");
  return receipt.hash;
}

export async function getNetworkBlockNumber(network: MonadNetwork = "testnet"): Promise<number> {
  const provider = getJsonRpcProvider(network);
  return provider.getBlockNumber();
}

export async function getGasPriceGwei(network: MonadNetwork = "testnet"): Promise<number> {
  const provider = getJsonRpcProvider(network);
  const fee = await provider.getFeeData();
  const gasPrice = fee.gasPrice ?? 0n;
  return Number(gasPrice) / 1e9;
}
