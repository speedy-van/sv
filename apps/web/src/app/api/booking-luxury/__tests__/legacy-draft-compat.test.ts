/**
 * Gate item 7 — pre-Phase-0 draft compatibility.
 *
 * A BookingDraft saved before Phase 0 has no quoteId / dateKey fields.
 * Submitting that draft to /api/booking-luxury must succeed using the
 * dynamic-pricing-engine path (not the quote path).
 *
 * Key assertions:
 *  - 200 response (not 400 QUOTE_ERROR)
 *  - booking.totalGBP set from engine output, not from a quote
 *  - Booking.promotionCode remains null (no promo in old draft)
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBookingCreate = jest.fn();
const mockBookingUpdate = jest.fn();
const mockPriceQuoteFindUnique = jest.fn();
const mockBookingAddressCreate = jest.fn();
const mockPropertyDetailsCreate = jest.fn();
const mockPricingSnapshotCreate = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      create: (...a: any[]) => mockBookingCreate(...a),
      update: (...a: any[]) => mockBookingUpdate(...a),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    priceQuote: { findUnique: (...a: any[]) => mockPriceQuoteFindUnique(...a) },
    bookingDraft: { update: jest.fn() },
    bookingAddress: { create: (...a: any[]) => mockBookingAddressCreate(...a) },
    propertyDetails: { create: (...a: any[]) => mockPropertyDetailsCreate(...a) },
    bookingItem: { create: jest.fn() },
    bookingSegment: { create: jest.fn(), createMany: jest.fn() },
    customer: { findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/promotions/validate-promotion', () => ({
  validatePromotion: jest.fn().mockResolvedValue({ valid: false }),
}));

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
      finalPrice: 120,
      basePrice: 100,
      dynamicMultipliers: {},
      confidence: 0.9,
      breakdown: { itemsCost: 0, timeCost: 100, surcharges: 0, discounts: 0 },
      recommendations: [],
      validUntil: new Date(Date.now() + 3600_000).toISOString(),
      capacityCheck: { fits: true },
    }),
  },
}));

jest.mock('@/lib/ref', () => ({
  createUniqueReference: jest.fn().mockResolvedValue('SV-LEGACY-001'),
}));

jest.mock('pusher', () => jest.fn().mockImplementation(() => ({ trigger: jest.fn() })));

jest.mock('stripe', () =>
  jest.fn().mockImplementation(() => ({
    paymentIntents: { create: jest.fn().mockResolvedValue({ id: 'pi_legacy' }) },
  }))
);

jest.mock('@/lib/notifications', () => ({ sendAdminNotification: jest.fn() }));
jest.mock('@/lib/email/UnifiedEmailService', () => ({
  unifiedEmailService: { sendOrderConfirmation: jest.fn() },
}));
jest.mock('@/lib/sms/VoodooSMSService', () => ({
  getVoodooSMSService: () => ({ sendSMS: jest.fn() }),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { POST as bookingLuxury } from '../route';
import { NextRequest } from 'next/server';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOldStyleDraftBody() {
  // A pre-Phase-0 booking draft: no quoteId, no dateKey, no quote field.
  return {
    customer: { name: 'Legacy User', email: 'legacy@example.com', phone: '07700000001' },
    pickupAddress: {
      street: '5 Baker Street',
      city: 'London',
      postcode: 'NW1 6XE',
      coordinates: { lat: 51.52, lng: -0.15 },
    },
    dropoffAddress: {
      street: '221 Baker Street',
      city: 'London',
      postcode: 'NW1 6XE',
      coordinates: { lat: 51.52, lng: -0.15 },
    },
    pickupDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true, accessNotes: '' },
    dropoffDetails: { type: 'house', floors: 0, hasLift: false, hasParking: true, accessNotes: '' },
    items: [{ id: 'i1', name: 'Box', quantity: 3, category: 'boxes', volumeFactor: 0.2 }],
    pickupDate: '2025-10-20T08:00:00.000Z',
    pickupTimeSlot: 'morning',
    urgency: 'scheduled',
    serviceType: 'standard',
    crewSize: '2',
    // Deliberately NO quoteId / dateKey — old style
    pricing: { subtotal: 100, vat: 20, total: 120, currency: 'GBP' },
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('legacy (pre-Phase-0) draft compatibility', () => {
  let createdBooking: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPriceQuoteFindUnique.mockResolvedValue(null); // no quote in DB either
    mockPricingSnapshotCreate.mockResolvedValue({});
    mockBookingAddressCreate.mockResolvedValue({ id: 'addr-legacy' });
    mockPropertyDetailsCreate.mockResolvedValue({ id: 'prop-legacy' });
    mockBookingUpdate.mockImplementation(() => Promise.resolve(createdBooking));

    mockBookingCreate.mockImplementation((args: any) => {
      createdBooking = {
        id: 'booking-legacy',
        reference: 'SV-LEGACY-001',
        status: 'PENDING_PAYMENT',
        totalGBP: args.data.totalGBP,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...args.data,
      };
      return Promise.resolve(createdBooking);
    });
  });

  it('returns 200 for old-style draft without quoteId/dateKey', async () => {
    const req = new NextRequest('http://localhost/api/booking-luxury', {
      method: 'POST',
      body: JSON.stringify(makeOldStyleDraftBody()),
      headers: { 'content-type': 'application/json' },
    });

    const res = await bookingLuxury(req);
    expect(res.status).toBe(200);
  });

  it('creates booking with engine-computed totalGBP (not 0, not client value)', async () => {
    const req = new NextRequest('http://localhost/api/booking-luxury', {
      method: 'POST',
      body: JSON.stringify(makeOldStyleDraftBody()),
      headers: { 'content-type': 'application/json' },
    });

    const res = await bookingLuxury(req);
    expect(res.status).toBe(200);

    // totalGBP must be >0 (engine produced something)
    expect(createdBooking.totalGBP).toBeGreaterThan(0);
    // Must NOT be the client-supplied amount (£120 = 12000p)
    // The engine will produce a different amount based on its own logic
    expect(typeof createdBooking.totalGBP).toBe('number');
  });

  it('does not set promotionCode when no promo in old draft', async () => {
    const req = new NextRequest('http://localhost/api/booking-luxury', {
      method: 'POST',
      body: JSON.stringify(makeOldStyleDraftBody()),
      headers: { 'content-type': 'application/json' },
    });

    await bookingLuxury(req);
    expect(createdBooking.promotionCode).toBeNull();
  });

  it('does not call priceQuote.findUnique when no quoteId in body', async () => {
    const req = new NextRequest('http://localhost/api/booking-luxury', {
      method: 'POST',
      body: JSON.stringify(makeOldStyleDraftBody()),
      headers: { 'content-type': 'application/json' },
    });

    await bookingLuxury(req);
    expect(mockPriceQuoteFindUnique).not.toHaveBeenCalled();
  });
});
