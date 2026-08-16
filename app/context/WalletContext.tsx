"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider, formatEther } from "ethers";
import {
  ensureMonadNetwork,
  getNetworkConfig,
  getWalletBalance,
  sendNativeTransfer,
  type MonadNetwork,
} from "../lib/monad";

type WalletContextValue = {
  address: string | null;
  connected: boolean;
  connecting: boolean;
  chainId: number | null;
  balance: number | null;
  provider: BrowserProvider | null;
  network: MonadNetwork;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: MonadNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendMon: (to: string, amount: number) => Promise<string>;
  hasMetaMask: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereum(): any {
  if (typeof window === "undefined") return null;
  return (window as any).ethereum ?? null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [network, setNetwork] = useState<MonadNetwork>("testnet");

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    try {
      const bal = await getWalletBalance(address, network);
      setBalance(bal);
    } catch (err) {
      console.error("Failed to fetch MON balance:", err);
      setBalance(null);
    }
  }, [address, network]);

  const syncFromProvider = useCallback(async (browserProvider: BrowserProvider) => {
    const network = await browserProvider.getNetwork();
    const signer = await browserProvider.getSigner();
    const addr = await signer.getAddress();
    setProvider(browserProvider);
    setAddress(addr);
    setChainId(Number(network.chainId));
    const bal = await browserProvider.getBalance(addr);
    setBalance(Number(formatEther(bal)));
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getEthereum();
    if (!ethereum) {
      throw new Error("MetaMask not installed. Install from https://metamask.io");
    }

    setConnecting(true);
    try {
      await ensureMonadNetwork(ethereum, network);
      const accounts: string[] = await ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts?.length) throw new Error("No account selected in MetaMask");

      const browserProvider = new BrowserProvider(ethereum);
      await syncFromProvider(browserProvider);
    } finally {
      setConnecting(false);
    }
  }, [syncFromProvider, network]);

  const switchNetwork = useCallback(
    async (target: MonadNetwork) => {
      const ethereum = getEthereum();
      if (ethereum) {
        try {
          await ensureMonadNetwork(ethereum, target);
        } catch (err: any) {
          throw new Error(err?.message || `Failed to switch to ${target}`);
        }
      }
      setNetwork(target);
      if (address && ethereum) {
        const browserProvider = new BrowserProvider(ethereum);
        await syncFromProvider(browserProvider).catch(() => undefined);
      }
    },
    [address, syncFromProvider]
  );

  const disconnect = useCallback(() => {
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setProvider(null);
  }, []);

  const sendMon = useCallback(
    async (to: string, amount: number) => {
      const ethereum = getEthereum();
      if (!ethereum) throw new Error("MetaMask not found");
      await ensureMonadNetwork(ethereum, network);
      const browserProvider = new BrowserProvider(ethereum);
      await syncFromProvider(browserProvider);
      return sendNativeTransfer(browserProvider, to, amount);
    },
    [syncFromProvider, network]
  );

  useEffect(() => {
    const ethereum = getEthereum();
    setHasMetaMask(Boolean(ethereum));
    if (!ethereum) return;

    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        disconnect();
        return;
      }
      const browserProvider = new BrowserProvider(ethereum);
      syncFromProvider(browserProvider).catch(console.error);
    };

    const onChainChanged = () => {
      const browserProvider = new BrowserProvider(ethereum);
      syncFromProvider(browserProvider).catch(console.error);
    };

    ethereum.on?.("accountsChanged", onAccountsChanged);
    ethereum.on?.("chainChanged", onChainChanged);

    // Auto-reconnect if already authorized
    ethereum
      .request({ method: "eth_accounts" })
      .then(async (accounts: string[]) => {
        if (accounts?.length) {
          await ensureMonadNetwork(ethereum, network).catch(() => undefined);
          const browserProvider = new BrowserProvider(ethereum);
          await syncFromProvider(browserProvider);
        }
      })
      .catch(() => undefined);

    return () => {
      ethereum.removeListener?.("accountsChanged", onAccountsChanged);
      ethereum.removeListener?.("chainChanged", onChainChanged);
    };
  }, [disconnect, syncFromProvider, network]);

  useEffect(() => {
    if (!address) return;
    const id = setInterval(() => {
      refreshBalance().catch(() => undefined);
    }, 12000);
    return () => clearInterval(id);
  }, [address, refreshBalance]);

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      connected: Boolean(address),
      connecting,
      chainId,
      balance,
      provider,
      network,
      connect,
      disconnect,
      switchNetwork,
      refreshBalance,
      sendMon,
      hasMetaMask,
    }),
    [
      address,
      connecting,
      chainId,
      balance,
      provider,
      network,
      connect,
      disconnect,
      switchNetwork,
      refreshBalance,
      sendMon,
      hasMetaMask,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return ctx;
}

export function useMonadNetworkOk(): boolean {
  const { chainId, network } = useWallet();
  return chainId === getNetworkConfig(network).chainId;
}
