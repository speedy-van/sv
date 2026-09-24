import { createQuote, resolveQuoteForCheckout } from '../quote-service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockCreate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    priceQuote: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
      create: (...args: any[]) => mockCreate(...args),
    },
  },
}));

const mockLoadDataset = jest.fn();
const mockCalculatePrice = jest.fn();
jest.mock('@/lib/pricing/comprehensive-engine', () => ({
  comprehensivePricingEngine: {
    loadDataset: (...args: any[]) => mockLoadDataset(...args),
    calculatePrice: (...args: any[]) => mockCalculatePrice(...args),
  },
}));

const mockDatasetItem = {
  id: 'sofa',
  name: 'Sofa',
  category: 'furniture',
  filename: 'sofa.jpg',
  keywords: ['sofa'],
  dimensions: '100x100x100',
  weight: 40,
  volume: '1.2',
  workers_required: 2,
  dismantling_required: false,
  dismantling_time_minutes: 0,
  reassembly_time_minutes: 0,
  luton_van_fit: true,
  van_capacity_estimate: 0.1,
  load_priority: 1,
  fragility_level: 'low',
  stackability: 'medium',
  packaging_requirement: 'none',
  unload_difficulty: 'medium',
  door_width_clearance_cm: 80,
  staircase_compatibility: true,
  elevator_requirement: false,
  insurance_category: 'standard',
};

jest.mock('@/lib/dataset/item-id-mapper', () => ({
  findDatasetItemById: jest.fn(() => mockDatasetItem),
  createFallbackDatasetItem: jest.fn(() => mockDatasetItem),
}));

jest.mock('@/lib/pricing/comprehensive-schemas', () => ({
  UKDatasetItemSchema: { parse: (value: any) => value },
}));

const mockValidatePromotion = jest.fn();
jest.mock('@/lib/promotions/validate-promotion', () => ({
  validatePromotion: (...args: any[]) => mockValidatePromotion(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeStoredResult(datePrices: { dateKey: string; totalPence: number; cheapest: boolean }[]) {
  return {
    movePence: 10000,
    remoteSurchargePence: 0,
    crewSize: '2',
    datePrices,
    crewOptions: [],
    lines: [],
    route: {},
    van: {},
    extras: { packing: false, assembly: [] },
  };
}

function makePriceQuote(overrides: Record<string, any> = {}) {
  return {
    id: 'quote-abc',
    expiresAt: new Date(Date.now() + 30 * 60_000),
    consumedAt: null,
    bookingId: null,
    result: makeStoredResult([
      { dateKey: '2025-09-30', totalPence: 12000, cheapest: true },
      { dateKey: '2025-10-01', totalPence: 13500, cheapest: false },
    ]),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('resolveQuoteForCheckout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue({});
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockImplementation((args: any) => Promise.resolve({
      id: 'quote-created',
      expiresAt: args.data.expiresAt,
      result: args.data.result,
    }));
    mockLoadDataset.mockResolvedValue(undefined);
    mockCalculatePrice.mockResolvedValue({
      breakdown: {
        subtotalBeforeVat: 100,
        remotePickupSurcharge: 0,
      },
      route: { totalDistanceKm: 16.0934 },
      estimatedDurationMinutes: 45,
      recommendedVehicle: {
        type: 'luton',
        utilization: { volume: 0.4 },
      },
    });
  });

  it('throws QUOTE_EXPIRED when quote is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    await expect(
      resolveQuoteForCheckout({ quoteId: 'missing', dateKey: '2025-09-30' })
    ).rejects.toMatchObject({ quoteCode: 'QUOTE_EXPIRED' });
  });

  it('throws QUOTE_EXPIRED when quote is past its expiresAt', async () => {
    mockFindUnique.mockResolvedValue(
      makePriceQuote({ expiresAt: new Date(Date.now() - 1000) })
    );

    await expect(
      resolveQuoteForCheckout({ quoteId: 'quote-abc', dateKey: '2025-09-30' })
    ).rejects.toMatchObject({ quoteCode: 'QUOTE_EXPIRED' });
  });

  it('throws QUOTE_CONSUMED when consumedAt is set and bookingId differs', async () => {
    mockFindUnique.mockResolvedValue(
      makePriceQuote({ consumedAt: new Date(), bookingId: 'booking-old' })
    );

    await expect(
      resolveQuoteForCheckout({
        quoteId: 'quote-abc',
        dateKey: '2025-09-30',
        bookingId: 'booking-new',
      })
    ).rejects.toMatchObject({ quoteCode: 'QUOTE_CONSUMED' });
  });

  it('does NOT throw QUOTE_CONSUMED when consumedAt is set but bookingId matches (idempotent retry)', async () => {
    mockFindUnique.mockResolvedValue(
      makePriceQuote({ consumedAt: new Date(), bookingId: 'booking-same' })
    );
    mockValidatePromotion.mockResolvedValue({ valid: false, error: 'no promo' });

    await expect(
      resolveQuoteForCheckout({
        quoteId: 'quote-abc',
        dateKey: '2025-09-30',
        bookingId: 'booking-same',
      })
    ).resolves.toBeDefined();
  });

  it('throws VALIDATION when dateKey is not in the stored datePrices', async () => {
    mockFindUnique.mockResolvedValue(makePriceQuote());

    await expect(
      resolveQuoteForCheckout({ quoteId: 'quote-abc', dateKey: '2025-12-31' })
    ).rejects.toMatchObject({ quoteCode: 'VALIDATION' });
  });

  it('returns the stored amountPence for the matching dateKey', async () => {
    mockFindUnique.mockResolvedValue(makePriceQuote());

    const result = await resolveQuoteForCheckout({
      quoteId: 'quote-abc',
      dateKey: '2025-10-01',
    });

    expect(result.amountPence).toBe(13500);
    expect(result.crewSize).toBe('2');
  });

  it('applies a promo discount when promoCode is valid', async () => {
    mockFindUnique.mockResolvedValue(makePriceQuote());
    mockValidatePromotion.mockResolvedValue({ valid: true, discountPence: 1000 });

    const result = await resolveQuoteForCheckout({
      quoteId: 'quote-abc',
      dateKey: '2025-09-30',
      promoCode: 'SAVE10',
      customerEmail: 'test@example.com',
    });

    expect(result.amountPence).toBe(11000); // 12000 - 1000
    expect(result.discountPence).toBe(1000);
    expect(result.promotionCode).toBe('SAVE10');
  });

  it('does not apply discount when promo is invalid', async () => {
    mockFindUnique.mockResolvedValue(makePriceQuote());
    mockValidatePromotion.mockResolvedValue({ valid: false, error: 'Expired' });

    const result = await resolveQuoteForCheckout({
      quoteId: 'quote-abc',
      dateKey: '2025-09-30',
      promoCode: 'BAD',
    });

    expect(result.amountPence).toBe(12000);
    expect(result.discountPence).toBe(0);
    expect(result.promotionCode).toBeUndefined();
  });

  it('marks the quote as consumed after successful resolution', async () => {
    mockFindUnique.mockResolvedValue(makePriceQuote());

    await resolveQuoteForCheckout({ quoteId: 'quote-abc', dateKey: '2025-09-30' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'quote-abc' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      })
    );
  });
});

