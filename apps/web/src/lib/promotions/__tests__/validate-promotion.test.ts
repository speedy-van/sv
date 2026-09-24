import { validatePromotion } from '../validate-promotion';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPromotionFindUnique = jest.fn();
const mockBookingCount = jest.fn();
const mockBookingFindFirst = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    promotion: {
      findUnique: (...args: any[]) => mockPromotionFindUnique(...args),
    },
    booking: {
      count: (...args: any[]) => mockBookingCount(...args),
      findFirst: (...args: any[]) => mockBookingFindFirst(...args),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePromotion(overrides: Record<string, any> = {}) {
  return {
    id: 'promo-1',
    code: 'TEST10',
    name: 'Test 10% Off',
    description: 'Ten percent discount',
    status: 'active',
    type: 'percentage',
    value: 10,
    minSpend: 0,
    usageLimit: 100,
    firstTimeOnly: false,
    maxDiscount: 0,
    applicableAreas: [],
    applicableVans: [],
    validFrom: new Date(Date.now() - 86400_000),
    validTo: new Date(Date.now() + 86400_000),
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validatePromotion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBookingCount.mockResolvedValue(0);
    mockBookingFindFirst.mockResolvedValue(null);
  });

  it('returns invalid when promotion code does not exist', async () => {
    mockPromotionFindUnique.mockResolvedValue(null);

    const result = await validatePromotion({ code: 'GHOST', amountPence: 5000 });

    expect(result.valid).toBe(false);
    expect((result as any).error).toMatch(/invalid/i);
  });

  it('returns invalid when promotion is not active', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ status: 'disabled' }));

    const result = await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(result.valid).toBe(false);
  });

  it('returns invalid when promotion has expired', async () => {
    mockPromotionFindUnique.mockResolvedValue(
      makePromotion({ validTo: new Date(Date.now() - 1000) })
    );

    const result = await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(result.valid).toBe(false);
    expect((result as any).error).toMatch(/expired/i);
  });

  it('returns invalid when minimum spend is not met', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ minSpend: 50 })); // £50 minimum
    // amountPence = 3000 = £30 < £50

    const result = await validatePromotion({ code: 'TEST10', amountPence: 3000 });

    expect(result.valid).toBe(false);
    expect((result as any).error).toMatch(/minimum spend/i);
  });

  // ─── Usage limit ─────────────────────────────────────────────────────────

  it('returns invalid when per-code usage limit is reached', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ usageLimit: 5 }));
    // 5 already-used bookings with this exact code
    mockBookingCount.mockResolvedValue(5);

    const result = await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(result.valid).toBe(false);
    expect((result as any).error).toMatch(/usage limit/i);
  });

  it('passes usage limit check when count is below the limit', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ usageLimit: 5 }));
    mockBookingCount.mockResolvedValue(4);

    const result = await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(result.valid).toBe(true);
  });

  it('queries booking count filtered by THIS promotion code (not all bookings)', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ usageLimit: 10 }));
    mockBookingCount.mockResolvedValue(3);

    await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(mockBookingCount).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          promotionCode: 'TEST10',
        }),
      })
    );
  });

  // ─── First-time only ──────────────────────────────────────────────────────

  it('returns invalid for first-time-only promo when guest email has a prior CONFIRMED booking', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ firstTimeOnly: true }));
    mockBookingFindFirst.mockResolvedValue({ id: 'booking-old' });

    const result = await validatePromotion({
      code: 'TEST10',
      amountPence: 5000,
      customerEmail: 'repeat@example.com',
    });

    expect(result.valid).toBe(false);
    expect((result as any).error).toMatch(/first-time/i);
  });

  it('returns invalid when a prior booking exists via customer.email relation (registered user)', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ firstTimeOnly: true }));
    // findFirst returns a booking (found via either path)
    mockBookingFindFirst.mockResolvedValue({ id: 'old-booking' });

    const result = await validatePromotion({
      code: 'TEST10',
      amountPence: 5000,
      customerEmail: 'registered@example.com',
    });

    expect(result.valid).toBe(false);

    // Verify the query uses OR covering both customerEmail and customer.email
    expect(mockBookingFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ customerEmail: expect.anything() }),
            expect.objectContaining({ customer: expect.anything() }),
          ]),
        }),
      })
    );
  });

  it('returns valid for first-time-only promo when no prior bookings exist', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ firstTimeOnly: true }));
    mockBookingFindFirst.mockResolvedValue(null);

    const result = await validatePromotion({
      code: 'TEST10',
      amountPence: 5000,
      customerEmail: 'new@example.com',
    });

    expect(result.valid).toBe(true);
  });

  // ─── Discount calculation ─────────────────────────────────────────────────

  it('computes percentage discount from amountPence (not a client-supplied value)', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ type: 'percentage', value: 10 }));

    const result = await validatePromotion({ code: 'TEST10', amountPence: 10000 });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountPence).toBe(1000); // 10% of 10000
    }
  });

  it('computes fixed discount in pence (value is in pounds)', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ type: 'fixed', value: 5 }));

    const result = await validatePromotion({ code: 'TEST10', amountPence: 10000 });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountPence).toBe(500); // £5 = 500p
    }
  });

  it('caps discount at maxDiscount', async () => {
    mockPromotionFindUnique.mockResolvedValue(
      makePromotion({ type: 'percentage', value: 50, maxDiscount: 20 }) // 50% but max £20
    );

    const result = await validatePromotion({ code: 'TEST10', amountPence: 10000 });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountPence).toBe(2000); // capped at £20 = 2000p
    }
  });

  it('caps discount so it never exceeds amountPence', async () => {
    mockPromotionFindUnique.mockResolvedValue(
      makePromotion({ type: 'fixed', value: 200 }) // £200 fixed on a £5 order
    );

    const result = await validatePromotion({ code: 'TEST10', amountPence: 500 });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.discountPence).toBe(500); // cannot exceed order total
    }
  });

  it('returns name in the result', async () => {
    mockPromotionFindUnique.mockResolvedValue(makePromotion({ name: 'Summer Sale' }));

    const result = await validatePromotion({ code: 'TEST10', amountPence: 5000 });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.name).toBe('Summer Sale');
    }
  });
});
