import type { NextRequest } from 'next/server';

import { POST } from '../route';

jest.mock('@/lib/uk-removal-items-data', () => ({
  ALL_REMOVAL_ITEMS: [
    {
      id: 'itm_sofa_3',
      name: 'Sofa 3 Seater',
      category: 'Living Room',
      weight: 75,
      image: '/images/sofa.jpg',
      folder: 'Living Room',
    },
    {
      id: 'itm_boxes_medium',
      name: 'Boxes Medium Pack',
      category: 'Boxes & Packaging',
      weight: 5,
      image: '/images/boxes.jpg',
      folder: 'Boxes',
    },
  ],
}));

const mockCreate = jest.fn();

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('AI Item Extraction API', () => {
  const originalCustomerKey = process.env.GROQ_API_KEY_CUSTOMER;
  const originalFallbackKey = process.env.GROQ_API_KEY;

  beforeAll(() => {
    process.env.GROQ_API_KEY_CUSTOMER = 'test-groq-key';
  });

  afterAll(() => {
    process.env.GROQ_API_KEY_CUSTOMER = originalCustomerKey;
    process.env.GROQ_API_KEY = originalFallbackKey;
  });

  beforeEach(() => {
    mockCreate.mockReset();
  });

  const buildResponse = (payload: unknown) => ({
    choices: [
      {
        message: {
          content: JSON.stringify(payload),
        },
      },
    ],
  });

  const buildRequest = (body: Record<string, unknown>, headers: Record<string, string> = {}) =>
    new Request('http://localhost/api/booking/ai-items', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

  type AiRouteResponse = {
    success: boolean;
    data?: {
      addedItems: Array<{
        item: { id: string; name: string; category: string; weight: number; image?: string; folder?: string };
        quantity: number;
        room: string;
        size?: string | null;
        itemType?: string;
      }>;
      pendingQuestions: Array<{ id: string; question: string; field: string; itemName: string }>;
      assistantSummary: string;
    };
    error?: string;
  };

  it('adds extracted items when AI returns complete data', async () => {
    mockCreate.mockResolvedValue(
      buildResponse({
        summary: 'Captured sofa and boxes.',
        items: [
          {
            rawText: '3 seater sofa',
            canonicalName: 'Sofa 3 Seater',
            categoryGroup: 'house_flat',
            roomCategory: 'living',
            itemType: 'sofa',
            size: '3-seater',
            quantity: 2,
            missingDetails: [],
            confidence: 0.93,
          },
        ],
        followUpQuestions: [],
      })
    );

    const req = buildRequest(
      {
        message: 'Moving a 3 seater sofa and a set of medium boxes.',
        propertyType: 'house',
        conversation: [{ role: 'user', content: 'original' }],
      },
      { 'x-forwarded-for': '10.0.0.1' }
    );

    const res = await POST(req as unknown as NextRequest);
    const json = (await res.json()) as AiRouteResponse;

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.addedItems ?? []).toHaveLength(1);
    expect(json.data?.pendingQuestions ?? []).toHaveLength(0);
    expect(json.data?.assistantSummary).toContain("I've added the items you requested");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'llama-3.3-70b-versatile',
      })
    );
  });

  it('requests missing details when AI response lacks quantity', async () => {
    mockCreate.mockResolvedValue(
      buildResponse({
        summary: 'Need more info.',
        items: [
          {
            rawText: 'some boxes',
            canonicalName: 'Boxes Medium Pack',
            categoryGroup: 'house_flat',
            roomCategory: 'boxes',
            itemType: 'boxes',
            size: null,
            quantity: null,
            missingDetails: [],
            confidence: 0.8,
          },
        ],
        followUpQuestions: ['How many boxes are you moving?'],
      })
    );

    const req = buildRequest(
      { message: 'need help with boxes' },
      { 'x-forwarded-for': '10.0.0.2' }
    );

    const res = await POST(req as unknown as NextRequest);
    const json = (await res.json()) as AiRouteResponse;

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.addedItems ?? []).toHaveLength(0);
    const pendingQuestions = json.data?.pendingQuestions ?? [];
    expect(pendingQuestions.length).toBeGreaterThanOrEqual(1);
    const questions = pendingQuestions.map((q) => q.question).join(' ');
    expect(questions).toContain('How many');
  });

  it('returns 503 when GROQ key is missing', async () => {
    delete process.env.GROQ_API_KEY_CUSTOMER;
    delete process.env.GROQ_API_KEY;

    const req = buildRequest(
      { message: 'any payload' },
      { 'x-forwarded-for': '10.0.0.3' }
    );

    const res = await POST(req as unknown as NextRequest);
    const json = (await res.json()) as AiRouteResponse;

    expect(res.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error).toContain('AI service is unavailable');

    process.env.GROQ_API_KEY_CUSTOMER = 'test-groq-key';
  });

  it('validates payload shape', async () => {
    const req = buildRequest(
      { message: '' },
      { 'x-forwarded-for': '10.0.0.4' }
    );

    const res = await POST(req as unknown as NextRequest);
    const json = (await res.json()) as AiRouteResponse;

    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toBe('Invalid request payload');
  });
});

