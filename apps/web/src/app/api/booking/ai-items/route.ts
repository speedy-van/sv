import { randomUUID } from 'crypto';

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';

import { ALL_REMOVAL_ITEMS, type RemovalItem } from '@/lib/uk-removal-items-data';

type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AiExtractionItem = {
  rawText?: string;
  canonicalName?: string;
  categoryGroup?: string;
  roomCategory?: string;
  itemType?: string;
  size?: string | null;
  quantity?: number | null;
  notes?: string;
  missingDetails?: { field: string; question: string }[];
  confidence?: number;
};

type AiExtractionPayload = {
  summary?: string;
  items?: AiExtractionItem[];
  followUpQuestions?: string[];
};

type PendingQuestion = {
  id: string;
  question: string;
  field: string;
  itemName: string;
};

type AddedItemPayload = {
  item: RemovalItem;
  quantity: number;
  room: string;
  size?: string | null;
  itemType?: string;
  source?: string;
};

const STEP2_CATEGORY_GUIDE = `
CATEGORY GROUPS (categoryGroup):
- house_flat → Residential moves (House / Flat)
- office → Desks, chairs, IT and commercial furniture
- storage → Long term storage crates, shelving, racking
- single_items → One-off bulky pieces (pianos, pool tables, antiques)
- catalog → Items sourced from the search catalog or unusual objects
- all → Applies to every category / mixed loads

ROOM CATEGORIES (roomCategory):
- bedroom, living, dining, kitchen, bathroom, office, garden, boxes, storage, misc
`.trim();

const SYSTEM_PROMPT = `
You are Speedy Van's AI inventory extraction engine. Read messy customer language, understand context, and produce structured JSON.

Your job:
1. Parse the conversation and the latest customer message.
2. Extract EVERY item they want to move - whether it's a standard catalog item OR a unique custom item.
3. Map each item to Speedy Van categories described below.
4. **CRITICAL**: Accept ALL items, even if they're unusual or custom (antiques, handmade furniture, unique equipment, etc.)
5. Never invent details. If size or quantity is unclear, set it to null and include a follow-up question in "missingDetails".
6. If the wording clearly implies a single item (e.g. "a piano", "one sofa"), set quantity to 1. Otherwise leave null until the customer confirms.
7. Recognise variations: "double bed", "3 seater sofa", "big fridge", "office chairs".
8. **CRITICAL for sofas/couches**: Extract seat numbers precisely (e.g., "3 seater" → size: "3-seater" or "3 seat", "2 seater" → size: "2-seater").
9. **CRITICAL for beds**: Extract bed sizes precisely (e.g., "king bed" → size: "king", "double bed" → size: "double").
10. For custom/unusual items: Extract as much detail as possible (item type, estimated size, special handling needs).
11. Understand all Step 2 categories and align each item accordingly.
12. Output clean JSON only, matching the schema exactly.

${STEP2_CATEGORY_GUIDE}

JSON schema:
{
  "summary": "short professional summary of what you understood",
  "items": [
    {
      "rawText": "verbatim text snippet",
      "canonicalName": "friendly name like Sofa (3 seater)",
      "categoryGroup": "house_flat | office | storage | single_items | catalog | all",
      "roomCategory": "bedroom | living | dining | kitchen | bathroom | office | garden | boxes | storage | misc",
      "itemType": "bed | sofa | fridge | boxes | wardrobe | desk | etc",
      "size": "double | king | 3-seater | american | small | medium | large | null",
      "quantity": number | null,
      "notes": "extra context",
      "missingDetails": [
        { "field": "quantity|size|type|category", "question": "Follow-up question to ask the customer" }
      ],
      "confidence": 0-1
    }
  ],
  "followUpQuestions": ["Consolidated unique question strings derived from missing fields"]
}

Rules:
- Respond with JSON only. No commentary.
- When multiple items are bundled in one phrase ("two beds and a sofa"), split them into separate entries.
- Use British wording and measurements where relevant.
- Follow-up questions must be specific: "How many medium boxes do you have?" not "More info please".
- Do not repeat questions already answered in the conversation.
`.trim();

