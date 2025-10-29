import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const chatSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
  extractedData: z.object({
    pickupAddress: z.string().optional(),
    dropoffAddress: z.string().optional(),
    numberOfRooms: z.number().optional(),
    specialItems: z.array(z.string()).optional(),
    movingDate: z.string().optional(),
    vehicleType: z.string().optional(),
  }).optional(),
});

const SYSTEM_PROMPT = `You are Speedy AI, an intelligent moving assistant for Speedy Van - a professional moving and logistics company in the UK.

Your role:
1. Help customers get instant moving quotes
2. Ask relevant questions naturally to gather: pickup address, drop-off address, number of rooms, special items (piano, antiques, etc.), and preferred moving date
3. Be friendly, professional, and concise
4. Once you have enough information, indicate you're ready to calculate a quote by saying "CALCULATE_QUOTE" in your response
5. Understand natural language - if a customer says "I'm moving from London to Manchester with 3 bedrooms", extract that information
6. If customer mentions special items like "piano", "antiques", "heavy furniture", note them
7. Ask one question at a time to keep conversation smooth
8. Be helpful with moving tips and suggestions

Available vehicle types:
- Small Van (1-2 rooms, small items)
- Medium Van (2-3 rooms, standard furniture)
- Large Van (3-4 rooms, full house move)
- Luton Van (4+ rooms, large house move)

Remember: Keep responses short (2-3 sentences max), natural, and focused on getting quote information.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = chatSchema.parse(body);

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(validated.conversationHistory || []),
      { role: 'user', content: validated.message },
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'I apologize, I couldn\'t process that. Could you please rephrase?';

    // Extract information from the conversation
    const extractedData = validated.extractedData || {};
    const userMessage = validated.message.toLowerCase();

    // Simple extraction logic (can be enhanced)
    if (userMessage.includes('bedroom') || userMessage.includes('room')) {
      const roomMatch = userMessage.match(/(\d+)\s*(bedroom|room)/i);
      if (roomMatch) {
        extractedData.numberOfRooms = parseInt(roomMatch[1]);
      }
    }

    // Check if we should calculate quote
    const shouldCalculateQuote = aiResponse.includes('CALCULATE_QUOTE') || 
      (extractedData.pickupAddress && extractedData.dropoffAddress && extractedData.numberOfRooms);

    return NextResponse.json({
      success: true,
      message: aiResponse.replace('CALCULATE_QUOTE', '').trim(),
      extractedData,
      shouldCalculateQuote,
      conversationId: chatCompletion.id,
    });

  } catch (error: any) {
    console.error('❌ AI Chat error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process chat',
        message: 'I apologize, I\'m experiencing technical difficulties. Please try again or contact our support team.',
      },
      { status: 500 }
    );
  }
}

