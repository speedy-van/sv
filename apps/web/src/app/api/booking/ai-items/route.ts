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
2. Extract every item they want to move.
3. Map each item to Speedy Van categories described below.
4. Never invent details. If size or quantity is unclear, set it to null and include a follow-up question in "missingDetails".
5. If the wording clearly implies a single item (e.g. "a piano", "one sofa"), set quantity to 1. Otherwise leave null until the customer confirms.
6. Recognise variations: "double bed", "3 seater sofa", "big fridge", "office chairs".
7. **CRITICAL for sofas/couches**: Extract seat numbers precisely (e.g., "3 seater" → size: "3-seater" or "3 seat", "2 seater" → size: "2-seater").
8. **CRITICAL for beds**: Extract bed sizes precisely (e.g., "king bed" → size: "king", "double bed" → size: "double").
9. Understand all Step 2 categories and align each item accordingly.
10. Output clean JSON only, matching the schema exactly.

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

function matchRemovalItem(aiItem: AiExtractionItem) {
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

  if (!best || best.score < 12) {
    return null;
  }

  return best.item;
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
        ? "Hello! I'm here to help you list your items. Just describe what you're moving - for example: '3 seater sofa, king bed, 10 boxes'. I'll add them to your list automatically!"
        : message.toLowerCase().match(/\b(thanks|thank you)\b/)
        ? "You're welcome! Let me know if you need to add more items, or you can proceed to the next step."
        : parsed.summary?.trim() || "I'm ready to help! Just tell me what items you're moving.";
      
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
      if (!matched) {
      pending.push({
        id: safeRandomId(),
          question: `I could not find a matching catalog item for "${aiItem.canonicalName || aiItem.rawText}". Can you describe it differently or pick it manually?`,
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
          assistantSummary: "I didn't quite catch what items you want to move. Could you describe them more specifically? For example: 'I have a 3 seater sofa, a king bed, and 10 medium boxes'.",
          followUpQuestions: [],
        },
      });
    }

    const assistantSummaryParts = [];
    
    if (additions.length > 0) {
      assistantSummaryParts.push(parsed.summary?.trim() || 'Items analysed successfully.');
      assistantSummaryParts.push("I've added the items you requested. Tell me if you want to add more, or you can move to the next step.");
    }

    if (pending.length > 0) {
      assistantSummaryParts.push('I still need a bit more detail:');
      pending.slice(0, 3).forEach((question) => {
        assistantSummaryParts.push(`- ${question.question}`);
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

