# 🧪 Devnet (Testnet) Setup Guide

## ✅ Configuration Updated!

Your app is now configured to use **Solana Devnet** (testnet) instead of mainnet.

**What changed:**
- ✅ RPC URL: `https://api.devnet.solana.com`
- ✅ Wallet network: Devnet
- ✅ Free test SOL available

---

## 🔧 How to Switch Phantom to Devnet

### Step 1: Open Phantom Settings

1. Click the **Phantom extension icon** in your browser
2. Click the **⚙️ Settings** (gear icon) at the bottom
3. Scroll down to **"Developer Mode"**

### Step 2: Enable Testnet Mode

1. Toggle **"Testnet Mode"** to **ON** (green)
2. Phantom will now show "Devnet" in the top bar
3. Your wallet address will be different (this is normal)

### Step 3: Get Free Devnet SOL

**Option 1: Solana Faucet (Recommended)**
1. Go to: https://faucet.solana.com
2. Paste your **Phantom wallet address**
3. Click **"Airdrop 2 SOL"**
4. Wait 10-30 seconds
5. Check Phantom - you should see 2 SOL!

**Option 2: QuickNode Faucet**
1. Go to: https://faucet.quicknode.com/solana/devnet
2. Enter your wallet address
3. Complete captcha
4. Receive free SOL

**Option 3: SolFaucet**
1. Go to: https://solfaucet.com
2. Select "Devnet"
3. Enter your address
4. Get free SOL

---

## 🚀 Run the App

```bash
npm run dev
```

Then open: **http://localhost:3000**

---

## ✅ Verify You're on Devnet

**In Phantom:**
- Should show "Devnet" at the top
- Wallet address starts with different characters
- You have free test SOL

**In the App:**
- Connect your wallet
- Transactions will use devnet
- No real money at risk!

---

## 🎯 Test Voice Commands

Now you can safely test:

1. **Connect Phantom** (make sure it's on Devnet!)
2. Click **"🎤 Start Voice Command"**
3. Say: **"Send 0.1 SOL to [any devnet address]"**
4. Confirm and sign
5. Transaction executes on devnet (free!)

---

## 🔄 Switch Back to Mainnet

If you want to use mainnet later:

1. **Edit `app/lib/solana.ts`:**
   ```typescript
   export const SOLANA_RPC_URL = "https://api.mainnet-beta.solana.com";
   ```

2. **Edit `providers.tsx`:**
   ```typescript
   const network = WalletAdapterNetwork.Mainnet;
   ```

3. **In Phantom:** Turn off "Testnet Mode"

---

## 💡 Devnet vs Mainnet

| Feature | Devnet | Mainnet |
|---------|--------|---------|
| **Cost** | Free | Real SOL |
| **Speed** | Fast | Normal |
| **Purpose** | Testing | Production |
| **SOL** | Free from faucet | Buy with money |
| **Risk** | None | Real money |

---

## 🐛 Troubleshooting

### "Insufficient funds" error
- Get more devnet SOL from faucet
- Wait a few seconds after requesting

### "Network mismatch" error
- Make sure Phantom is on Devnet
- Refresh the page
- Reconnect wallet

### Transactions not showing
- Check Phantom is on Devnet
- Verify RPC URL in code
- Check browser console for errors

---

## 🎉 You're Ready!

Your app is now safely configured for devnet testing. No real money at risk!

**Next steps:**
1. Get devnet SOL from faucet
2. Test voice commands
3. Try different amounts
4. Experiment safely!

