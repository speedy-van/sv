import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/admin/voice/tts
 * Convert text to speech using OpenAI TTS API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if ((session.user as any).role !== 'admin' && (session.user as any).role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { text, voice = 'alloy' } = body;

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Try OpenAI TTS first (best quality)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'tts-1-hd', // High quality model
            input: text,
            voice: voice, // alloy, echo, fable, onyx, nova, shimmer
            speed: 1.0,
          }),
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
            },
          });
        }
      } catch (error) {
        console.error('OpenAI TTS failed, trying fallback:', error);
      }
    }

    // Fallback: Use ElevenLabs or Deepgram (if available)
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey) {
      try {
        // Map voices: nova -> female, onyx -> male
        const elevenVoiceId = voice === 'nova' || voice === 'shimmer' 
          ? '21m00Tcm4TlvDq8ikWAM' // Female voice
          : 'VR6AewLTigWG4xSOukaG'; // Male voice

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': elevenLabsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5
            }
          }),
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          return new NextResponse(audioBuffer, {
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
            },
          });
        }
      } catch (error) {
        console.error('ElevenLabs TTS failed:', error);
      }
    }

    // Final fallback: Return instruction for browser TTS
    return NextResponse.json({
      error: 'TTS service not available. OpenAI API key required.',
      fallback: 'browser-tts',
      text: text,
      voice: voice,
    }, { status: 503 });

  } catch (error) {
    console.error('TTS error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'TTS failed' },
      { status: 500 }
    );
  }
}
