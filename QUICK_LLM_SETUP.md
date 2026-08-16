# ⚡ Quick LLM Setup (Open Source)

## 🥇 Recommended: Ollama (5 minutes)

### Step 1: Install Ollama
```bash
# macOS
brew install ollama

# Or download from: https://ollama.com
```

### Step 2: Start Ollama
```bash
ollama serve
```
Keep this terminal open!

### Step 3: Download Model (New Terminal)
```bash
ollama pull llama3.2
```

### Step 4: Configure
```bash
# Create .env.local
echo "LLM_PROVIDER=ollama" > .env.local
echo "OLLAMA_MODEL=llama3.2" >> .env.local
```

### Step 5: Run App
```bash
npm run dev
```

**Done!** 🎉 No API keys needed, completely free!

---

## 🥈 Alternative: Hugging Face (2 minutes)

### Step 1: Get Token
1. Go to: https://huggingface.co/settings/tokens
2. Create token (read access)
3. Copy token

### Step 2: Configure
```bash
echo "LLM_PROVIDER=huggingface" > .env.local
echo "HUGGINGFACE_API_KEY=your_token_here" >> .env.local
```

### Step 3: Run
```bash
npm run dev
```

**Done!** Free tier: 30,000 requests/month

---

## 🥉 Alternative: Groq (2 minutes)

### Step 1: Get API Key
1. Go to: https://console.groq.com
2. Sign up
3. Create API key
4. Copy key

### Step 2: Configure
```bash
echo "LLM_PROVIDER=groq" > .env.local
echo "GROQ_API_KEY=your_key_here" >> .env.local
```

### Step 3: Run
```bash
npm run dev
```

**Done!** Free tier: 14,400 requests/day

---

## 📋 Which One?

- **Privacy & Free**: Ollama ✅
- **Quick Setup**: Hugging Face or Groq
- **Speed**: Groq (fastest)

See `OPEN_SOURCE_SETUP.md` for full details!

