# Deploy to Vercel with Groq AI

This guide will help you deploy your Solana Voice Agent to Vercel with Groq AI integration.

## Prerequisites

- GitHub account
- Vercel account (free at vercel.com)
- Your Groq API key (already configured)
- Hume AI API keys (for voice features)

## Step 1: Update Your Environment Variables

Replace the placeholder values in `.env.local`:

```bash
# Production LLM Configuration
LLM_PROVIDER=groq
GROQ_API_KEY=YOUR_GROQ_API_KEY
GROQ_MODEL=llama-3.1-8b-instant

# Hume AI (Voice Synthesis) - Get these from https://hume.ai
HUME_API_KEY=your_actual_hume_api_key
HUME_SECRET_KEY=your_actual_hume_secret_key

# Solana RPC URL
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

## Step 2: Push to GitHub

```bash
# Add and commit your changes
git add .
git commit -m "Configure Groq AI and update environment"

# Push to GitHub
git push origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Select your repository
4. Click "Deploy"

## Step 4: Add Environment Variables to Vercel

After deployment, go to your project settings:

1. Go to your project dashboard
2. Click on "Settings" → "Environment Variables"
3. Add these variables:
   - `LLM_PROVIDER` = `groq`
   - `GROQ_API_KEY` = `YOUR_GROQ_API_KEY`
   - `GROQ_MODEL` = `llama-3.1-8b-instant`
   - `HUME_API_KEY` = `your_hume_api_key`
   - `HUME_SECRET_KEY` = `your_hume_secret_key`
   - `NEXT_PUBLIC_SOLANA_RPC_URL` = `https://api.devnet.solana.com`

## Step 5: Redeploy

After adding environment variables, go to "Deployments" and click "Redeploy" to apply the new environment variables.

## Your App Features

With Groq AI integration, your deployed app will have:

- ✅ Fast AI responses (often 10x faster than other providers)
- ✅ Voice command processing
- ✅ Solana transaction handling
- ✅ Smart contract generation and auditing
- ✅ Celebrity voice agents
- ✅ Transaction optimization
- ✅ Network analysis

## Testing Your Deployment

Once deployed, your app will be available at:
`https://your-project-name.vercel.app`

## Troubleshooting

If you encounter issues:

1. **Check environment variables** - ensure all required variables are set in Vercel
2. **Verify API keys** - make sure your Groq and Hume keys are valid
3. **Check console** - look for any error messages in browser console
4. **API routes** - ensure your API routes are working properly

## Performance Benefits of Groq

- **Speed**: Groq provides some of the fastest inference times available
- **Cost-effective**: Competitive pricing for production use
- **Reliability**: Consistent performance for production applications
- **Advanced models**: Access to latest Llama models

Your app is now ready for production with Groq AI backend! 🚀