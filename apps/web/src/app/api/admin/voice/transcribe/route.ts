import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/voice/transcribe
 * Transcribe audio to text using OpenAI Whisper API
 */
export async function POST(req: NextRequest) {
  try {
    const customSession = await getCustomSession();
    let userRole = (customSession?.user as any)?.role;
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      userRole = (session?.user as any)?.role;
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    if (userRole !== 'admin' && userRole !== 'superadmin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Use Groq Whisper API (primary)
    const groqApiKey = process.env.GROQ_API_KEY_ADMIN || process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Convert File to FormData for Groq Whisper
    const whisperFormData = new FormData();
    whisperFormData.append('file', audioFile);
    whisperFormData.append('model', 'whisper-large-v3-turbo'); // Groq's Whisper model
    whisperFormData.append('language', 'en'); // Auto-detect if not specified
    whisperFormData.append('response_format', 'json');

    // Try Groq Whisper first
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
        },
        body: whisperFormData,
      });

      if (groqResponse.ok) {
        const data = await groqResponse.json();
        return NextResponse.json({
          text: data.text,
          language: data.language || 'en',
          duration: data.duration,
        });
      }

      console.error('Groq transcription failed:', await groqResponse.text());
    } catch (groqError) {
      console.error('Groq transcription error:', groqError);
    }

    // Fallback to OpenAI if available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      try {
        const openaiFormData = new FormData();
        openaiFormData.append('file', audioFile);
        openaiFormData.append('model', 'whisper-1');

        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
          },
          body: openaiFormData,
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            text: data.text,
            language: data.language || 'en',
            duration: data.duration,
          });
        }
      } catch (openaiError) {
        console.error('OpenAI transcription failed:', openaiError);
      }
    }

    throw new Error('All transcription services failed');

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transcription failed' },
      { status: 500 }
    );
  }
}
