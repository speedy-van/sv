/**
 * Gate item 2 — price integrity test.
 *
 * Invariant: The Stripe unit_amount charged must equal the amount the server
 * computed from the quote, not any client-supplied number.
 *
 * Flow under test: createQuote (already in DB) → POST /api/booking-luxury
 *   → POST /api/payment/create-checkout-session.
 * The test drives both handlers directly (no HTTP), mocking the DB and Stripe.
 */

// ─── Mocks (must precede imports) ─────────────────────────────────────────────

const mockBookingCreate = jest.fn();
const mockBookingUpdate = jest.fn();
const mockBookingFindUnique = jest.fn();
const mockPriceQuoteFindUnique = jest.fn();
const mockPriceQuoteUpdate = jest.fn();
const mockPriceQuoteCreate = jest.fn();
const mockBookingDraftUpdate = jest.fn();
const mockPricingSnapshotCreate = jest.fn();
const mockBookingAddressCreate = jest.fn();
const mockPropertyDetailsCreate = jest.fn();
const mockBookingItemCreate = jest.fn();
const mockAuditLogCreate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      create: (...a: any[]) => mockBookingCreate(...a),
      update: (...a: any[]) => mockBookingUpdate(...a),
      findUnique: (...a: any[]) => mockBookingFindUnique(...a),
    },
    priceQuote: {
      findUnique: (...a: any[]) => mockPriceQuoteFindUnique(...a),
      update: (...a: any[]) => mockPriceQuoteUpdate(...a),
      create: (...a: any[]) => mockPriceQuoteCreate(...a),
    },
    bookingDraft: { update: (...a: any[]) => mockBookingDraftUpdate(...a) },
    bookingAddress: { create: (...a: any[]) => mockBookingAddressCreate(...a) },
    propertyDetails: { create: (...a: any[]) => mockPropertyDetailsCreate(...a) },
    bookingItem: { create: (...a: any[]) => mockBookingItemCreate(...a) },
    auditLog: { create: (...a: any[]) => mockAuditLogCreate(...a) },
    bookingSegment: { create: jest.fn(), createMany: jest.fn() },
    customer: { findUnique: jest.fn() },
    $transaction: jest.fn(async (cb: any) => cb({
      bookingAddress: { create: (...a: any[]) => mockBookingAddressCreate(...a) },
      propertyDetails: { create: (...a: any[]) => mockPropertyDetailsCreate(...a) },
      booking: { create: (...a: any[]) => mockBookingCreate(...a) },
      bookingItem: { create: (...a: any[]) => mockBookingItemCreate(...a) },
    })),
  },
}));

const mockValidatePromotion = jest.fn();
jest.mock('@/lib/promotions/validate-promotion', () => ({
  validatePromotion: (...a: any[]) => mockValidatePromotion(...a),
}));

const mockStripeSessionCreate = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_test' }) },
    checkout: { sessions: { create: (...a: any[]) => mockStripeSessionCreate(...a) } },
  }));
});

jest.mock('@/lib/auth', () => ({ authOptions: {} }));
jest.mock('next-auth', () => ({ getServerSession: jest.fn().mockResolvedValue(null) }));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('@/lib/services/pricing-snapshot-service', () => ({
  PricingSnapshotService: { createPricingSnapshot: (...a: any[]) => mockPricingSnapshotCreate(...a) },
}));

jest.mock('@/lib/services/dynamic-pricing-engine', () => ({
  dynamicPricingEngine: {
    calculateDynamicPrice: jest.fn().mockResolvedValue({
      finalPrice: 144, // £144 = 14400p (matches QUOTE_TOTAL_PENCE / 100)
      basePrice: 120,
      dynamicMultipliers: {},
      confidence: 0.95,
      breakdown: { itemsCost: 0, timeCost: 120, surcharges: 0, discounts: 0 },
      recommendations: [],
      validUntil: new Date(Date.now() + 3600_000).toISOString(),
      capacityCheck: { fits: true },
    }),
  },
}));

jest.mock('@/lib/ref', () => ({
  createUniqueReference: jest.fn().mockResolvedValue('SV-TEST-001'),
}));

jest.mock('pusher', () => jest.fn().mockImplementation(() => ({ trigger: jest.fn() })));

