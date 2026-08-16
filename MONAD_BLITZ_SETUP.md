# Monad Blitz — Required Setup (Aawaz + MetaMask)

Aawaz is now wired for **Monad Testnet** (the network used at Monad Blitz hackathons) with **MetaMask**.

---

## 1. Network details (add to MetaMask)

| Field | Value |
|--------|--------|
| **Network Name** | Monad Testnet |
| **RPC URL** | `https://testnet-rpc.monad.xyz` |
| **Chain ID** | `10143` |
| **Currency Symbol** | `MON` |
| **Block Explorer** | `https://testnet.monadvision.com` |
| **Faucet** | `https://faucet.monad.xyz` |

App will also call `wallet_addEthereumChain` / `wallet_switchEthereumChain` so MetaMask can add/switch automatically on **Connect**.

Alternate explorers:
- https://testnet.monadscan.com
- https://testnet.monadexplorer.com

---

## 2. What you need before coding

1. **Node.js 18+**
2. **MetaMask** browser extension — https://metamask.io
3. **Testnet MON** from https://faucet.monad.xyz
4. **LLM API key** (Groq recommended) for voice/intent parsing
5. Optional: Fish Audio key for celebrity voices

---

## 3. Environment variables

Copy `env.example` → `.env.local`:

```bash
cp env.example .env.local
```

Minimum:

```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_key

NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_CHAIN_ID=10143
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadvision.com

# Optional — wallet that receives marketplace purchase payments
NEXT_PUBLIC_MARKETPLACE_TREASURY=0xYourTreasuryAddressHere
```

---

## 4. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000 → Connect MetaMask → switch/add Monad Testnet → try:

```
Send 0.01 MON to 0xYourOtherAddress
Check my balance
```

---

## 5. Voice → chain flow (same product, Monad instead of Solana)

```
Voice / text
  → Intent parse (LLM / regex)
  → Policy check
  → MetaMask signature
  → Monad Testnet (native MON transfer)
  → MonadVision explorer link
```

**Security:** private keys stay in MetaMask. The app never holds keys.

---

## 6. Blitz submission checklist

- [ ] App connects MetaMask to **chainId 10143**
- [ ] At least one successful **MON transfer** on testnet
- [ ] Tx visible on MonadVision
- [ ] Demo script: voice or text command → confirm → MetaMask sign
- [ ] (Optional) Generated Solidity contract from Contract Creator agent
- [ ] (Optional) Marketplace purchase pays treasury in MON

---

## 7. Deploy contracts (optional)

Use Foundry or Hardhat against Monad Testnet:

```bash
# Foundry example
forge create src/CrowdfundingCampaign.sol:CrowdfundingCampaign \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args 1000000000000000000
```

RPC / chain from section 1.

---

## 8. Official links

| Resource | URL |
|----------|-----|
| Testnet docs | https://docs.monad.xyz/developer-essentials/testnet |
| Faucet / add network | https://faucet.monad.xyz |
| App hub | https://testnet.monad.xyz |
| Monad Blitz | https://monadblitz.world |

---

## 9. Stack change summary

| Before (Solana) | After (Monad Blitz) |
|-----------------|---------------------|
| Phantom | MetaMask |
| SOL / lamports | MON / wei (18 decimals) |
| `@solana/web3.js` | `ethers` v6 |
| Solana address (base58) | EVM `0x` address |
| Anchor / Rust templates | Solidity templates |
| Solana Explorer | MonadVision |
