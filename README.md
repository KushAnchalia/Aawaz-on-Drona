<div align="center">

<!-- ANIMATED HEADER -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=200&section=header&text=AAWAZ&fontSize=80&fontAlignY=35&animation=twinkling&fontColor=gradient" width="100%"/>

<br/>

# 🔊 **Aawaz** — The  Super Agent

> Voice-First Web3 Agent Platform built on the Monad blockchain

<br/>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&duration=3000&pause=1000&color=9945FF&center=true&vCenter=true&width=600&lines=Web3%2C+powered+by+voice;Talk+to+the+Monad+Blockchain;Voice-Powered+Trading;Deploy+Contracts+by+Voice" alt="Typing SVG" />
</p>

<br/>

<!-- BADGES -->
<p align="center">
  <a href="https://aawazi.vercel.app/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-Click_Here-00D9FF?style=for-the-badge&logoColor=white&labelColor=9945FF" alt="Live Demo"/>
  </a>
  <a href="https://github.com/KushAnchalia/Aawaz/issues">
    <img src="https://img.shields.io/badge/🐛_Report_Bug-GitHub-FF6B6B?style=for-the-badge&labelColor=000000" alt="Report Bug"/>
  </a>
  <a href="https://github.com/KushAnchalia/Aawaz/issues">
    <img src="https://img.shields.io/badge/💡_Request_Feature-Suggest-4ECDC4?style=for-the-badge&labelColor=000000" alt="Request Feature"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/KushAnchalia/Aawaz?style=social" alt="GitHub stars"/>
  <img src="https://img.shields.io/github/forks/KushAnchalia/Aawaz?style=social" alt="GitHub forks"/>
  <img src="https://img.shields.io/github/watchers/KushAnchalia/Aawaz?style=social" alt="GitHub watchers"/>
</p>

<br/>

</div>

---

## ✨ What is Aawaz?

**Aawaz** ("voice" in Hindi/Urdu) is a voice-first Web3 agent platform running on **Monad**. Instead of clicking through dashboards, you **speak** to the blockchain — trade perpetuals, deploy smart contracts, monitor network health, and generate audio content — all by voice.

The platform ships as **"The Monad Super Agent"**: a single conversational interface that unifies multiple specialized agents.

---

## 🚀 Features

### 🎙️ Voice-First Interaction
- **Conversational Agent** — talk to the Monad Super Agent, ask questions, and issue commands by voice or text
- **Voice Command Hub** — central voice input for all agents
- **Web Speech Recognition** for real microphone capture

### 🪙 Contract Deployment by Voice
- **Smart Contract Creator** — generate, audit, and deploy ERC-20 / custom contracts by voice
- Uses Foundry under the hood (`forge create`) on Monad Testnet / Mainnet
- Contract source is automatically verified via BlockVision's Sourcify service

### 📈 Network Monitor
- Live Monad **TPS** sampled from recent blocks (testnet & mainnet toggle)
- Gas price / congestion heuristic with a configurable baseline
- Explore the Monad ecosystem: DeFi Llama, dApps, and more

### 💹 Perpetual Trading
- **Hyperliquid Agent** — place perp trades by voice
- Real speech recognition wired into trade execution

### 💳 Wallet
- MetaMask wallet connect with **testnet / mainnet toggle**
- Automatic network switching to Monad (chain 10143 / 143)

### 🐟 Celebrity Voice / Audio Generation
- Generate emotional voice audio (Hume.ai-powered)
- Celebrity voice marketplace & player

### 🤖 AI-Powered
- Groq (LLaMA) LLM backend for agent intelligence
- Transaction optimizer & smart-contract optimizer agents

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Blockchain | Monad Testnet (chain 10143) / Mainnet (chain 143) |
| Web3 | ethers v6 |
| Smart Contracts | Solidity 0.8.20 + Foundry |
| Verification | Sourcify (BlockVision Monad endpoint) |
| LLM | Groq (`llama-3.1-8b-instant`) |
| TTS | Hume.ai |
| Wallet | MetaMask / WalletConnect |

---

## 📦 Getting Started

### Prerequisites
- Node.js ≥ 18, npm
- (Optional) Foundry: `export PATH="$HOME/.foundry/bin:$PATH"`

### Install & Run

```bash
npm install
cp env.example .env.local   # then fill in your keys
npm run dev
```

Open **http://localhost:3000**.

### Required Environment Variables (`.env.local`)

