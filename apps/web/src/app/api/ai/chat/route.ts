import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';
import { POPULAR_ITEMS } from '../../../../lib/items/popular-items';
import GOOGLE_BUSINESS_PROFILE from '../../../../data/google-business-profile';

// Customer Chatbot API Key - Namespaced for isolation
function getGroqClient() {
  const GROQ_API_KEY_CUSTOMER = process.env.GROQ_API_KEY_CUSTOMER || process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY_CUSTOMER) {
    return null;
  }
  return new Groq({
    apiKey: GROQ_API_KEY_CUSTOMER,
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

Company constants (ALWAYS use these exactly when asked):
- Support email: support@speedy-van.co.uk
- Support phone: 01202129746
- Developer identity: If asked who developed you or who is the lead developer, answer exactly: "Mr Ahmad Alwakai Lead Developer".

Available vehicle types:
- Small Van (1-2 rooms, small items, single sofa)
- Medium Van (2-3 rooms, standard furniture)
- Large Van (3-4 rooms, full house move)
- Luton Van (4+ rooms, large house move)

CRITICAL: If pickup address, drop-off address, and items (rooms OR specific items like sofa) are provided, say CALCULATE_QUOTE and confirm the details. DO NOT repeat questions about information already given.

Remember: Keep responses short (2-3 sentences max), natural, and focused on getting quote information.`;

// Helper function to extract data from user message with richer signals
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

  // Extract special items (synonyms aware)
  const specialItemsSynonyms: Record<string, string[]> = {
    'sofa': ['sofa', 'couch', 'settee', '3 seater', '2 seater'],
    'piano': ['piano', 'upright piano', 'grand piano'],
    'antique': ['antique', 'antiques'],
    'bed': ['bed', 'double bed', 'king bed', 'mattress'],
    'table': ['table', 'dining table', 'coffee table'],
    'chair': ['chair', 'chairs'],
    'wardrobe': ['wardrobe', 'closet'],
    'fridge': ['fridge', 'refrigerator', 'freezer'],
    'washing machine': ['washing machine', 'washer'],
    'tv': ['tv', 'television'],
    'bicycle': ['bicycle', 'bike'],
  };
  Object.entries(specialItemsSynonyms).forEach(([canonical, forms]) => {
    if (forms.some(f => lowerMessage.includes(f))) {
      updatedData.specialItems = updatedData.specialItems || [];
      if (!updatedData.specialItems.includes(canonical)) {
        updatedData.specialItems.push(canonical);
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

// Validate what is still missing for a quote
function computeMissingFields(extracted: any) {
  const missing: string[] = [];
  if (!extracted.pickupAddress) missing.push('pickupAddress');
  if (!extracted.dropoffAddress) missing.push('dropoffAddress');
  if (!extracted.numberOfRooms && !(extracted.specialItems && extracted.specialItems.length > 0)) {
    missing.push('itemsOrRooms');
  }
  // Date is optional but recommended
  if (!extracted.movingDate) missing.push('movingDate');
  return missing;
}

function nextQuestionFor(missing: string[]): string | null {
  if (missing.includes('pickupAddress')) return 'What is the pickup address (street and postcode)?';
  if (missing.includes('dropoffAddress')) return 'What is the drop-off address (street and postcode)?';
  if (missing.includes('itemsOrRooms')) return 'How many rooms or which items (e.g., sofa, bed, boxes)?';
  if (missing.includes('movingDate')) return 'When would you like to move? (date)';
  return null;
}

// -----------------------------
// Lightweight RAG (in-memory)
// -----------------------------
type RAGItem = {
  id: string;
  name: string;
  category: string;
  weight?: number;
  volume?: number;
  unitPrice?: number;
  synonyms?: string[];
  keywords?: string[];
};

type RAGFaq = {
  id: string;
  question: string;
  answer: string;
  tags?: string[];
};

const RAG_ITEMS_SEED: RAGItem[] = [
  { id: 'itm_sofa_3_seat', name: 'Sofa (3-seater)', category: 'furniture', weight: 80, volume: 2.5, unitPrice: 90, synonyms: ['sofa', 'couch', 'settee', '3 seater'], keywords: ['living room'] },
  { id: 'itm_washing_machine', name: 'Washing Machine', category: 'appliances', weight: 70, volume: 1.2, unitPrice: 50, synonyms: ['washing machine', 'washer'], keywords: ['laundry', 'appliance'] },
  { id: 'itm_fridge_freezer', name: 'Fridge Freezer', category: 'appliances', weight: 80, volume: 2.0, unitPrice: 60, synonyms: ['fridge', 'refrigerator', 'freezer'], keywords: ['kitchen'] },
  { id: 'itm_tv_55', name: 'TV 55-inch', category: 'electronics', weight: 25, volume: 0.8, unitPrice: 40, synonyms: ['tv', 'television'], keywords: ['electronics'] },
  { id: 'itm_bicycle', name: 'Bicycle', category: 'misc', weight: 15, volume: 0.5, unitPrice: 25, synonyms: ['bicycle', 'bike'], keywords: ['garage'] },
  { id: 'itm_boxes_small', name: 'Boxes (small)', category: 'boxes', weight: 4, volume: 0.1, unitPrice: 6, synonyms: ['small box'], keywords: ['packing'] },
  { id: 'itm_boxes_medium', name: 'Boxes (medium)', category: 'boxes', weight: 6, volume: 0.2, unitPrice: 8, synonyms: ['box', 'boxes'], keywords: ['packing'] },
  { id: 'itm_boxes_large', name: 'Boxes (large)', category: 'boxes', weight: 9, volume: 0.4, unitPrice: 12, synonyms: ['large box'], keywords: ['packing'] },
  { id: 'itm_wardrobe', name: 'Wardrobe', category: 'furniture', weight: 100, volume: 4.0, unitPrice: 85, synonyms: ['wardrobe', 'closet'], keywords: ['bedroom'] },
  { id: 'itm_bed_double', name: 'Bed (double)', category: 'furniture', weight: 90, volume: 3.5, unitPrice: 95, synonyms: ['double bed', 'bed', 'mattress'], keywords: ['bedroom'] },
  { id: 'itm_table_dining', name: 'Dining Table', category: 'furniture', weight: 60, volume: 3.0, unitPrice: 70, synonyms: ['table'], keywords: ['dining'] },
  { id: 'itm_chairs_set', name: 'Chairs (set)', category: 'furniture', weight: 30, volume: 1.0, unitPrice: 40, synonyms: ['chair', 'chairs'], keywords: ['dining', 'living'] },
];

const RAG_FAQ_SEED: RAGFaq[] = [
  { id: 'faq_insurance', question: 'Are items insured?', answer: 'Yes, all moves are covered by comprehensive goods-in-transit insurance. For questions, email support@speedy-van.co.uk or call 01202129746.', tags: ['insurance', 'safety'] },
  { id: 'faq_assembly', question: 'Do you assemble and disassemble furniture?', answer: 'Yes, we can dismantle and reassemble most furniture on request. Charges may apply depending on complexity.', tags: ['assembly', 'furniture'] },
  { id: 'faq_boxes', question: 'Can I buy moving boxes?', answer: 'Yes, we provide moving boxes and packing materials. Tell us how many you need and we will include them in your quote.', tags: ['boxes', 'packing'] },
  { id: 'faq_pricing_distance', question: 'How is distance priced?', answer: 'Quotes include a distance-based fee calculated from pickup to drop-off. Longer routes cost more; pricing is shown transparently before payment.', tags: ['pricing', 'distance'] },
  { id: 'faq_stairs_fee', question: 'Is there a stairs fee?', answer: 'If there are multiple flights of stairs or no lift, an additional handling fee may apply to cover extra time and labour.', tags: ['stairs', 'access'] },
  { id: 'faq_waiting_time', question: 'Do you charge for waiting time?', answer: 'Yes, waiting beyond the scheduled loading/unloading window may incur a waiting time charge billed in time blocks.', tags: ['waiting', 'delays'] },
  { id: 'faq_packing_service', question: 'Do you offer packing services?', answer: 'Yes, professional packing is available on request. We can supply materials and pack your items; this can be added to your booking.', tags: ['packing', 'service'] },
  { id: 'faq_dismantle_policy', question: 'Can you dismantle large items?', answer: 'Yes, dismantling is available for wardrobes, beds, and similar items. Please mention which items; additional charges may apply based on complexity.', tags: ['dismantle', 'assembly'] },
  { id: 'faq_payment_methods', question: 'What payment methods do you accept?', answer: 'Card payments via Stripe are supported. For any alternative arrangements, please contact support@speedy-van.co.uk.', tags: ['payment', 'stripe'] },
  { id: 'faq_availability', question: 'How soon can I book?', answer: 'Availability depends on your date, time, and route. The system will show the next available slots during booking and after you provide addresses.', tags: ['availability', 'schedule'] },
];

let RAG_INDEX:
  | null
  | {
      items: { id: string; tokens: Map<string, number>; boost: number }[];
      faqs: { id: string; tokens: Map<string, number>; boost: number }[];
      byId: { items: Record<string, RAGItem>; faqs: Record<string, RAGFaq> };
    } = null;

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function toVector(tokensArr: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokensArr) m.set(t, (m.get(t) || 0) + 1);
  return m;
}

function dot(a: Map<string, number>, b: Map<string, number>): number {
  let s = 0;
  for (const [k, v] of a) {
    const u = b.get(k);
    if (u) s += v * u;
  }
  return s;
}

// Lightweight metrics (console-based for now)
function logMetric(event: string, data?: Record<string, any>) {
  try {
    const payload = { event, ts: new Date().toISOString(), ...data };
    console.log('[AI_METRIC]', JSON.stringify(payload));
  } catch {}
}

// Contextual keyword extraction and boosts
function extractContextKeywords(text: string): Set<string> {
  const tokens = tokenize(text);
  const keywords = new Set<string>();
  const hints = ['bed', 'bedroom', 'wardrobe', 'sofa', 'couch', 'mattress', 'table', 'chair', 'chairs'];
  for (const t of tokens) if (hints.includes(t)) keywords.add(t);
  return keywords;
}

async function buildRagIndexOnce() {
  if (RAG_INDEX) return;
  // Base seeds
  const itemSeeds: RAGItem[] = [...RAG_ITEMS_SEED];
  const faqSeeds: RAGFaq[] = [...RAG_FAQ_SEED];

  // Extend from popular items (production data)
  try {
    const popularFromProject: RAGItem[] = (POPULAR_ITEMS as any[]).map((p: any) => ({
      id: `pop_${p.id}`,
      name: p.name,
      category: p.category,
      weight: p.weight,
      volume: p.volume,
      unitPrice: p.unitPrice,
      synonyms: [p.name.toLowerCase()],
      keywords: [p.category, 'popular'],
    }));
    itemSeeds.push(...popularFromProject);
  } catch {}

  // Extend from GBP FAQ where aligned with site policies
  try {
    const gbpFaq = (GOOGLE_BUSINESS_PROFILE as any)?.faq || [];
    gbpFaq.forEach((q: any, idx: number) => {
      const question = String(q.question || '');
      const answer = String(q.answer || '');
      // Filter/adjust answers to align with current payment/availability policies
      if (!question || !answer) return;
      const id = `gbp_faq_${idx}`;
      faqSeeds.push({ id, question, answer, tags: ['gbp'] });
    });
  } catch {}

  // Extend from dataset categories (server-side fetch, best-effort)
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${base}/api/dataset/images`, { cache: 'no-store' as RequestCache, signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const data = json.data as Record<string, string[]>;
        Object.keys(data).forEach((rawKey) => {
          const key = String(rawKey || '');
          const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          const synonyms = new Set<string>([label.toLowerCase(), ...key.split('_')]);
          // Derive extra keywords from a sample of filenames
          const images = data[rawKey] || [];
          const SAMPLE = images.slice(0, 20);
          const KEY_HINTS = ['sofa','couch','wardrobe','bed','mattress','chair','chairs','table','coffee','dining','mirror','bicycle','bike','tv','television','fridge','freezer','refrigerator','washing','washer','dishwasher','oven','microwave','box','boxes'];
          SAMPLE.forEach((src) => {
            const file = (src.split('/').pop() || '').toLowerCase();
            KEY_HINTS.forEach((hint) => { if (file.includes(hint)) synonyms.add(hint); });
          });
          itemSeeds.push({
            id: `ds_cat_${key}`,
            name: label,
            category: key,
            synonyms: Array.from(synonyms),
            keywords: ['dataset', 'category']
          });
        });
      }
    }
  } catch {}

  const categoryBoost: Record<string, number> = {
    furniture: 1.8,
    appliances: 1.6,
    electronics: 1.4,
    boxes: 1.2,
  };
  const itemEntries = itemSeeds.map((it) => {
    const text = [it.name, it.category, ...(it.synonyms || []), ...(it.keywords || [])].join(' ');
    const boost = categoryBoost[(it.category || '').toLowerCase()] || 1.3;
    return { id: it.id, tokens: toVector(tokenize(text)), boost };
  });
  const faqEntries = faqSeeds.map((f) => {
    const text = [f.question, f.answer, ...(f.tags || [])].join(' ');
    return { id: f.id, tokens: toVector(tokenize(text)), boost: 1.0 };
  });
  const byId = {
    items: Object.fromEntries(itemSeeds.map((i) => [i.id, i])),
    faqs: Object.fromEntries(faqSeeds.map((f) => [f.id, f])),
  };
  RAG_INDEX = { items: itemEntries, faqs: faqEntries, byId };
}