const aiRequestSchema = z.object({
  message: z.string().min(4, 'Message must be at least 4 characters'),
  propertyType: z.enum(['house', 'flat', 'office', 'storage', 'single-items']).optional(),
  conversation: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .optional(),
  selectedItems: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        quantity: z.number().min(0),
      })
    )
    .optional(),
});

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'item',
  'items',
  'some',
  'few',
  'jpg',
  'jpeg',
  'image',
]);

const ROOM_KEYWORD_MAP: Record<string, string[]> = {
  bedroom: ['bedroom', 'bed', 'mattress', 'wardrobe', 'dresser', 'nightstand'],
  living: ['living', 'sofa', 'couch', 'tv', 'entertainment', 'coffee', 'bookcase'],
  dining: ['dining', 'sideboard', 'buffet', 'table', 'chair', 'bench'],
  kitchen: ['kitchen', 'fridge', 'freezer', 'oven', 'dishwasher', 'appliance', 'microwave'],
  bathroom: ['bath', 'bathroom', 'vanity', 'toilet', 'sink'],
  office: ['office', 'desk', 'printer', 'computer', 'monitor', 'filing', 'cabinet'],
  garden: ['garden', 'outdoor', 'patio', 'bbq', 'grill', 'bike', 'lawn'],
  boxes: ['boxes', 'box', 'crate', 'container', 'packing'],
  storage: ['storage', 'shelving', 'rack', 'bin'],
  misc: [],
};

const SIZE_FALLBACK_QUESTIONS: Record<string, string> = {
  bed: 'What size is the bed (single, double, king, super king)?',
  mattress: 'What size is the mattress (single, double, king, super king)?',
  sofa: 'What type of sofa is it (2-seater, 3-seater, corner, L-shape)?',
  couch: 'What type of sofa is it (2-seater, 3-seater, corner, L-shape)?',
  fridge: 'Is the fridge under-counter, standard, or American size?',
  freezer: 'Is it a small freezer, tall upright, or American style?',
  boxes: 'How many boxes do you have and what size (small/medium/large)?',
};

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 6;
const RATE_TRACKER = new Map<string, { count: number; reset: number }>();

