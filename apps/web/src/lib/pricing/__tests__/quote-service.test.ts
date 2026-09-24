import { resolveQuoteForCheckout } from '../quote-service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    priceQuote: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
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
