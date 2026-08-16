# 🎙️ Voice NFT Marketplace Setup Guide

## Overview

This is an NFT-based AI Voice Agent Marketplace where:
- Celebrities record their voice
- Voice is converted to an AI voice model
- Ownership is represented by an NFT on Solana
- NFT holders can prompt the voice to say anything
- Voice agent generates audio on demand

## Example Flow: Amitabh Bachchan

1. **Amitabh Bachchan records his voice** (5-15 minutes)
2. **Voice NFT is minted** on Solana
3. **User buys the NFT** for 1 SOL
4. **User prompts**: "Say happy birthday Kush"
5. **System generates audio** of Amitabh Bachchan saying "Happy birthday Kush"

## Setup Instructions

### 1. Configure ElevenLabs API (Recommended for MVP)

1. Sign up at: https://elevenlabs.io
2. Get your API key from dashboard
3. Add to `.env.local`:

```bash
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=default_voice_id  # Optional, will use voiceId from NFT
```

### 2. Alternative: Self-Hosted Voice Models

If you want to use XTTS, Bark, or OpenVoice instead:

1. Set up voice model server
2. Update `/app/api/voice/generate/route.ts`
3. Replace ElevenLabs API call with your model

## How to Use

### For Celebrities: Upload Voice

1. Go to **Voice Agent Marketplace** tab
2. Click **Celebrity Voice Upload** section
3. Enter celebrity name (e.g., "Amitabh Bachchan")
4. Add description
5. Set price (e.g., 1.0 SOL)
6. Click **Start Recording**
7. Record 5-15 minutes of clear voice
8. Click **Create Voice NFT**

### For Users: Buy & Use Voice

1. Browse marketplace for voice NFTs
2. Click **Buy** on desired voice (e.g., Amitabh Bachchan)
3. After purchase, click **Preview**
4. In the modal, scroll to **Voice Generation** section
5. Enter prompt: "Say happy birthday Kush"
6. Click **Generate Voice**
7. Audio plays with celebrity's voice!

## API Endpoints

### POST `/api/voice-agents/mint-nft`
Creates NFT metadata for a voice agent.

**Request:**
```json
{
  "wallet": "wallet_address",
  "voiceId": "amitabh_bachchan",
  "celebrityName": "Amitabh Bachchan",
  "description": "Legendary actor's voice",
  "imageUrl": "https://...",
  "usageType": "Personal",
  "maxRequests": 1000
}
```

### POST `/api/voice/generate`
Generates voice audio from text prompt.

**Request:**
```json
{
  "prompt": "Say happy birthday Kush",
  "wallet": "wallet_address",
  "voiceId": "amitabh_bachchan"
}
```

**Response:**
```json
{
  "success": true,
  "audio": "data:audio/mpeg;base64,...",
  "prompt": "Say happy birthday Kush",
  "voiceId": "amitabh_bachchan"
}
```

## NFT Ownership Verification

Currently simplified for MVP. In production:

1. Store NFT mint address in voice agent metadata
2. Verify wallet owns token from that mint
3. Check token account balance > 0
4. Validate NFT metadata matches voiceId

## Production Enhancements

1. **Metaplex Integration**: Use Metaplex SDK for proper NFT minting
2. **IPFS Storage**: Store voice models on IPFS/Arweave
3. **Voice Training**: Integrate voice cloning service
4. **Usage Limits**: Track requests per NFT
5. **Royalties**: Pay celebrities on each sale
6. **Watermarking**: Add audio watermarking for security

## Security & Legal

- ✅ Explicit consent from celebrities required
- ✅ Prompt filtering to prevent abuse
- ✅ No impersonation for fraud
- ✅ Audio watermarking (in production)
- ✅ Usage limits enforced

## Testing

1. **Test Voice Upload**:
   - Record a test voice
   - Create NFT metadata
   - Verify it appears in marketplace

2. **Test Voice Generation**:
   - Buy a voice NFT (or use test mode)
   - Generate voice with prompt
   - Verify audio plays correctly

3. **Test NFT Ownership**:
   - Try generating without owning NFT
   - Should show error: "You don't own the NFT"

## Troubleshooting

### "Voice generation not configured"
- Add `ELEVENLABS_API_KEY` to `.env.local`
- Or set up alternative TTS service

### "You don't own the NFT"
- Make sure you've purchased the voice NFT
- Check wallet connection
- Verify NFT ownership on-chain

### Audio not playing
- Check browser audio permissions
- Verify audio format (MP3/M4A)
- Check network connection

## Next Steps

1. ✅ MVP Complete - Basic voice NFT system
2. 🔄 Add Metaplex NFT minting
3. 🔄 Integrate voice training service
4. 🔄 Add usage tracking
5. 🔄 Implement royalties

