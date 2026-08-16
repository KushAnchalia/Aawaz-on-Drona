# 🚀 Quick Setup Guide

## Step-by-Step Execution

### 1. Install Dependencies

```bash
cd /Users/kanchali/Solana
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` file:

```bash
echo "OPENAI_API_KEY=your_key_here" > .env.local
```

**Important:** Replace `your_key_here` with your actual OpenAI API key.

### 3. Start Development Server

```bash
npm run dev
```

### 4. Open in Browser

Navigate to: `http://localhost:3000`

### 5. Test the Application

1. **Connect Wallet**: Click "Select Wallet" → Choose Phantom
2. **Grant Permissions**: Allow microphone access when prompted
3. **Start Voice**: Click "🎤 Start Voice Command"
4. **Speak**: Say "Send 0.1 SOL to [your-test-address]"
5. **Confirm**: Review and approve the transaction
6. **Sign**: Approve in Phantom wallet

## 🧪 Testing with Testnet (Recommended)

Before using mainnet, test on devnet:

1. Edit `app/lib/solana.ts`
2. Change RPC URL to: `https://api.devnet.solana.com`
3. Get devnet SOL from: https://faucet.solana.com
4. Use Phantom's devnet mode

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Phantom wallet extension installed
- [ ] OpenAI API key obtained
- [ ] Some SOL in wallet (for mainnet) or devnet SOL (for testing)

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### OpenAI API Errors
- Verify your API key is correct
- Check you have credits in your OpenAI account
- Ensure the key has access to GPT-4o-mini

### Wallet Connection Issues
- Refresh the page
- Disconnect and reconnect wallet
- Check Phantom is unlocked

## ✅ Success Indicators

You'll know it's working when:
- ✅ Wallet connects successfully
- ✅ Voice button is enabled (not grayed out)
- ✅ Microphone permission is granted
- ✅ Voice commands are transcribed
- ✅ Transaction confirmation dialog appears
- ✅ Phantom wallet popup opens for signing