const preparedInventory = ALL_REMOVAL_ITEMS.map((item) => {
  const normalizedName = normalizeText(item.name);
  const normalizedCategory = normalizeText(item.category);
  return {
    item,
    normalizedName,
    normalizedCategory,
    tokens: new Set(tokenize(normalizedName)),
  };
});

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[_-]/g, ' ')
    .replace(/\b(jpg|jpeg|png)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function inferRoomFromItem(item: RemovalItem, roomHint?: string) {
  if (roomHint && ROOM_KEYWORD_MAP[roomHint]) {
    return roomHint;
  }

  const category = normalizeText(item.category);
  for (const [room, keywords] of Object.entries(ROOM_KEYWORD_MAP)) {
    if (keywords.some((keyword) => category.includes(keyword))) {
      return room;
    }
  }

  const name = normalizeText(item.name);
  for (const [room, keywords] of Object.entries(ROOM_KEYWORD_MAP)) {
    if (keywords.some((keyword) => name.includes(keyword))) {
      return room;
    }
  }

  return 'misc';
}

function scoreRemovalItem(
  candidateTokens: string[],
  entryTokens: Set<string>,
  entryName: string,
  entryCategory: string,
  hints: { roomCategory?: string; size?: string | null; itemType?: string }
) {
  let score = 0;

  candidateTokens.forEach((token) => {
    if (entryTokens.has(token)) {
      score += 8;
    } else if (entryName.includes(token)) {
      score += 4;
    } else if (entryCategory.includes(token)) {
      score += 3;
    }
  });

  if (hints.itemType) {
    const typeToken = normalizeText(hints.itemType);
    if (entryName.includes(typeToken)) {
      score += 6;
    }
  }

  // Enhanced size matching - critical for seat numbers, bed sizes, etc.
  if (hints.size) {
    const sizeToken = normalizeText(hints.size);
    if (sizeToken) {
      // Exact match for numbers (e.g., "3" in "3 seater")
      const numberMatch = sizeToken.match(/\d+/);
      if (numberMatch) {
        const sizeNumber = numberMatch[0];
        // Must contain exact number followed by "seat" or "seater"
        const exactPattern = new RegExp(`\\b${sizeNumber}\\s*seat`, 'i');
        if (exactPattern.test(entryName)) {
          score += 25; // High boost for exact seat match
        } else if (entryName.includes(sizeNumber)) {
          score += 5; // Lower boost if just the number appears
        }
      } else if (entryName.includes(sizeToken)) {
        // Non-numeric sizes like "king", "double", etc.
        score += 15;
      }
    }
  }

  if (hints.roomCategory && ROOM_KEYWORD_MAP[hints.roomCategory]) {
    const matchesRoom = ROOM_KEYWORD_MAP[hints.roomCategory].some((keyword) =>
      entryName.includes(keyword) || entryCategory.includes(keyword)
    );
    if (matchesRoom) {
      score += 5;
    }
  }

  return score;
}

function matchRemovalItem(aiItem: AiExtractionItem): RemovalItem | null {
  const tokens = tokenize(aiItem.canonicalName || aiItem.rawText || '');
  if (tokens.length === 0) {
    return null;
  }

  const hints = {
    roomCategory: aiItem.roomCategory,
    size: aiItem.size,
    itemType: aiItem.itemType,
  };

  let best: { item: RemovalItem; score: number } | null = null;
  for (const entry of preparedInventory) {
    const score = scoreRemovalItem(tokens, entry.tokens, entry.normalizedName, entry.normalizedCategory, hints);
    if (!best || score > best.score) {
      best = { item: entry.item, score };
    }
  }

  // ✅ NEW: If no good match found, create a custom item intelligently
  if (!best || best.score < 12) {
    return createCustomItem(aiItem);
  }

  return best.item;
}

/**
 * ✨ NEW FEATURE: Create custom items when no catalog match found
 * AI can now add ANY item customer requests, not just catalog items
 */
function createCustomItem(aiItem: AiExtractionItem): RemovalItem {
  // Extract item name
  const itemName = aiItem.canonicalName || aiItem.rawText || 'Custom Item';
  
  // Infer category from room or item type
  let category = 'Miscellaneous';
  if (aiItem.roomCategory) {
    const roomMap: Record<string, string> = {
      bedroom: 'Bedroom Furniture',
      living: 'Living Room Furniture',
      dining: 'Dining Room Furniture',
      kitchen: 'Kitchen Appliances',
      bathroom: 'Bathroom Fixtures',
      office: 'Office Furniture',
      garden: 'Garden & Outdoor',
      boxes: 'Boxes & Packing',
      storage: 'Storage Units',
    };
    category = roomMap[aiItem.roomCategory] || category;
  }
  
  // Estimate weight based on item type and size
  let estimatedWeight = 25; // Default medium weight
  const itemType = aiItem.itemType?.toLowerCase() || '';
  const size = aiItem.size?.toLowerCase() || 'medium';
  
  // Weight estimation logic
  if (itemType.includes('box') || itemType.includes('bag')) {
    // Boxes: 5-15 kg
    estimatedWeight = size === 'small' ? 5 : size === 'large' ? 15 : 10;
  } else if (itemType.includes('sofa') || itemType.includes('couch')) {
    // Sofas: 40-100 kg
    estimatedWeight = size.includes('2') ? 40 : size.includes('3') ? 60 : size.includes('corner') ? 100 : 50;
  } else if (itemType.includes('bed') || itemType.includes('mattress')) {
    // Beds: 30-70 kg
    estimatedWeight = size === 'single' ? 30 : size === 'double' ? 50 : size === 'king' ? 70 : 40;
  } else if (itemType.includes('fridge') || itemType.includes('freezer')) {
    // Fridges: 60-120 kg
    estimatedWeight = size === 'under-counter' ? 60 : size === 'american' ? 120 : 80;
  } else if (itemType.includes('desk') || itemType.includes('table')) {
    // Desks/Tables: 25-60 kg
    estimatedWeight = size === 'small' ? 25 : size === 'large' ? 60 : 40;
  } else if (itemType.includes('wardrobe') || itemType.includes('cabinet')) {
    // Wardrobes: 50-100 kg
    estimatedWeight = size === 'small' ? 50 : size === 'large' ? 100 : 70;
  }
  
  // Generate unique ID
  const customId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Build description with AI context
  let description = `Custom item: ${itemName}`;
  if (aiItem.size) description += `, Size: ${aiItem.size}`;
  if (aiItem.notes) description += `. ${aiItem.notes}`;
  
  console.log('✨ Created custom item:', {
    id: customId,
    name: itemName,
    category,
    weight: estimatedWeight,
    aiContext: {
      rawText: aiItem.rawText,
      itemType: aiItem.itemType,
      size: aiItem.size,
      roomCategory: aiItem.roomCategory,
    }
  });
  
  // Return a valid RemovalItem matching the interface
  return {
    id: customId,
    name: itemName,
    category,
    weight: estimatedWeight,
    image: '', // No image for custom items
    folder: 'custom-items',
  };
}

function needsSizeQuestion(aiItem: AiExtractionItem) {
  if (aiItem.size) return null;
  const typeKey = aiItem.itemType?.toLowerCase();
  if (typeKey && SIZE_FALLBACK_QUESTIONS[typeKey]) {
    return { field: 'size', question: SIZE_FALLBACK_QUESTIONS[typeKey] };
  }
  return null;
}

function needsQuantityQuestion(aiItem: AiExtractionItem) {
  if (aiItem.quantity && aiItem.quantity > 0) return null;
  const name = aiItem.canonicalName || aiItem.rawText || 'item';
  return { field: 'quantity', question: `How many ${name.toLowerCase()} do you have?` };
}

function safeRandomId() {
  try {
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random()}`;
  }
}

function mapQuestions(
  aiItem: AiExtractionItem,
  matchedName: string,
  extraQuestions: { field: string; question: string }[] = []
): PendingQuestion[] {
  const questions = [...(aiItem.missingDetails || []), ...extraQuestions];
  const seen = new Set<string>();
  return questions
    .filter((detail) => {
      const key = `${detail.field}:${detail.question}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return detail.question.trim().length > 0;
    })
    .map((detail) => ({
      id: safeRandomId(),
      question: detail.question,
      field: detail.field,
      itemName: matchedName,
    }));
}

