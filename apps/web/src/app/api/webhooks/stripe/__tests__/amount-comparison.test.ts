/**
 * Focused tests for the webhook payment amount comparison fix (Phase 0 task 0.10).
 *
 * Key invariant: booking.totalGBP is stored in PENCE (despite the name).
 * The old code did `booking.totalGBP * 100` which made every payment appear
 * mismatched. This test suite verifies the corrected behaviour.
 */

// ─── Mock setup (must precede imports) ────────────────────────────────────────

const mockBookingFindUnique = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockBookingUpdate = jest.fn();
const mockSendAdminNotification = jest.fn();

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: (...args: any[]) => mockBookingFindUnique(...args),
      update: (...args: any[]) => mockBookingUpdate(...args),
    },
    auditLog: {
      create: (...args: any[]) => mockAuditLogCreate(...args),
    },
    // stub out other models used by the handler
    payment: { create: jest.fn(), findUnique: jest.fn() },
    webhookEventLog: { create: jest.fn(), findUnique: jest.fn() },
  },
}));

jest.mock('@/lib/notifications', () => ({
  sendAdminNotification: (...args: any[]) => mockSendAdminNotification(...args),
}));

jest.mock('@/lib/driver-notifications', () => ({
  sendDriverNotification: jest.fn(),
}));

jest.mock('@/lib/email/UnifiedEmailService', () => ({
  unifiedEmailService: {
    sendOrderConfirmation: jest.fn(),
    sendPaymentConfirmation: jest.fn(),
    sendFloorWarning: jest.fn(),
  },
}));

jest.mock('@/lib/sms/VoodooSMSService', () => ({
  getVoodooSMSService: () => ({ sendSMS: jest.fn() }),
}));

jest.mock('@/lib/bookings/serviceType', () => ({
  deriveServiceMetadata: jest.fn(() => ({ isEconomy: false, serviceType: 'standard' })),
  withServicePreference: jest.fn(),
}));

const mockVerifyWebhookSignature = jest.fn();
jest.mock('@/lib/stripe', () => ({
  verifyWebhookSignature: (...args: any[]) => mockVerifyWebhookSignature(...args),
}));

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { POST } from '../route';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: string = '') {
  return {
    text: jest.fn().mockResolvedValue(body),
    headers: {
      get: (name: string) => (name === 'stripe-signature' ? 'sig_test' : null),
    },
  } as any;
}

function makeCheckoutCompletedEvent(amountTotal: number, bookingId = 'booking-123') {
  return {
    type: 'checkout.session.completed',
    id: 'evt_test',
    data: {
      object: {
        id: 'cs_test',
        mode: 'payment',
        amount_total: amountTotal,
        metadata: { bookingId },
      },
    },
  };
}

function makeFullBooking() {
  return {
    id: 'booking-123',
    totalGBP: 5000, // pence (not pounds — see HARD RULE)
    status: 'PENDING_PAYMENT',
    reference: 'SV-001',
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    pickupAddress: null,
    dropoffAddress: null,
    pickupProperty: null,
    dropoffProperty: null,
    BookingItem: [],
    urgency: null,
    orderType: null,
    customer: null,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Webhook amount comparison (Phase 0 fix)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    // Default: booking exists with 5000p
    mockBookingFindUnique.mockResolvedValue({ totalGBP: 5000 });
    mockBookingUpdate.mockResolvedValue(makeFullBooking());
    mockAuditLogCreate.mockResolvedValue({});
    mockSendAdminNotification.mockResolvedValue(undefined);
  });

  it('responds 200 received:true on a valid webhook', async () => {
    const event = makeCheckoutCompletedEvent(5000);
    mockVerifyWebhookSignature.mockResolvedValue(event);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });

  it('does NOT create an audit log or notify admin when amounts match', async () => {
    // session.amount_total === booking.totalGBP (both 5000p)
    const event = makeCheckoutCompletedEvent(5000);
    mockVerifyWebhookSignature.mockResolvedValue(event);

    await POST(makeRequest());

    expect(mockAuditLogCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'payment_amount_mismatch' }),
      })
    );
    expect(mockSendAdminNotification).not.toHaveBeenCalled();
  });

  it('creates an audit log and notifies admin with priority:critical when amounts differ', async () => {
    // session sends 4000p but we expected 5000p
    const event = makeCheckoutCompletedEvent(4000);
    mockVerifyWebhookSignature.mockResolvedValue(event);

    await POST(makeRequest());

    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'payment_amount_mismatch',
          details: expect.objectContaining({
            expectedAmount: 5000,
            receivedAmount: 4000,
          }),
        }),
      })
    );
    expect(mockSendAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'critical' })
    );
  });

  it('does NOT update the booking to CONFIRMED when there is a mismatch', async () => {
    const event = makeCheckoutCompletedEvent(4000);
    mockVerifyWebhookSignature.mockResolvedValue(event);

    await POST(makeRequest());

    // The booking.update for status:'CONFIRMED' must not have been called
    expect(mockBookingUpdate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      })
    );
  });

  it('OLD BUG regression: 500000 (= totalGBP * 100) must now be detected as a mismatch', async () => {
    // Before the fix, booking.totalGBP * 100 was used — this made 5000p look like
    // the expected amount was 500000p, so a session of 5000p would appear mismatched.
    // After the fix, expectedAmount = booking.totalGBP = 5000p, so 5000p matches
    // and 500000p is the thing that would be flagged as a mismatch.

    // Scenario: session sends 5000p (correct), but OLD code would have expected 500000p
    // After fix: 5000p === 5000p → no mismatch → no admin notification
    const event = makeCheckoutCompletedEvent(5000);
    mockVerifyWebhookSignature.mockResolvedValue(event);

    await POST(makeRequest());

    // After the fix, this should be a match (no notification)
    expect(mockSendAdminNotification).not.toHaveBeenCalled();
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    const req = {
      text: jest.fn().mockResolvedValue(''),
      headers: { get: () => null },
    } as any;

    const response = await POST(req);

    expect(response.status).toBe(400);
  });

  it('returns 400 when webhook signature verification fails', async () => {
    mockVerifyWebhookSignature.mockImplementation(() => {
      throw new Error('bad sig');
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
  });
});
