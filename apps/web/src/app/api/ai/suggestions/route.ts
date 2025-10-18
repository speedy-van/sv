import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI Suggestions API - DeepSeek Integration
 * Generates smart item suggestions based on property type and move type
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyType, moveType } = body;

    if (!propertyType || !moveType) {
      return NextResponse.json(
        { success: false, error: 'Property type and move type are required' },
        { status: 400 }
      );
    }

    // Use DeepSeek API directly
    const apiKey = 'sk-dbc85858f63d44aebc7e9ef9ae2a48da';

    const prompt = `You are a moving company assistant. Generate a realistic list of items for a ${propertyType} ${moveType}.

Property Type: ${propertyType}
Move Type: ${moveType}

Generate a JSON array of items with the following structure:
[
  {
    "name": "Item name",
    "category": "furniture|electronics|appliances|boxes|other",
    "quantity": number
  }
]

Rules:
- Be realistic and practical
- Include common items for this property type
- Adjust quantities based on property size
- Include boxes and packing materials
- Maximum 30 items
- Return ONLY the JSON array, no explanations

Example for "1 Bedroom" "House Move":
[
  {"name": "Bed", "category": "furniture", "quantity": 1},
  {"name": "Mattress", "category": "furniture", "quantity": 1},
  {"name": "Sofa", "category": "furniture", "quantity": 1},
  {"name": "TV", "category": "electronics", "quantity": 1},
  {"name": "Dining Table", "category": "furniture", "quantity": 1},
  {"name": "Chairs", "category": "furniture", "quantity": 4},
  {"name": "Wardrobe", "category": "furniture", "quantity": 1},
  {"name": "Desk", "category": "furniture", "quantity": 1},
  {"name": "Refrigerator", "category": "appliances", "quantity": 1},
  {"name": "Washing Machine", "category": "appliances", "quantity": 1},
  {"name": "Medium Box", "category": "boxes", "quantity": 15}
]`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat', // Using DeepSeek model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful moving company assistant that generates realistic item lists for different types of moves.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API error:', errorText);
      return NextResponse.json(
        { success: false, error: 'AI service error' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('❌ No content in AI response');
      return NextResponse.json(
        { success: false, error: 'No AI response' },
        { status: 500 }
      );
    }

    // Parse the JSON response
    let items;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        items = JSON.parse(jsonMatch[0]);
      } else {
        items = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', content);
      return NextResponse.json(
        { success: false, error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    console.log(`✅ AI Suggestions generated: ${items.length} items for ${propertyType} ${moveType}`);

    return NextResponse.json({
      success: true,
      items,
      propertyType,
      moveType,
    });
  } catch (error) {
    console.error('❌ AI Suggestions API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

