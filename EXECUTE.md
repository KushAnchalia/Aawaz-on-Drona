# ⚡ Quick Execution Commands

## One-Line Setup

```bash
cd /Users/kanchali/Solana && npm install && echo "OPENAI_API_KEY=your_key_here" > .env.local && npm run dev
```

## Step-by-Step

### 1. Install
```bash
npm install
```

### 2. Configure
```bash
# Edit .env.local and add your OpenAI API key
nano .env.local
# Or use: echo "OPENAI_API_KEY=sk-..." > .env.local
```

### 3. Run
```bash
npm run dev
```

### 4. Open
```
http://localhost:3000
```

## 🎯 What You Built

✅ **Voice → Intent → Transaction → Wallet Sign → Execute**

- Voice input via Web Speech API
- Intent parsing with OpenAI GPT-4o-mini
- Solana transaction building
- Phantom wallet integration
- Policy engine with limits
- Confirmation flow

## 📝 Test Command

Say: **"Send 0.1 SOL to 9xQeWvG816bUx9EPjYj6MrHZGCMahqK9saPJKGmx8eE"**

## 🔐 Security Features

- ✅ No private keys stored
- ✅ Wallet signs all transactions
- ✅ Max 0.5 SOL per transaction
- ✅ Explicit confirmation required

## 📚 Full Documentation

See `README.md` for complete details.

