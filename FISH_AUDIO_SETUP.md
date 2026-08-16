# 🐟 Fish Audio Celebrity Voice Setup

## Overview

This guide shows you how to configure **Fish Studio** celebrity voice models for the Aawaz platform.

---

## Prerequisites

- Fish Audio account (https://fish.audio)
- Reference audio samples of celebrities (3-5 minutes recommended)
- API key from Fish Audio

---

## Step 1: Get Fish Audio API Key

1. Visit https://fish.audio/go-api
2. Sign up or log in
3. Generate a new API key
4. Copy the key

5. Add to your `.env.local`:
```bash
FISH_AUDIO_API_KEY=your_fish_audio_key_here
```

---

## Step 2: Train Celebrity Models in Fish Studio

### For Donald Trump:

1. **Collect Audio Samples**
   - Find 3-5 minutes of clear Trump speech
   - Use speeches, interviews, rallies
   - Ensure good audio quality (no background noise)

2. **Upload to Fish Studio**
   - Go to https://fish.audio
   - Click "Create New Model"
   - Upload your audio files
   - Name: "Donald Trump"
   - Language: English (en-US)

3. **Train the Model**
   - Click "Train"
   - Wait 10-30 minutes for training
   - Test the output quality

4. **Get Reference ID**
   - Copy the `reference_id` from the model page
   - Example: `ref_trump_abc123xyz`

5. **Update Code**
   - Open `app/lib/fishAudio.ts`
   - Find `CELEBRITY_VOICES`
   - Update:
   ```typescript
   "donald-trump": {
     referenceId: "ref_trump_abc123xyz", // ← YOUR ID HERE
     name: "Donald Trump",
     language: "en-US",
     ...
   }
   ```

### For Amitabh Bachchan:

Follow the same steps, but:
- Use Hindi/English dialogue clips
- Language: Hindi (hi-IN) or English (en-IN)
- Reference movies, ads, interviews
- Update the `"amitabh-bachchan"` entry

---

## Step 3: Test Your Setup

1. **Start the dev server**:
   ```bash
   npm run dev
   ```

2. **Open the app**: http://localhost:3000

3. **Navigate to Fish Voice**:
   - Click the 🐟 **Celebrity Voice** card

4. **Test Generation**:
   - Select "Donald Trump"
   - Type: "Happy Birthday John! You're doing a tremendous job!"
   - Click "Generate Voice"
   - Listen to the output

5. **Download & Share**:
   - Click "Download" to save the MP3
   - Optional: Mint as NFT on Solana

---

## API Endpoints

### Generate Celebrity Voice
```
POST /api/fish-audio/generate
```

**Request Body**:
```json
{
  "text": "Your custom message here",
  "celebrityId": "donald-trump",
  "format": "mp3"
}
```

**Response**: Binary audio data (MP3)

---

### List Available Celebrities
```
GET /api/fish-audio/generate
```

**Response**:
```json
{
  "success": true,
  "celebrities": [
    {
      "id": "donald-trump",
      "name": "Donald Trump",
      "language": "en-US",
      "description": "Presidential, confident tone"
    }
  ]
}
```

---

## Advanced Configuration

### Custom Voice Model

Want to add your own celebrity?

1. Train a model in Fish Studio
2. Add to `CELEBRITY_VOICES` in `app/lib/fishAudio.ts`:

```typescript
"your-celebrity": {
  referenceId: "ref_your_id_here",
  name: "Your Celebrity Name",
  language: "en-US",
  description: "Voice characteristics",
  style: "custom",
}
```

3. Update the dropdown in `FishVoiceGenerator.tsx`:

```typescript
const celebrityOptions = [
  { id: "donald-trump", name: "Donald Trump 🇺🇸", emoji: "🎤" },
  { id: "amitabh-bachchan", name: "Amitabh Bachchan 🇮🇳", emoji: "🎬" },
  { id: "your-celebrity", name: "Your Celebrity", emoji: "⭐" }, // Add here
];
```

---

## Voice Quality Tips

### Best Practices:
- ✅ Use high-quality source audio (>128kbps)
- ✅ Clean audio without background music
- ✅ Consistent tone across samples
- ✅ 3-5 minutes of reference audio
- ✅ Multiple audio clips better than one long clip

### Avoid:
- ❌ Low-quality recordings
- ❌ Heavy background noise
- ❌ Music or sound effects
- ❌ Multiple speakers in one clip

---

## Pricing

Fish Audio pricing varies by usage:
- Check current rates at https://fish.audio/pricing
- Free tier available for testing
- Pay-as-you-go for production

---

## Troubleshooting

### Error: "API key not configured"
- Check `.env.local` has `FISH_AUDIO_API_KEY`
- Restart dev server after adding key

### Error: "Reference ID not configured"
- Update `referenceId` in `CELEBRITY_VOICES`
- Make sure model is fully trained in Fish Studio

### Poor voice quality
- Re-train with better source audio
- Adjust `temperature` parameter (0.5-1.0)
- Try different audio samples

### API rate limits
- Upgrade Fish Audio plan
- Implement caching for repeated messages

---

## Next Steps

- **NFT Integration**: Mint generated voices as Solana NFTs
- **Voice Marketplace**: Sell celebrity messages
- **Voice Cloning**: Create personal voice models
- **Multi-Language**: Expand to more languages

---

## Support

- Fish Audio Docs: https://docs.fish.audio
- Aawaz GitHub Issues: [Your repo link]
- Discord: [Your community link]

---

**Note**: Ensure you have proper rights/permissions for celebrity voice cloning in your jurisdiction.
