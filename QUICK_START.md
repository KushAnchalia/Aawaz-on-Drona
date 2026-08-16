# 🚀 Quick Start Guide

## 📱 Which Wallet to Use

**Recommended: Phantom Wallet** (Already configured)

The app is set up to use **Phantom** wallet, which is the most popular Solana wallet.

### Supported Wallets:
- ✅ **Phantom** (Primary - already configured)
- Can add: Backpack, Solflare, etc. (see below)

### How to Install Phantom:

1. **Chrome/Edge/Brave**: 
   - Go to: https://phantom.app
   - Click "Download" → "Add to Chrome"
   - Follow installation steps

2. **Firefox**: 
   - Go to: https://phantom.app
   - Click "Download" → "Add to Firefox"

3. **Mobile**: 
   - iOS: App Store → Search "Phantom"
   - Android: Play Store → Search "Phantom"

### After Installing Phantom:
1. Create a new wallet OR import existing
2. **Save your seed phrase securely** (never share it!)
3. Fund your wallet with some SOL (for testing, use devnet first)

---

## 🏃 How to Run the Code

### Step 1: Install Node.js (if not installed)

Check if you have Node.js:
```bash
node --version
```

If not installed:
- Download from: https://nodejs.org (get LTS version)
- Or use Homebrew: `brew install node`

### Step 2: Navigate to Project Directory

```bash
cd /Users/kanchali/Solana
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages (Next.js, Solana SDK, OpenAI, etc.)

**Expected time:** 2-5 minutes

### Step 4: Set Up Environment Variables

Create `.env.local` file in the project root:

```bash
# Option 1: Using echo
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env.local

# Option 2: Using nano (better for editing)
nano .env.local
```

**What to put in `.env.local`:**
```
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**How to get OpenAI API Key:**
1. Go to: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)
5. Paste it in `.env.local`

### Step 5: Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

### Step 6: Open in Browser

1. Open your browser (Chrome/Edge recommended)
2. Go to: **http://localhost:3000**
3. You should see the Solana Voice Agent interface

### Step 7: Connect Your Wallet

1. Click the **"Select Wallet"** button
2. Choose **"Phantom"** from the list
3. Approve the connection in Phantom popup
4. Your wallet address should appear

### Step 8: Test Voice Command

1. Click **"🎤 Start Voice Command"** button
2. **Allow microphone access** when browser prompts
3. Speak clearly: **"Send 0.1 SOL to [address]"**
4. Wait for confirmation dialog
5. Click "OK" to proceed
6. **Sign the transaction** in Phantom popup
7. Wait for confirmation

---

## 🧪 Testing on Devnet (Recommended First)

Before using real SOL, test on Solana devnet:

### 1. Switch to Devnet

Edit `app/lib/solana.ts`:
```typescript
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";
```

### 2. Get Devnet SOL

1. Open Phantom wallet
2. Switch to Devnet (Settings → Developer Mode → Testnet Mode)
3. Go to: https://faucet.solana.com
4. Paste your wallet address
5. Request devnet SOL (free)

### 3. Test Transactions

Now you can test with free devnet SOL!

---

## ⚠️ Troubleshooting

### Problem: "npm: command not found"
**Solution:** Install Node.js from nodejs.org

### Problem: "Port 3000 already in use"
**Solution:** 
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Or use different port
PORT=3001 npm run dev
```

### Problem: "Module not found"
**Solution:**
```bash
rm -rf node_modules .next
npm install
```

### Problem: "OpenAI API error"
**Solution:**
- Check `.env.local` file exists
- Verify API key is correct (starts with `sk-`)
- Check you have credits in OpenAI account

### Problem: "Speech recognition not supported"
**Solution:**
- Use Chrome or Edge browser
- Grant microphone permissions
- Check browser settings → Privacy → Microphone

### Problem: "Wallet not connecting"
**Solution:**
- Make sure Phantom extension is installed
- Refresh the page
- Disconnect and reconnect wallet
- Check Phantom is unlocked

### Problem: "Transaction failed"
**Solution:**
- Check you have enough SOL for fees (0.000005 SOL minimum)
- Verify recipient address is valid
- Check network connection
- Try on devnet first

---

## ✅ Success Checklist

You're ready when:
- [ ] Node.js installed (`node --version` works)
- [ ] Dependencies installed (`npm install` completed)
- [ ] `.env.local` file created with OpenAI key
- [ ] Server running (`npm run dev` shows localhost:3000)
- [ ] Phantom wallet installed and funded
- [ ] Wallet connected in browser
- [ ] Microphone permission granted
- [ ] Voice button is enabled (not grayed out)

---

## 🎯 Example Voice Commands

Try these:

1. **"Send 0.1 SOL to 9xQeWvG816bUx9EPjYj6MrHZGCMahqK9saPJKGmx8eE"**
2. **"Transfer 0.05 SOL to [address]"**
3. **"Send 0.25 SOL to [address]"**

**Note:** Replace `[address]` with a valid Solana address (32-44 characters)

---

## 📞 Need Help?

Check these files:
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup
- `EXECUTE.md` - Quick commands

---

## 🔐 Security Reminder

- ✅ Never share your seed phrase
- ✅ Start with small amounts
- ✅ Test on devnet first
- ✅ Verify addresses before sending
- ✅ This app never stores private keys