describe('createQuote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockImplementation((args: any) => Promise.resolve({
      id: 'quote-multi',
      expiresAt: args.data.expiresAt,
      result: args.data.result,
    }));
    mockLoadDataset.mockResolvedValue(undefined);
    mockCalculatePrice.mockResolvedValue({
      breakdown: {
        subtotalBeforeVat: 100,
        remotePickupSurcharge: 0,
      },
      route: { totalDistanceKm: 16.0934 },
      estimatedDurationMinutes: 45,
      recommendedVehicle: {
        type: 'luton',
        utilization: { volume: 0.4 },
      },
    });
  });

  it('prices every segment with the comprehensive engine and stores one quote with return discount lines', async () => {
    const request = {
      pickup: {
        full: '10 Downing Street, London SW1A 2AA',
        line1: '10 Downing Street',
        city: 'London',
        postcode: 'SW1A 2AA',
        coordinates: { lat: 51.5034, lng: -0.1276 },
      },
      dropoffs: [{
        full: '1 Parliament Square, London SW1P 3BD',
        line1: '1 Parliament Square',
        city: 'London',
        postcode: 'SW1P 3BD',
        coordinates: { lat: 51.5007, lng: -0.1246 },
      }],
      segments: [
        {
          segmentType: 'outbound' as const,
          pickup: {
            full: '10 Downing Street, London SW1A 2AA',
            line1: '10 Downing Street',
            city: 'London',
            postcode: 'SW1A 2AA',
            coordinates: { lat: 51.5034, lng: -0.1276 },
          },
          dropoffs: [{
            full: '1 Parliament Square, London SW1P 3BD',
            line1: '1 Parliament Square',
            city: 'London',
            postcode: 'SW1P 3BD',
            coordinates: { lat: 51.5007, lng: -0.1246 },
          }],
          items: [{ id: 'sofa', name: 'Sofa', quantity: 1 }],
        },
        {
          segmentType: 'return' as const,
          pickup: {
            full: '1 Parliament Square, London SW1P 3BD',
            line1: '1 Parliament Square',
            city: 'London',
            postcode: 'SW1P 3BD',
            coordinates: { lat: 51.5007, lng: -0.1246 },
          },
          dropoffs: [{
            full: '10 Downing Street, London SW1A 2AA',
            line1: '10 Downing Street',
            city: 'London',
            postcode: 'SW1A 2AA',
            coordinates: { lat: 51.5034, lng: -0.1276 },
          }],
          items: [{ id: 'sofa', name: 'Sofa', quantity: 1 }],
        },
      ],
      items: [{ id: 'sofa', name: 'Sofa', quantity: 1 }],
      crewSize: '2' as const,
      extras: { packing: false, assembly: [] },
    };

    const response = await createQuote(request);
    const stored = mockCreate.mock.calls[0][0].data.result;

    expect(mockCalculatePrice).toHaveBeenCalledTimes(2);
    expect(stored.segments).toHaveLength(2);
    expect(response.segments).toHaveLength(2);
    expect(stored.segments[1].segmentType).toBe('return');
    expect(stored.segments[1].lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'return_journey_discount',
          amountPence: expect.any(Number),
        }),
      ])
    );
    expect(stored.segments[1].lines.find((line: any) => line.code === 'return_journey_discount').amountPence).toBeLessThan(0);
    expect(stored.datePrices[0].totalPence).toBe(
      stored.segments[0].datePrices[0].totalPence + stored.segments[1].datePrices[0].totalPence
    );
  });
});