jest.mock('@/lib/notifications', () => ({ sendAdminNotification: jest.fn() }));
jest.mock('@/lib/email/UnifiedEmailService', () => ({
  unifiedEmailService: { sendOrderConfirmation: jest.fn() },
}));
jest.mock('@/lib/sms/VoodooSMSService', () => ({
  getVoodooSMSService: () => ({ sendSMS: jest.fn() }),
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { POST as bookingLuxury } from '../route';
import { POST as createCheckoutSession } from '../../payment/create-checkout-session/route';
import { NextRequest } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DATE_KEY = '2025-10-15';
const QUOTE_TOTAL_PENCE = 14400; // £144.00
const QUOTE_ID = 'quote-test-abc';

function makeStoredQuoteResult(promoDiscountPence = 0) {
  return {
    movePence: 12000,
    remoteSurchargePence: 0,
    crewSize: '2',
    extras: { packing: false, assembly: [] },
    datePrices: [{ dateKey: DATE_KEY, totalPence: QUOTE_TOTAL_PENCE, cheapest: true }],
    crewOptions: [],
    lines: [],
    route: {},
    van: {},
  };
}

function mockQuoteInDb(overrides: Record<string, any> = {}) {
  mockPriceQuoteFindUnique.mockResolvedValueOnce({
    id: QUOTE_ID,
    expiresAt: new Date(Date.now() + 20 * 60_000),
    consumedAt: null,
    bookingId: null,
    result: makeStoredQuoteResult(),
    ...overrides,
  });
}

function makeBookingLuxuryBody(extra: Record<string, any> = {}) {
  return {
    customer: { name: 'Test User', email: 'test@example.com', phone: '07700000000' },
    pickupAddress: { street: '10 Downing St', city: 'London', postcode: 'SW1A 2AA', coordinates: { lat: 51.5, lng: -0.1 } },
    dropoffAddress: { street: '1 Parliament Sq', city: 'London', postcode: 'SW1P 3BD', coordinates: { lat: 51.5, lng: -0.1 } },
    pickupDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true, accessNotes: '' },
    dropoffDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true, accessNotes: '' },
    items: [{ id: 'i1', name: 'Sofa', quantity: 1, category: 'furniture', volumeFactor: 1 }],
    pickupDate: `${DATE_KEY}T08:00:00.000Z`,
    pickupTimeSlot: 'morning',
    urgency: 'scheduled',
    serviceType: 'standard',
    crewSize: '2',
    quoteId: QUOTE_ID,
    dateKey: DATE_KEY,
    pricing: { subtotal: 999, vat: 999, total: 999, currency: 'GBP' }, // client values — must be ignored
    ...extra,
  };
}

function makeBookingRequest(body: Record<string, any>) {
  return new NextRequest('http://localhost/api/booking-luxury', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

function makeCheckoutRequest(bookingId: string, bookingRef: string, clientAmount = 9999) {
  return new NextRequest('http://localhost/api/payment/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      amount: clientAmount / 100, // pounds — tampered value
      currency: 'gbp',
      customerEmail: 'test@example.com',
      customerName: 'Test User',
      bookingData: {
        bookingId,
        bookingReference: bookingRef,
        customer: { name: 'Test User', email: 'test@example.com', phone: '07700000000' },
        pickupAddress: { street: '10 Downing St', city: 'London', postcode: 'SW1A 2AA' },
        dropoffAddress: { street: '1 Parliament Sq', city: 'London', postcode: 'SW1P 3BD' },
        pickupDetails: { type: 'house', floors: 0, hasLift: false },
        dropoffDetails: { type: 'house', floors: 0, hasLift: false },
        items: [],
        pricing: { total: clientAmount / 100, subtotal: clientAmount / 100, vat: 0 },
      },
      successUrl: 'http://localhost/success',
      cancelUrl: 'http://localhost/cancel',
    }),
    headers: { 'content-type': 'application/json' },
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('price integrity — createQuote → booking-luxury → checkout-session', () => {
  let createdBooking: any;
  const REF = 'SV-TEST-001';

  beforeEach(() => {
    jest.clearAllMocks();
    mockPriceQuoteUpdate.mockResolvedValue({});
    mockBookingDraftUpdate.mockResolvedValue({});
    mockPricingSnapshotCreate.mockResolvedValue({});
    mockBookingAddressCreate.mockResolvedValue({ id: 'addr-1' });
    mockPropertyDetailsCreate.mockResolvedValue({ id: 'prop-1' });
    mockBookingItemCreate.mockResolvedValue({});

    // booking.create returns a booking with the correct server amount
    mockBookingCreate.mockImplementation((args: any) => {
      createdBooking = {
        id: 'booking-test-id',
        reference: REF,
        status: 'PENDING_PAYMENT',
        totalGBP: args.data.totalGBP,
        customerEmail: 'test@example.com',
        customerName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
        pickupAddressId: 'addr-1',
        dropoffAddressId: 'addr-1',
        pickupPropertyId: 'prop-1',
        dropoffPropertyId: 'prop-1',
        ...args.data,
      };
      return Promise.resolve(createdBooking);
    });

    // booking.update (for payment intent ID)
    mockBookingUpdate.mockImplementation(() => Promise.resolve(createdBooking));

    // No promo by default
    mockValidatePromotion.mockResolvedValue({ valid: false, error: 'no promo' });

    // Stripe checkout session
    mockStripeSessionCreate.mockResolvedValue({
      id: 'cs_test',
      url: 'https://checkout.stripe.com/test',
    });
  });

  async function runBookingLuxury(bodyOverrides: Record<string, any> = {}) {
    mockQuoteInDb();
    const req = makeBookingRequest(makeBookingLuxuryBody(bodyOverrides));
    const res = await bookingLuxury(req);
    const data = await res.json();
    return { res, data };
  }

  it('(a) no promo: Stripe unit_amount equals quote totalPence', async () => {
    const { data } = await runBookingLuxury();
    expect(data.booking).toBeDefined();
    const bookingId = data.booking.id;
    const bookingRef = data.booking.reference;

    // booking.totalGBP must be the server quote amount
    expect(createdBooking.totalGBP).toBe(QUOTE_TOTAL_PENCE);

    // Now simulate create-checkout-session with a TAMPERED client amount
    mockBookingFindUnique.mockResolvedValueOnce(createdBooking);
    const csReq = makeCheckoutRequest(bookingId, bookingRef, /* tampered */ 99900);
    await createCheckoutSession(csReq);

    // Stripe must have been called with booking.totalGBP, not the tampered amount
    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: QUOTE_TOTAL_PENCE,
            }),
          }),
        ]),
      })
    );
  });

  it('(b) % promo applied server-side: Stripe unit_amount = quote − discount', async () => {
    const DISCOUNT_PENCE = 1440; // 10%
    mockValidatePromotion.mockResolvedValue({
      valid: true,
      code: 'SAVE10',
      promotionId: 'promo-1',
      discountPence: DISCOUNT_PENCE,
      name: '10% off',
    });

    mockQuoteInDb();
    const req = makeBookingRequest(makeBookingLuxuryBody({ promotionCode: 'SAVE10' }));
    const res = await bookingLuxury(req);
    const data = await res.json();

    const expectedPence = QUOTE_TOTAL_PENCE - DISCOUNT_PENCE; // 12960
    expect(createdBooking.totalGBP).toBe(expectedPence);

    mockBookingFindUnique.mockResolvedValueOnce(createdBooking);
    const csReq = makeCheckoutRequest(data.booking.id, data.booking.reference, /* tampered */ 99900);
    await createCheckoutSession(csReq);

    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({
              unit_amount: expectedPence,
            }),
          }),
        ]),
      })
    );
  });

  it('(c) fixed promo applied server-side: Stripe unit_amount = quote − fixed discount', async () => {
    const FIXED_DISCOUNT = 2000; // £20
    mockValidatePromotion.mockResolvedValue({
      valid: true,
      code: 'OFF20',
      promotionId: 'promo-2',
      discountPence: FIXED_DISCOUNT,
      name: '£20 off',
    });

    mockQuoteInDb();
    const req = makeBookingRequest(makeBookingLuxuryBody({ promotionCode: 'OFF20' }));
    const res = await bookingLuxury(req);

    const expectedPence = QUOTE_TOTAL_PENCE - FIXED_DISCOUNT;
    expect(createdBooking.totalGBP).toBe(expectedPence);

    mockBookingFindUnique.mockResolvedValueOnce(createdBooking);
    await createCheckoutSession(makeCheckoutRequest(res.status === 200 ? (await res.clone().json()).booking?.id : 'x', REF, 99900));
    // Unit amount check — correct server total used
    expect(mockStripeSessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: expectedPence }),
          }),
        ]),
      })
    );
  });

  it('(d) tampered client amount: Stripe unit_amount is server amount, not tampered value', async () => {
    const { data } = await runBookingLuxury();
    mockBookingFindUnique.mockResolvedValueOnce(createdBooking);

    const TAMPERED = 100; // £1 — clearly wrong
    const csReq = makeCheckoutRequest(data.booking.id, data.booking.reference, TAMPERED * 100);
    await createCheckoutSession(csReq);

    const call = mockStripeSessionCreate.mock.calls[0]?.[0];
    const charged = call?.line_items?.[0]?.price_data?.unit_amount;
    expect(charged).not.toBe(TAMPERED * 100);
    expect(charged).toBe(QUOTE_TOTAL_PENCE);
  });

  it('create-checkout-session returns 422 when booking is not pre-created', async () => {
    mockBookingFindUnique.mockResolvedValue(null);
    const req = makeCheckoutRequest('no-such-booking', 'NO-REF', 10000);
    const res = await createCheckoutSession(req);
    expect(res.status).toBe(422);
  });
});
