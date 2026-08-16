# 🔓 Open Source LLM Setup Guide

Your app now uses **open-source LLM alternatives** instead of OpenAI! Choose from:

1. **Ollama** (Recommended) - Run locally, completely free
2. **Hugging Face** - Free tier available, cloud-based
3. **Groq** - Fast inference, free tier available

---

## 🥇 Option 1: Ollama (Recommended - Local & Free)

### Why Ollama?
- ✅ **100% Free** - No API costs
- ✅ **Runs Locally** - Your data stays private
- ✅ **No Internet Required** - Works offline
- ✅ **Fast** - Runs on your machine

### Setup Steps:

#### 1. Install Ollama

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download from: https://ollama.com/download

#### 2. Start Ollama Service

```bash
ollama serve
```

This starts the Ollama server on `http://localhost:11434`

#### 3. Download a Model

```bash
# Recommended: Llama 3.2 (small, fast, good quality)
ollama pull llama3.2

# Or use Mistral (alternative)
ollama pull mistral

# Or use Phi-3 (very small, fast)
ollama pull phi3
```

#### 4. Configure Environment

Create/update `.env.local`:
```bash
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

#### 5. Test It

```bash
# Test Ollama is working
curl http://localhost:11434/api/tags
```

You should see your downloaded models listed.

---

## 🥈 Option 2: Hugging Face (Cloud - Free Tier)

### Why Hugging Face?
- ✅ **Free Tier** - 30,000 requests/month free
- ✅ **No Local Setup** - Cloud-based
- ✅ **Multiple Models** - Choose from many open models

### Setup Steps:

#### 1. Get API Key

1. Go to: https://huggingface.co/settings/tokens
2. Sign up or log in
3. Create a new token (read access is enough)
4. Copy the token

#### 2. Configure Environment

Create/update `.env.local`:
```bash
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_token_here
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

**Available Models:**
- `mistralai/Mistral-7B-Instruct-v0.2` (Recommended)
- `meta-llama/Llama-2-7b-chat-hf`
- `google/flan-t5-large`

#### 3. That's It!

No local installation needed. Just set the API key.

---

## 🥉 Option 3: Groq (Fast Cloud - Free Tier)

### Why Groq?
- ✅ **Very Fast** - Fastest inference available
- ✅ **Free Tier** - 14,400 requests/day free
- ✅ **Open Models** - Uses Llama, Mixtral, etc.

### Setup Steps:

#### 1. Get API Key

1. Go to: https://console.groq.com
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key

#### 2. Configure Environment

Create/update `.env.local`:
```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

**Available Models:**
- `llama-3.1-8b-instant` (Fastest)
- `llama-3.1-70b-versatile` (Better quality)
- `mixtral-8x7b-32768`

#### 3. Ready to Use!

---

## 🔧 Environment Variables Summary

### For Ollama (Local):
```bash
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### For Hugging Face:
```bash
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=your_token_here
HUGGINGFACE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
```

### For Groq:
```bash
LLM_PROVIDER=groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

---

## 🚀 Quick Start (Ollama - Recommended)

```bash
# 1. Install Ollama
brew install ollama  # macOS
# or download from ollama.com

# 2. Start Ollama
ollama serve

# 3. Download model (in new terminal)
ollama pull llama3.2

# 4. Update .env.local
echo "LLM_PROVIDER=ollama" >> .env.local
echo "OLLAMA_MODEL=llama3.2" >> .env.local

# 5. Run your app
npm run dev
```

---

## 📊 Comparison

| Feature | Ollama | Hugging Face | Groq |
|---------|--------|--------------|------|
| **Cost** | Free | Free tier | Free tier |
| **Setup** | Local install | API key only | API key only |
| **Privacy** | 100% local | Cloud | Cloud |
| **Speed** | Fast (local) | Medium | Very Fast |
| **Internet** | Not needed | Required | Required |
| **Best For** | Privacy-focused | Quick setup | Speed-focused |

---

## 🐛 Troubleshooting

### Ollama: "Connection refused"
- Make sure `ollama serve` is running
- Check `OLLAMA_URL` in `.env.local`
- Try: `curl http://localhost:11434/api/tags`

### Ollama: "Model not found"
- Download the model: `ollama pull llama3.2`
- Check model name matches `OLLAMA_MODEL` in `.env.local`

### Hugging Face: "Model is loading"
- First request takes 30-60 seconds (model loading)
- Subsequent requests are fast
- Use a smaller model for faster loading

### Groq: "Rate limit exceeded"
- Free tier: 14,400 requests/day
- Wait or upgrade to paid plan

### All: "Failed to parse intent"
- Check your `.env.local` has correct provider
- Verify API keys are correct
- Check console for detailed errors

---

## ✅ Recommended Setup

**For Privacy & Cost:** Use **Ollama** (local, free)
**For Speed:** Use **Groq** (fastest, free tier)
**For Easy Setup:** Use **Hugging Face** (just API key)

---

## 🎉 You're Done!

Your app now uses open-source LLMs. No OpenAI required!

**Next:** Run `npm run dev` and test your voice commands!

