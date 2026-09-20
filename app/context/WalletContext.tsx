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
  CHAINS,
  ensureEvmNetwork,
  explorerTxUrl,
  getChain,
  getEvmProvider,
  isEvmChain,
  type ChainId,
} from "../lib/chains";
import { getNetworkConfig, type MonadNetwork } from "../lib/chains";

type WalletContextValue = {
  // multi-chain (new)
  chain: ChainId;
  setChain: (c: ChainId) => Promise<void>;
  symbol: string;
  // connection
  address: string | null;
  connected: boolean;
  connecting: boolean;
  chainId: number | null;
  balance: number | null;
  provider: BrowserProvider | null;
  // legacy monad toggle (kept for old components)
  network: MonadNetwork;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: MonadNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendMon: (to: string, amount: number) => Promise<string>;
  /** generic send on the active chain */
  sendNative: (to: string, amount: number) => Promise<string>;
  hasMetaMask: boolean;
  hasSolana: boolean;
  explorerTx: (hash: string) => string;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getEthereum(): any {
  return pickEvmProvider();
}

/**
 * EIP-5749 multi-wallet picker.
 * When several wallets are installed (MetaMask + Phantom + Coinbase…),
 * `window.ethereum` may be whichever extension won the injection race —
 * or a proxy object that crashes inside the losing extension
 * ("Cannot read properties of undefined (reading 'origin')").
 * Always prefer the real MetaMask provider when we need EVM.
 */
function pickEvmProvider(): any {
  if (typeof window === "undefined") return null;
  const eth: any = (window as any).ethereum ?? null;
  if (!eth) return null;
  const list: any[] = Array.isArray(eth.providers) ? eth.providers : [eth];
  return list.find((p: any) => p?.isMetaMask) ?? eth;
}

function isMetaMaskProvider(p: any): boolean {
  if (!p) return false;
  if (p.isMetaMask) return true;
  const list: any[] = Array.isArray(p.providers) ? p.providers : [];
  return list.some((x: any) => x?.isMetaMask);
}

/** Turn cryptic extension-internal errors into actionable messages. */
export function friendlyWalletError(err: any, isSolana: boolean): string {
  const raw = err?.message || String(err) || "Wallet connection failed";
  if (/origin/i.test(raw) || /undefined/i.test(raw) || /internal/i.test(raw)) {
    if (window.self !== window.top) {
      return "Wallet is blocked inside this embedded frame. Open Aawaz in a full browser tab to connect, then return here.";
    }
    return isSolana
      ? "Phantom didn't respond. Unlock Phantom, set it as default Solana wallet, then retry."
      : "MetaMask didn't respond (often another wallet overriding it). Disable other wallet extensions or set MetaMask as default, unlock it, then retry.";
  }
  if (/user rejected|denied|rejected/i.test(raw)) return "Connection request was rejected in the wallet.";
  if (/already pending|already processing/i.test(raw)) return "A wallet popup is already open — check your wallet window.";
  return raw;
}

export function isEmbeddedFrame(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.self !== window.top;
  } catch {
    return true; // cross-origin frame blocks access → we are embedded
  }
}

function getSolana(): any {
  if (typeof window === "undefined") return null;
  return (window as any).solana ?? null;
}

