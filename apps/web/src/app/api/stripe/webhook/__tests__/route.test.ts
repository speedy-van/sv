// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockBookingFindUnique = jest.fn();
const mockBookingUpdate = jest.fn();
const mockAuditLogCreate = jest.fn();
const mockSendAdminNotification = jest.fn();
const mockVerifyWebhookSignature = jest.fn();

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => new Headers({ 'stripe-signature': 'sig_test' })),
}));

jest.mock('@/lib/stripe/client', () => ({
  verifyWebhookSignature: (...args: any[]) => mockVerifyWebhookSignature(...args),
}));

jest.mock('@/lib/pricing/schemas', () => ({
  createRequestId: () => 'test-request-id',
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    booking: {
      findUnique: (...args: any[]) => mockBookingFindUnique(...args),
      update: (...args: any[]) => mockBookingUpdate(...args),
    },
    auditLog: {
      create: (...args: any[]) => mockAuditLogCreate(...args),
    },
    drop: { updateMany: jest.fn() },
    route: { updateMany: jest.fn() },
  },
}));

jest.mock('@/lib/notifications', () => ({
  sendAdminNotification: (...args: any[]) => mockSendAdminNotification(...args),
}));

jest.mock('@/lib/services/pricing-snapshot-service', () => ({
  pricingSnapshotService: { verifyPricingMatchesStripe: jest.fn() },
}));

jest.mock('@/lib/services/route-orchestration-service', () => ({
  RouteOrchestrationService: { createRoutesFromPendingDrops: jest.fn() },
}));

jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { POST } from '../route';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('/api/stripe/webhook payment_intent.succeeded amount guard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  });

  it('audits and sends a critical alert without confirming when PaymentIntent amount differs from booking.totalGBP', async () => {
    mockBookingFindUnique.mockResolvedValue({
      id: 'booking-123',
      reference: 'SV-001',
      totalGBP: 5000,
    });
    mockVerifyWebhookSignature.mockReturnValue({
      id: 'evt_pi_succeeded',
      type: 'payment_intent.succeeded',
      created: 123,
      livemode: false,
      data: {
        object: {
          id: 'pi_mismatch',
          amount: 4000,
          customer: null,
          metadata: { bookingId: 'booking-123' },
        },
      },
    });

    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      body: JSON.stringify({ id: 'evt_pi_succeeded' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockAuditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'payment_amount_mismatch',
          targetType: 'booking',
          targetId: 'booking-123',
          details: expect.objectContaining({
            expectedAmount: 5000,
            receivedAmount: 4000,
            paymentIntentId: 'pi_mismatch',
          }),
        }),
      })
    );
    expect(mockSendAdminNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Payment amount mismatch'),
        priority: 'critical',
      })
    );
    expect(mockBookingUpdate).not.toHaveBeenCalled();
  });
});