async function retrieveTopK(query: string, k = 3) {
  await buildRagIndexOnce();
  const qv = toVector(tokenize(query));
  const contextKeywords = extractContextKeywords(query);
  const itemsScored = (RAG_INDEX!.items || [])
    .map((e) => {
      let base = dot(qv, e.tokens) * e.boost;
      // Contextual boosts: bedroom-related terms → boost relevant furniture
      const meta = RAG_INDEX!.byId.items[e.id];
      if (meta) {
        const hay = [meta.name, meta.category, ...(meta.synonyms || []), ...(meta.keywords || [])]
          .join(' ')
          .toLowerCase();
        const hits = Array.from(contextKeywords).some((kw) => hay.includes(kw));
        if (hits) base *= 1.25; // gentle boost to avoid overfitting
      }
      return { id: e.id, score: base };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  const faqsScored = (RAG_INDEX!.faqs || [])
    .map((e) => ({ id: e.id, score: dot(qv, e.tokens) * e.boost }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);

  return {
    items: itemsScored.map((s) => RAG_INDEX!.byId.items[s.id]),
    faqs: faqsScored.map((s) => RAG_INDEX!.byId.faqs[s.id]),
  };
}

export async function POST(request: NextRequest) {
  try {
    const groq = getGroqClient();
    
    if (!groq) {
      logMetric('started_chat', { configured: false });
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI service is not configured',
          message: 'I apologize, but the AI service is currently unavailable. Please contact support at support@speedy-van.co.uk or call 01202129746 for assistance.',
        },
        { status: 503 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    let validated: z.infer<typeof chatSchema>;
    let uploadedSummaries: Array<{ name: string; kind: 'image'|'text'|'pdf-unsupported'; note: string }> = [];
    let extractedFromFiles: Array<{ name: string; quantity?: number }> = [];

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const rawMessage = String(form.get('message') || '');
      const files = form.getAll('files') as unknown as File[];
      // If user sent only files without text, provide a placeholder to pass validation
      const message = rawMessage && rawMessage.trim().length > 0 ? rawMessage : (files && files.length > 0 ? 'Please analyze the attached file(s).' : '');
      const conversationHistoryRaw = String(form.get('conversationHistory') || '[]');
      const extractedDataRaw = String(form.get('extractedData') || '{}');
      const bodyLike = {
        message,
        conversationHistory: JSON.parse(conversationHistoryRaw || '[]'),
        extractedData: JSON.parse(extractedDataRaw || '{}'),
      };
      validated = chatSchema.parse(bodyLike);

      const maxSize = 10 * 1024 * 1024;
      for (const f of files || []) {
        if (!f) continue;
        if (f.size > maxSize) { uploadedSummaries.push({ name: f.name, kind: 'text', note: 'ignored: over 10MB' }); continue; }
        const type = f.type;
        if (type.startsWith('image/')) {
          const lower = f.name.toLowerCase();
          const tokens = ['sofa','couch','bed','double','wardrobe','fridge','washing','dryer','table','chair','chairs','tv','mattress','boxes','box','mirror','bicycle'];
          const hits = tokens.filter(t => lower.includes(t));
          if (hits.length) extractedFromFiles.push({ name: hits.join(' ') });
          uploadedSummaries.push({ name: f.name, kind: 'image', note: hits.length ? `inferred: ${hits.join(', ')}` : 'inferred: unknown' });
        } else if (type === 'text/plain') {
          const text = await f.text();
          const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          for (const l of lines) {
            const m = l.match(/^(\d+)\s*x?\s*(.+)$/i);
            if (m) extractedFromFiles.push({ name: m[2].trim(), quantity: parseInt(m[1],10) });
            else extractedFromFiles.push({ name: l });
          }
          uploadedSummaries.push({ name: f.name, kind: 'text', note: `parsed ${lines.length} lines` });
        } else if (type === 'application/pdf') {
          uploadedSummaries.push({ name: f.name, kind: 'pdf-unsupported', note: 'pdf parsing unavailable in preview' });
        } else {
          uploadedSummaries.push({ name: f.name, kind: 'text', note: 'ignored: unsupported type' });
        }
      }
    } else {
      const body = await request.json();
      validated = chatSchema.parse(body);
    }
    logMetric('started_chat', { configured: true });

    // Extract data from current message and merge with existing
    const extractedData = extractDataFromMessage(validated.message, validated.extractedData || {});
    if (extractedFromFiles.length) {
      extractedData.specialItems = [
        ...(extractedData.specialItems || []),
        ...extractedFromFiles.map(i => i.quantity ? `${i.quantity} x ${i.name}` : i.name)
      ];
    }
    const missingFields = computeMissingFields(extractedData);
    if (missingFields.length > 0) {
      logMetric('missing_data', { fields: missingFields });
    }

    // Build context summary for AI
    const contextSummary = [] as string[];
    if (extractedData.pickupAddress) contextSummary.push(`Pickup: ${extractedData.pickupAddress}`);
    if (extractedData.dropoffAddress) contextSummary.push(`Drop-off: ${extractedData.dropoffAddress}`);
    if (extractedData.numberOfRooms) contextSummary.push(`Rooms: ${extractedData.numberOfRooms}`);
    if (extractedData.specialItems?.length) contextSummary.push(`Items: ${extractedData.specialItems.join(', ')}`);
    if (extractedData.movingDate) contextSummary.push(`Date: ${extractedData.movingDate}`);

    const contextMessage = contextSummary.length > 0 
      ? `\n\nCurrent extracted information: ${contextSummary.join(' | ')}`
      : '';

    // RAG retrieval based on latest user message and known context
    const retrievalInput = [validated.message, contextSummary.join(' | ')].filter(Boolean).join(' \n ');
    const retrieved = await retrieveTopK(retrievalInput, 3);
    const itemsSnippet = retrieved.items.map(i => `- ${i.name} (${i.category})`).join('\n');
    const faqsSnippet = retrieved.faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const retrievalContext = [
      itemsSnippet ? `Relevant items:\n${itemsSnippet}` : '',
      faqsSnippet ? `Relevant FAQs:\n${faqsSnippet}` : '',
    ].filter(Boolean).join('\n\n');

    // Diagnostics (optional): log retrieved context IDs (no user exposure)
    if (process.env.RAG_DIAGNOSTICS === 'true') {
      try {
        console.log('[RAG] Items:', retrieved.items.map(i => i.id).join(', '));
        console.log('[RAG] FAQs:', retrieved.faqs.map(f => f.id).join(', '));
      } catch {}
    }

    // Build upload context if present (deterministic, model must trust it)
    const uploadContextLines: string[] = [];
    if (uploadedSummaries && uploadedSummaries.length) {
      uploadContextLines.push('Uploads Summary (deterministic):');
      uploadedSummaries.forEach(u => {
        uploadContextLines.push(`- ${u.name} → ${u.note}`);
      });
    }

    const faqInstruction = retrieved.faqs.length > 0
      ? `\n\nWhen the user's query semantically matches any FAQ below, answer EXACTLY with the provided answer (concise, no additions).`
      : '';
    const uploadInstruction = uploadContextLines.length
      ? `\n\nIf uploads summary is present, you MUST acknowledge the analysis and use it. NEVER say you cannot analyze files. Keep answers short (2 sentences).`
      : '';

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextMessage + faqInstruction + uploadInstruction + (retrievalContext ? `\n\nContext (internal):\n${retrievalContext}` : '') + (uploadContextLines.length ? `\n\n${uploadContextLines.join('\n')}` : '') },
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

    let aiResponse = chatCompletion.choices[0]?.message?.content || 'I apologize, I couldn\'t process that. Could you please rephrase?';
    if (uploadedSummaries.length) {
      const summary = uploadedSummaries.map(u => `• ${u.name}: ${u.note}`).join('\n');
      aiResponse = `${uploadedSummaries.some(u=>u.kind==='image') ? 'Analyzed your image(s).' : 'Processed your file(s).'}\n${summary}\n\n${aiResponse}`;
      logMetric('file_uploaded', { count: uploadedSummaries.length });
      logMetric('file_analyzed', { itemsInferred: extractedFromFiles.length });
    }

    // Determine if we have enough information for a quote
    const hasEnoughInfo = extractedData.pickupAddress && 
                          extractedData.dropoffAddress && 
                          (extractedData.numberOfRooms || (extractedData.specialItems?.length > 0));

    const shouldCalculateQuote = aiResponse.includes('CALCULATE_QUOTE') || hasEnoughInfo;
    if (shouldCalculateQuote) {
      logMetric('quote_enabled');
    }

    return NextResponse.json({
      success: true,
      message: aiResponse.replace('CALCULATE_QUOTE', '').trim(),
      extractedData,
      shouldCalculateQuote,
      missingFields,
      nextQuestion: shouldCalculateQuote ? null : nextQuestionFor(missingFields),
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