| Variable | Purpose |
|----------|---------|
| `LLM_PROVIDER` | `groq` |
| `GROQ_API_KEY` | Groq API key for the LLM agent |
| `GROQ_MODEL` | Model name (default `llama-3.1-8b-instant`) |
| `NEXT_PUBLIC_MONAD_RPC_URL` | Testnet RPC (`https://testnet-rpc.monad.xyz`) |
| `NEXT_PUBLIC_MONAD_CHAIN_ID` | `10143` |
| `NEXT_PUBLIC_MONAD_EXPLORER_URL` | `https://testnet.monadvision.com` |
| `NEXT_PUBLIC_MONAD_FAUCET_URL` | `https://faucet.monad.xyz` |
| `NEXT_PUBLIC_MONAD_MAINNET_RPC_URL` | `https://rpc.monad.xyz` |
| `MONAD_BASELINE_GWEI` | Baseline gas for congestion heuristic (default 102) |
| `PRIVATE_KEY` | Deployer wallet key used by Foundry (never commit!) |
| `HUME_API_KEY` / `HUME_SECRET_KEY` | Hume.ai voice generation |

---

## 📝 Smart Contract Deployment

### Deployed Contract (Monad Testnet)

| Field | Value |
|-------|-------|
| **Contract** | `AawazToken` (ERC-20, symbol `AAZ`, 18 decimals) |
| **Address** | [`0x5Fcff1c6D4Cf3Cad6BbC0331b46964A18Fd5c1f2`](https://testnet.monadscan.com/address/0x5Fcff1c6D4Cf3Cad6BbC0331b46964A18Fd5c1f2) |
| **Chain** | Monad Testnet (10143) |
| **Status** | ✅ Deployed & Verified (Sourcify exact match) |

Source: `contracts/src/AawazToken.sol`

### Deploy a New Contract (Testnet)

```bash
cd contracts
export PATH="$HOME/.foundry/bin:$PATH"
export PRIVATE_KEY=0xYOUR_PRIVATE_KEY

forge create src/AawazToken.sol:AawazToken \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args 1000000000000000000000000   # 1,000,000 AAZ (18 decimals)
```

### Deploy to Mainnet

```bash
forge create src/AawazToken.sol:AawazToken \
  --rpc-url https://rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args 1000000000000000000000000
```

### Verify a Deployed Contract

Automated verification uses BlockVision's **Sourcify** endpoint (the official Monad recommendation):

```bash
forge verify-contract <ADDR> src/AawazToken.sol:AawazToken \
  --chain 10143 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org/' \
  --constructor-args $(cast abi-encode "constructor(uint256)" 1000000000000000000000000)
```

> ⚠️ The Etherscan/Blockscout v1 API on Monad explorers is Cloudflare-protected and rejects CLI tools; Sourcify is the reliable path.

### Viewing on Explorers

- **MonadScan Testnet**: `https://testnet.monadscan.com/address/<ADDR>`
- **MonadVision Testnet**: `https://testnet.monadvision.com/address/<ADDR>`
- **MonadScan Mainnet**: `https://monadscan.com/address/<ADDR>`

---

## 📦 Deployment to Vercel

```bash
npm run build
```

Or push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new) (this repo is configured with `DEPLOY_TO_VERCEL.md`, `deploy.sh`, `run.sh`). Set the env vars above in Vercel's dashboard. **Never expose `PRIVATE_KEY` to the frontend** — it is only used by the contract deployment tooling.

---

## 🗂️ Project Structure

```
app/
  components/      # UI + agent components (ConversationalAgent, HyperliquidAgent,
                   #   NetworkAnalyzer, SmartContractCreator, WalletConnect, ...)
  context/         # WalletContext (network toggle, switchNetwork)
  lib/             # monad.ts (network config/helpers), ai.ts (Groq), fishAudio.ts (Hume.ai)
contracts/
  src/AawazToken.sol   # ERC-20 deployable on Monad
  foundry.toml         # Foundry config + RPC endpoints
.env.local             # secrets — gitignored, never commit
```

---

## ⚠️ Important Notes

- **Secrets**: `.env.local`, `.env` and `*.env.local` are gitignored. The `PRIVATE_KEY`, Groq key, and Hume keys must **never** be committed.
- **Build vs Dev**: don't run `npm run build` and `npm run dev` simultaneously — they share `.next` and corrupt chunks. If a `ChunkLoadError` appears, stop all Next processes and `rm -rf .next`.
- **Monad networks**:
  - Testnet: chain `10143`, RPC `https://testnet-rpc.monad.xyz`, faucet `https://faucet.monad.xyz`
  - Mainnet: chain `143`, RPC `https://rpc.monad.xyz`

---

## 📄 License

MIT
