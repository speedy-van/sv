import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';

function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    return null;
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

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
2. Ask relevant questions naturally to gather: pickup address, drop-off address, number of rooms OR specific items, special items (piano, antiques, etc.), and preferred moving date
3. Be friendly, professional, and concise
4. NEVER ask for information that has ALREADY been provided in the conversation
5. Review the conversation history and extracted data carefully before asking questions
6. Once you have enough information (pickup + dropoff + items/rooms), indicate you're ready to calculate a quote by saying "CALCULATE_QUOTE"
7. If customer mentions only specific items (like "3 seat sofa" or "just a sofa"), treat that as their moving requirement - DON'T ask about rooms again
8. Ask ONE question at a time to keep conversation smooth
9. Be helpful with moving tips and suggestions

Available vehicle types:
- Small Van (1-2 rooms, small items, single sofa)
- Medium Van (2-3 rooms, standard furniture)
- Large Van (3-4 rooms, full house move)
- Luton Van (4+ rooms, large house move)

CRITICAL: If pickup address, drop-off address, and items (rooms OR specific items like sofa) are provided, say CALCULATE_QUOTE and confirm the details. DO NOT repeat questions about information already given.

Remember: Keep responses short (2-3 sentences max), natural, and focused on getting quote information.`;

// Helper function to extract data from user message
function extractDataFromMessage(message: string, currentData: any = {}) {
  const lowerMessage = message.toLowerCase();
  const updatedData = { ...currentData };

  // Extract UK postcode pattern
  const postcodeMatch = message.match(/\b([A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2})\b/i);
  
  // Extract street address pattern
  const addressMatch = message.match(/\b(\d+\s+[A-Za-z\s]+(?:street|road|avenue|lane|drive|way|close|court|place|crescent|terrace|square))\b/i);

  // If we have an address but no pickup yet, it's pickup
  if (addressMatch && !updatedData.pickupAddress) {
    updatedData.pickupAddress = addressMatch[0];
  }
  // If we have pickup and find another address, it's dropoff
  else if (addressMatch && updatedData.pickupAddress && !updatedData.dropoffAddress) {
    updatedData.dropoffAddress = addressMatch[0];
  }

  // Add postcode to the appropriate address
  if (postcodeMatch) {
    const postcode = postcodeMatch[0].toUpperCase();
    if (updatedData.pickupAddress && !updatedData.pickupAddress.includes(postcode) && !updatedData.dropoffAddress) {
      updatedData.pickupAddress += ', ' + postcode;
    } else if (updatedData.pickupAddress && updatedData.dropoffAddress && !updatedData.dropoffAddress.includes(postcode)) {
      updatedData.dropoffAddress += ', ' + postcode;
    }
  }

  // Extract number of rooms
  if (lowerMessage.includes('bedroom') || lowerMessage.includes('room')) {
    const roomMatch = message.match(/(\d+)\s*(?:bedroom|room|bed)/i);
    if (roomMatch) {
      updatedData.numberOfRooms = parseInt(roomMatch[1]);
    }
  }

  // Extract special items
  const specialItemsKeywords = ['sofa', 'piano', 'antique', 'furniture', 'bed', 'table', 'chair', 'wardrobe', 'fridge', 'washing machine'];
  specialItemsKeywords.forEach(item => {
    if (lowerMessage.includes(item)) {
      updatedData.specialItems = updatedData.specialItems || [];
      if (!updatedData.specialItems.includes(item)) {
        updatedData.specialItems.push(item);
      }
    }
  });

  // Extract moving date
  const datePatterns = [
    /(?:on|by|for)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?)/i,
    /(?:on|by|for)\s+(tomorrow|today|next week|this weekend)/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  ];
  
  for (const pattern of datePatterns) {
    const dateMatch = message.match(pattern);
    if (dateMatch) {
      updatedData.movingDate = dateMatch[1];
      break;
    }
  }

  return updatedData;
}

export async function POST(request: NextRequest) {
  try {
    const groq = getGroqClient();
    
    if (!groq) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service is not configured',
          message: 'I apologize, but the AI service is currently unavailable. Please contact support at support@speedy-van.co.uk or call 01202129764 for assistance.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validated = chatSchema.parse(body);

    // Extract data from current message and merge with existing
    const extractedData = extractDataFromMessage(validated.message, validated.extractedData || {});

    // Build context summary for AI
    const contextSummary = [];
    if (extractedData.pickupAddress) contextSummary.push(`Pickup: ${extractedData.pickupAddress}`);
    if (extractedData.dropoffAddress) contextSummary.push(`Drop-off: ${extractedData.dropoffAddress}`);
    if (extractedData.numberOfRooms) contextSummary.push(`Rooms: ${extractedData.numberOfRooms}`);
    if (extractedData.specialItems?.length) contextSummary.push(`Items: ${extractedData.specialItems.join(', ')}`);
    if (extractedData.movingDate) contextSummary.push(`Date: ${extractedData.movingDate}`);

    const contextMessage = contextSummary.length > 0 
      ? `\n\nCurrent extracted information: ${contextSummary.join(' | ')}`
      : '';

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextMessage },
      ...(validated.conversationHistory || []),
      { role: 'user', content: validated.message },
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 500,
      top_p: 1,
      stream: false,
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || 'I apologize, I couldn\'t process that. Could you please rephrase?';

    // Determine if we have enough information for a quote
    const hasEnoughInfo = extractedData.pickupAddress && 
                          extractedData.dropoffAddress && 
                          (extractedData.numberOfRooms || (extractedData.specialItems?.length > 0));

    const shouldCalculateQuote = aiResponse.includes('CALCULATE_QUOTE') || hasEnoughInfo;

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