function rateLimit(key: string) {
  const now = Date.now();
  const record = RATE_TRACKER.get(key);

  if (!record || now > record.reset) {
    RATE_TRACKER.set(key, { count: 1, reset: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

function buildUserPrompt(
  message: string,
  conversation: ConversationMessage[] = [],
  propertyType?: string,
  selectedItems?: { name: string; quantity: number }[]
) {
  const conversationBlock =
    conversation.length > 0
      ? conversation.map((entry) => `${entry.role === 'assistant' ? 'AI' : 'Customer'}: ${entry.content}`).join('\n')
      : 'No previous conversation.';

  const selectionBlock =
    selectedItems && selectedItems.length > 0
      ? selectedItems.map((item) => `• ${item.name} x${item.quantity}`).join('\n')
      : 'No confirmed items yet.';

  return `
Property type: ${propertyType || 'not selected'}

Conversation so far:
${conversationBlock}

Already selected items:
${selectionBlock}

New customer input:
"""${message}"""

Extract every item, map it to the categories, and list what details are missing.
`.trim();
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY_CUSTOMER || process.env.GROQ_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Groq({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '127.0.0.1';
    if (!rateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'Too many AI requests. Please wait a moment and try again.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, propertyType, conversation, selectedItems } = aiRequestSchema.parse(body);

    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json(
        { success: false, error: 'AI service is unavailable. Missing GROQ_API_KEY_CUSTOMER.' },
        { status: 503 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildUserPrompt(message, conversation, propertyType, selectedItems),
        },
      ],
    });

    const rawResponse = completion.choices[0]?.message?.content;
    if (!rawResponse) {
      throw new Error('Empty AI response');
    }

    let parsed: AiExtractionPayload;
    try {
      parsed = JSON.parse(rawResponse);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse AI payload', error, rawResponse);
      return NextResponse.json(
        { success: false, error: 'AI returned an unreadable response. Please try again.' },
        { status: 502 }
      );
    }

    const additions: AddedItemPayload[] = [];
    const pending: PendingQuestion[] = [];

    // Check if this is just a greeting or non-item message
    const greetingPatterns = /\b(hi|hello|hey|thanks|thank you|ok|okay|yes|no|sure)\b/i;
    const isGreeting = !parsed.items || parsed.items.length === 0;
    
    if (isGreeting && greetingPatterns.test(message)) {
      // Respond to greetings naturally
      const greetingResponse = message.toLowerCase().match(/\b(hi|hello|hey)\b/)
        ? "Hello! 👋 I'm your AI moving assistant. Just describe ANY items you're moving and I'll add them instantly - whether they're standard items (sofa, bed, boxes) or unique items (antique piano, custom furniture, etc.). I can handle it all!"
        : message.toLowerCase().match(/\b(thanks|thank you)\b/)
        ? "You're welcome! 😊 Need to add more items? Just describe them and I'll take care of it."
        : parsed.summary?.trim() || "I'm ready to help! Tell me about your items - I can add anything you describe.";
      
      return NextResponse.json({
        success: true,
        data: {
          addedItems: [],
          pendingQuestions: [],
          assistantSummary: greetingResponse,
          followUpQuestions: [],
        },
      });
    }

    (parsed.items || []).forEach((aiItem) => {
      const matched = matchRemovalItem(aiItem);
      
      // ✅ matchRemovalItem now ALWAYS returns an item (catalog or custom)
      // No need to check for null anymore
      if (!matched) {
        // This should rarely happen now, but keep as fallback
        pending.push({
          id: safeRandomId(),
          question: `I need more details about "${aiItem.canonicalName || aiItem.rawText}". Can you describe it more specifically?`,
          field: 'match',
          itemName: aiItem.canonicalName || aiItem.rawText || 'item',
        });
        return;
      }

      const defaultQuestions: { field: string; question: string }[] = [];
      const quantityQuestion = needsQuantityQuestion(aiItem);
      if (quantityQuestion) {
        defaultQuestions.push(quantityQuestion);
      }
      const sizeQuestion = needsSizeQuestion(aiItem);
      if (sizeQuestion) {
        defaultQuestions.push(sizeQuestion);
      }

      const itemQuestions = mapQuestions(aiItem, matched.name, defaultQuestions);
      if (itemQuestions.length > 0) {
        pending.push(...itemQuestions);
        return;
      }

      additions.push({
        item: matched,
        quantity: Math.max(1, aiItem.quantity || 1),
        room: inferRoomFromItem(matched, aiItem.roomCategory || undefined),
        size: aiItem.size,
        itemType: aiItem.itemType,
        source: aiItem.rawText || aiItem.canonicalName || '',
      });
    });

    // If no items were extracted and it's not a greeting, help the user
    if (additions.length === 0 && pending.length === 0 && !isGreeting) {
      return NextResponse.json({
        success: true,
        data: {
          addedItems: [],
          pendingQuestions: [],
          assistantSummary: "I didn't quite catch what items you want to move. Could you describe them more specifically? For example:\n• '3 seater sofa, king bed, 10 boxes'\n• 'antique grandfather clock'\n• 'custom built-in wardrobe'\nI can add ANY items you describe!",
          followUpQuestions: [],
        },
      });
    }

    const assistantSummaryParts = [];
    
    if (additions.length > 0) {
      // Count catalog vs custom items
      const customItems = additions.filter(item => item.item.id.startsWith('custom-'));
      const catalogItems = additions.filter(item => !item.item.id.startsWith('custom-'));
      
      // Build smart summary
      if (customItems.length > 0 && catalogItems.length > 0) {
        assistantSummaryParts.push(`Perfect! I've added ${additions.length} items (${catalogItems.length} from our catalog + ${customItems.length} custom items).`);
      } else if (customItems.length > 0) {
        assistantSummaryParts.push(`✨ Great! I've created ${customItems.length} custom ${customItems.length === 1 ? 'item' : 'items'} for you based on your description.`);
      } else {
        assistantSummaryParts.push(parsed.summary?.trim() || 'Items added successfully!');
      }
      
      assistantSummaryParts.push("Tell me if you want to add more items, or you can move to the next step.");
    }

    if (pending.length > 0) {
      assistantSummaryParts.push('I need a bit more information:');
      pending.slice(0, 3).forEach((question) => {
        assistantSummaryParts.push(`• ${question.question}`);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        addedItems: additions,
        pendingQuestions: pending,
        assistantSummary: assistantSummaryParts.join('\n'),
        followUpQuestions: parsed.followUpQuestions || [],
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('AI extraction route failed', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid request payload', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unexpected error while processing AI request',
      },
      { status: 500 }
    );
  }
}