function initialChain(): ChainId {
  if (typeof window === "undefined") return "monad-testnet";
  const q = new URLSearchParams(window.location.search).get("chain");
  if (q && (CHAINS as any)[q]) return q as ChainId;
  return (localStorage.getItem("aawaz.chain") as ChainId) || "monad-testnet";
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [chain, setChainState] = useState<ChainId>("monad-testnet");
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [hasSolana, setHasSolana] = useState(false);

  useEffect(() => {
    setChainState(initialChain());
    setHasMetaMask(Boolean(getEthereum()));
    setHasSolana(Boolean(getSolana()));
  }, []);

  // legacy mapping: monad-testnet ↔ testnet, monad-mainnet ↔ mainnet
  const network: MonadNetwork = chain === "monad-mainnet" ? "mainnet" : "testnet";

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }
    // Balance reads never touch the injected wallet — pure RPC, so a
    // broken extension object can't crash background refreshes.
    try {
      const cfg = getChain(chain);
      if (cfg.family === "evm") {
        const p = getEvmProvider(chain);
        const bal = await p.getBalance(address);
        setBalance(Number(formatEther(bal)));
      } else {
        // Solana via JSON-RPC getBalance (lamports → SOL)
        const res = await fetch(cfg.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
        });
        const j = await res.json();
        const lamports = j?.result?.value ?? 0;
        setBalance(lamports / 1e9);
      }
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setBalance(null);
    }
  }, [address, chain]);

  const syncEvm = useCallback(async (browserProvider: BrowserProvider) => {
    const net = await browserProvider.getNetwork();
    const signer = await browserProvider.getSigner();
    const addr = await signer.getAddress();
    setProvider(browserProvider);
    setAddress(addr);
    setChainId(Number(net.chainId));
    try {
      const bal = await browserProvider.getBalance(addr);
      setBalance(Number(formatEther(bal)));
    } catch {
      setBalance(null);
    }
  }, []);

  const connect = useCallback(async () => {
    const cfg = getChain(chain);
    setConnecting(true);
    try {
      if (cfg.family === "solana") {
        const sol = getSolana();
        if (!sol) throw new Error("Phantom not installed. Install from https://phantom.app");
        let resp;
        try {
          resp = await sol.connect();
        } catch (e: any) {
          throw new Error(friendlyWalletError(e, true));
        }
        const pubkey = resp.publicKey.toString();
        setAddress(pubkey);
        setProvider(null);
        setChainId(null);
      } else {
        const ethereum = pickEvmProvider();
        if (!ethereum) throw new Error("MetaMask not installed. Install from https://metamask.io");
        if (!isMetaMaskProvider((window as any).ethereum) && !ethereum.isMetaMask) {
          console.warn("No MetaMask provider found; using fallback EVM provider.");
        }
        try {
          await ensureEvmNetwork(ethereum, chain);
        } catch (e: any) {
          throw new Error(friendlyWalletError(e, false));
        }
        let accounts: string[];
        try {
          accounts = await ethereum.request({ method: "eth_requestAccounts" });
        } catch (e: any) {
          throw new Error(friendlyWalletError(e, false));
        }
        if (!accounts?.length) throw new Error("No account selected in wallet");
        try {
          await syncEvm(new BrowserProvider(ethereum));
        } catch (e: any) {
          throw new Error(friendlyWalletError(e, false));
        }
      }
    } finally {
      setConnecting(false);
    }
  }, [chain, syncEvm]);

  const setChain = useCallback(
    async (c: ChainId) => {
      setChainState(c);
      try {
        localStorage.setItem("aawaz.chain", c);
      } catch {}
      // if already connected on EVM, switch network in wallet
      const cfg = getChain(c);
      if (cfg.family === "evm" && address) {
        const ethereum = pickEvmProvider();
        if (ethereum) {
          try {
            await ensureEvmNetwork(ethereum, c);
            await syncEvm(new BrowserProvider(ethereum));
          } catch (e: any) {
            // Surface chain-switch failures instead of crashing callers
            throw new Error(friendlyWalletError(e, false));
          }
        }
      }
      // reset solana address when switching families to avoid confusion
      if (cfg.family === "solana" && provider) {
        setProvider(null);
        setChainId(null);
      }
    },
    [address, provider, syncEvm]
  );

  const switchNetwork = useCallback(
    async (target: MonadNetwork) => {
      await setChain(target === "mainnet" ? "monad-mainnet" : "monad-testnet");
    },
    [setChain]
  );

  const disconnect = useCallback(() => {
    try {
      getSolana()?.disconnect?.();
    } catch {}
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setProvider(null);
  }, []);

  const sendNative = useCallback(
    async (to: string, amount: number) => {
      const cfg = getChain(chain);
      if (cfg.family === "solana") {
        const sol = getSolana();
        if (!sol) throw new Error("Phantom not installed. Install from https://phantom.app");
        // Build a SystemProgram transfer client-side via CDN (no npm dep needed).
        // This keeps `npm install` light and works inside DronaHQ iframes.
        // @ts-ignore — remote ESM import, typed as any at runtime
        const web3: any = await Function("return import('https://esm.sh/@solana/web3.js@1.98.0')")();
        const fromPk = new web3.PublicKey(address);
        const toPk = new web3.PublicKey(to);
        const lamports = Math.round(amount * 1e9);
        const tx = new web3.Transaction().add(
          web3.SystemProgram.transfer({ fromPubkey: fromPk, toPubkey: toPk, lamports })
        );
        tx.feePayer = fromPk;
        const conn = new web3.Connection(cfg.rpcUrl, "confirmed");
        tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;
        const { signature } = await sol.signAndSendTransaction(tx);
        return signature as string;
      }
      const ethereum = pickEvmProvider();
      if (!ethereum) throw new Error("Wallet not found");
      try {
        await ensureEvmNetwork(ethereum, chain);
      } catch (e: any) {
        throw new Error(friendlyWalletError(e, false));
      }
      const bp = new BrowserProvider(ethereum);
      await syncEvm(bp);
      const { sendEvmNative } = await import("../lib/chains");
      return sendEvmNative(bp, to, amount);
    },
    [address, chain, syncEvm]
  );

  const sendMon = useCallback(
    async (to: string, amount: number) => {
      // legacy: force monad chain for old callers
      const ethereum = pickEvmProvider();
      if (!ethereum) throw new Error("MetaMask not found");
      const target: ChainId = network === "mainnet" ? "monad-mainnet" : "monad-testnet";
      try {
        await ensureEvmNetwork(ethereum, target);
      } catch (e: any) {
        throw new Error(friendlyWalletError(e, false));
      }
      const bp = new BrowserProvider(ethereum);
      await syncEvm(bp).catch((e: any) => {
        throw new Error(friendlyWalletError(e, false));
      });
      const { sendEvmNative } = await import("../lib/chains");
      return sendEvmNative(bp, to, amount);
    },
    [network, syncEvm]
  );

  useEffect(() => {
    const ethereum = pickEvmProvider();
    setHasMetaMask(isMetaMaskProvider((window as any).ethereum) || Boolean(ethereum));
    if (!ethereum?.on) return;
    const onAccountsChanged = (accounts: string[]) => {
      if (!accounts.length) {
        disconnect();
        return;
      }
      // Re-create provider from the picked (MetaMask) object, never a stale one
      syncEvm(new BrowserProvider(pickEvmProvider())).catch(() => undefined);
    };
    const onChainChanged = () => {
      syncEvm(new BrowserProvider(pickEvmProvider())).catch(() => undefined);
    };
    try {
      ethereum.on("accountsChanged", onAccountsChanged);
      ethereum.on("chainChanged", onChainChanged);
    } catch {
      // Broken/overridden provider object — listeners are best-effort
    }

    // Silent auto-reconnect ONLY: eth_accounts never pops up the wallet and
    // never throws the 'origin' crash. Deliberately NO network switch here —
    // chain switching needs a user gesture; the UI shows a mismatch instead.
    try {
      ethereum
        .request({ method: "eth_accounts" })
        .then(async (accounts: string[]) => {
          if (accounts?.length) {
            await syncEvm(new BrowserProvider(pickEvmProvider())).catch(() => undefined);
          }
        })
        .catch(() => undefined);
    } catch {
      // ignore — user can connect manually
    }

    return () => {
      try {
        ethereum.removeListener?.("accountsChanged", onAccountsChanged);
        ethereum.removeListener?.("chainChanged", onChainChanged);
      } catch {}
    };
  }, [disconnect, syncEvm]);

  useEffect(() => {
    if (!address) return;
    refreshBalance().catch(() => undefined);
    const id = setInterval(() => refreshBalance().catch(() => undefined), 12000);
    return () => clearInterval(id);
  }, [address, refreshBalance]);

  const value = useMemo<WalletContextValue>(
    () => ({
      chain,
      setChain,
      symbol: getChain(chain).symbol,
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
      sendNative,
      hasMetaMask,
      hasSolana,
      explorerTx: (hash: string) => explorerTxUrl(chain, hash),
    }),
    [
      chain,
      setChain,
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
      sendNative,
      hasMetaMask,
      hasSolana,
    ]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function useMonadNetworkOk(): boolean {
  const { chainId, chain } = useWallet();
  if (!isEvmChain(chain)) return true; // solana handled separately
  const cfg = getChain(chain);
  return chainId === cfg.chainId;
}

export { getNetworkConfig };
