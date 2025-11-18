# OPENAI API Key Setup (Optional)

## Current Status
✅ **Voice-to-Text (STT)**: Fully working with Groq Whisper API
⚠️ **Text-to-Speech (TTS)**: Using Browser TTS fallback

## Why Add OpenAI API Key?

### With OpenAI API Key:
- **High-Quality TTS**: Professional voices (Nova, Onyx, Alloy, Echo, Fable, Shimmer)
- **Natural Speech**: Best-in-class voice synthesis
- **Consistent Quality**: Same quality across all browsers
- **Multiple Languages**: Perfect pronunciation for EN/AR

### Without OpenAI API Key (Current):
- **Browser TTS**: Free, works offline
- **Variable Quality**: Depends on browser and OS
- **Gender Selection**: Limited voice options
- **Good Enough**: Functional for testing and basic use

## How to Add OpenAI API Key

### Step 1: Get API Key
1. Visit: https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Add to Environment Variables

**File**: `apps/web/.env.local`

Add this line:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Restart Dev Server
```bash
cd apps/web
pnpm dev
```

## Pricing (Optional Info)

### OpenAI TTS Pricing:
- **TTS-1-HD Model**: $0.015 per 1,000 characters
- **Example**: 100 messages × 200 chars = 20,000 chars = $0.30

### Groq Whisper (Currently Used):
- **FREE**: No cost for transcription
- **Fast**: Low latency
- **Accurate**: Same Whisper model as OpenAI

## Alternative: ElevenLabs (Premium)

For even better quality, add ElevenLabs:

```env
ELEVENLABS_API_KEY=your-elevenlabs-key
```

**Pricing**: $5/month for 30,000 characters
**Quality**: Best voice cloning and natural speech

## Recommendation

### For Production:
- **Add OpenAI API Key** for professional quality
- Cost is minimal (~$1-2/month for typical usage)

### For Development/Testing:
- **Keep Browser TTS** (current setup)
- Free, no API limits
- Good enough for testing

## Current Implementation

The system automatically handles both scenarios:

1. **If OPENAI_API_KEY exists**: Uses OpenAI TTS-1-HD
2. **If ELEVENLABS_API_KEY exists**: Uses ElevenLabs
3. **If neither exists**: Falls back to Browser TTS

No code changes needed - just add the API key and restart!

---

**Status**: ✅ Voice system fully functional with or without API key
**Browser TTS**: Works in Chrome, Edge, Firefox, Safari
**Quality**: Good enough for most use cases
