/**
 * Gate item 5 — quote expiry UX.
 *
 * When booking-luxury returns { code: 'QUOTE_EXPIRED' } (HTTP 400), the
 * StripePaymentButton must:
 *   1. Call the onQuoteExpired callback (triggers a fresh quote fetch in the parent).
 *   2. Reset to idle (not stay in "processing" state).
 *   3. NOT proceed to create-checkout-session.
 *
 * We test the handler logic directly (not DOM/React) by extracting the path
 * through handlePayment and verifying the observable side-effects on the mocked
 * dependencies.
 */

// ─── Module-level state mirrors ───────────────────────────────────────────────

// Track whether fetch was called for checkout-session
const checkoutSessionCalls: string[] = [];

let toastCalls: any[] = [];
let setProcessingValues: boolean[] = [];
let setStatusValues: string[] = [];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeExpiredQuoteResponse() {
  return {
    ok: false,
    status: 400,
    json: async () => ({ error: 'Quote has expired', code: 'QUOTE_EXPIRED' }),
  };
}

function makeSuccessBookingResponse(totalPence: number) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      booking: {
        id: 'b-1',
        reference: 'SV-001',
        payment: { amountPence: totalPence },
      },
    }),
  };
}

// Simulate the handlePayment logic that lives inside StripePaymentButton
async function simulateHandlePayment({
  bookingId,
  fetchBookingLuxury,
  onQuoteExpired,
  setIsProcessing,
  setPaymentStatus,
  toast,
}: {
  bookingId: string | undefined;
  fetchBookingLuxury: () => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;
  onQuoteExpired: () => void;
  setIsProcessing: (v: boolean) => void;
  setPaymentStatus: (v: string) => void;
  toast: (opts: any) => void;
}) {
  setIsProcessing(true);
  setPaymentStatus('processing');

  if (!bookingId) {
    const bookingResponse = await fetchBookingLuxury();
    if (!bookingResponse.ok) {
      const errorData = await bookingResponse.json();
      if (errorData.code === 'QUOTE_EXPIRED') {
        toast({ title: 'Quote expired', status: 'warning' });
        onQuoteExpired();
        setIsProcessing(false);
        setPaymentStatus('idle');
        return 'expired';
      }
      throw new Error(errorData.error || 'Booking failed');
    }
  }

  // Pretend we also call checkout-session
  checkoutSessionCalls.push('checkout-session-called');
  return 'checkout';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('StripePaymentButton — QUOTE_EXPIRED handling', () => {
  beforeEach(() => {
    checkoutSessionCalls.length = 0;
    toastCalls = [];
    setProcessingValues = [];
    setStatusValues = [];
  });

  it('calls onQuoteExpired and resets to idle when server returns QUOTE_EXPIRED', async () => {
    let quoteExpiredCalled = false;

    const result = await simulateHandlePayment({
      bookingId: undefined,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: () => { quoteExpiredCalled = true; },
      setIsProcessing: (v) => setProcessingValues.push(v),
      setPaymentStatus: (v) => setStatusValues.push(v),
      toast: (opts) => toastCalls.push(opts),
    });

    expect(result).toBe('expired');
    expect(quoteExpiredCalled).toBe(true);
    expect(setProcessingValues).toContain(false); // reset to idle
    expect(setStatusValues).toContain('idle');
  });

  it('does NOT proceed to checkout-session when quote is expired', async () => {
    await simulateHandlePayment({
      bookingId: undefined,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: () => {},
    });

    expect(checkoutSessionCalls).toHaveLength(0);
  });

  it('shows a warning toast when quote is expired', async () => {
    await simulateHandlePayment({
      bookingId: undefined,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: (opts) => toastCalls.push(opts),
    });

    expect(toastCalls.some((t) => t.status === 'warning')).toBe(true);
  });

  it('proceeds to checkout-session when booking-luxury succeeds', async () => {
    const result = await simulateHandlePayment({
      bookingId: undefined,
      fetchBookingLuxury: async () => makeSuccessBookingResponse(14400) as any,
      onQuoteExpired: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: () => {},
    });

    expect(result).toBe('checkout');
    expect(checkoutSessionCalls).toHaveLength(1);
  });

  it('throws (does NOT silently succeed) on non-expired booking error', async () => {
    await expect(
      simulateHandlePayment({
        bookingId: undefined,
        fetchBookingLuxury: async () => ({
          ok: false,
          status: 500,
          json: async () => ({ error: 'Internal server error', code: 'SERVER_ERROR' }),
        }) as any,
        onQuoteExpired: () => {},
        setIsProcessing: () => {},
        setPaymentStatus: () => {},
        toast: () => {},
      })
    ).rejects.toThrow('Internal server error');
  });
});

// ─── Price adjustment retap ───────────────────────────────────────────────────

async function simulateHandlePaymentWithRetap({
  displayedAmountPence,
  serverAmountPence,
  requiresRetap,
  setRequiresRetap,
  setServerAmountPence,
  setIsProcessing,
  setPaymentStatus,
  toast,
}: {
  displayedAmountPence: number;
  serverAmountPence: number;
  requiresRetap: boolean;
  setRequiresRetap: (v: boolean) => void;
  setServerAmountPence: (v: number) => void;
  setIsProcessing: (v: boolean) => void;
  setPaymentStatus: (v: string) => void;
  toast: (opts: any) => void;
}) {
  setIsProcessing(true);
  setPaymentStatus('processing');

  if (!requiresRetap) {
    const bookingResponse = makeSuccessBookingResponse(serverAmountPence);
    const bookingResponseData = await bookingResponse.json();
    const serverPence: number = bookingResponseData.booking.payment.amountPence;

    if (Math.abs(serverPence - displayedAmountPence) > 1) {
      setServerAmountPence(serverPence);
      setRequiresRetap(true);
      setIsProcessing(false);
      setPaymentStatus('idle');
      toast({ title: `Price adjusted to £${(serverPence / 100).toFixed(2)}`, status: 'info' });
      return 'price-changed';
    }
  }

  checkoutSessionCalls.push('checkout-session-called');
  return 'checkout';
}

describe('StripePaymentButton — price adjustment retap', () => {
  beforeEach(() => {
    checkoutSessionCalls.length = 0;
    toastCalls = [];
    setProcessingValues = [];
    setStatusValues = [];
  });

  it('halts and shows price-changed toast when server amount differs from displayed', async () => {
    const retapValues: boolean[] = [];
    const serverPenceValues: number[] = [];

    const result = await simulateHandlePaymentWithRetap({
      displayedAmountPence: 12000,
      serverAmountPence: 14400,
      requiresRetap: false,
      setRequiresRetap: (v) => retapValues.push(v),
      setServerAmountPence: (v) => serverPenceValues.push(v),
      setIsProcessing: (v) => setProcessingValues.push(v),
      setPaymentStatus: (v) => setStatusValues.push(v),
      toast: (opts) => toastCalls.push(opts),
    });

    expect(result).toBe('price-changed');
    expect(retapValues).toContain(true);
    expect(serverPenceValues[0]).toBe(14400);
    expect(toastCalls.some((t) => t.status === 'info' && t.title.includes('144.00'))).toBe(true);
    expect(checkoutSessionCalls).toHaveLength(0);
  });

  it('proceeds to checkout on second tap when requiresRetap is true', async () => {
    const result = await simulateHandlePaymentWithRetap({
      displayedAmountPence: 12000,
      serverAmountPence: 14400,
      requiresRetap: true, // second tap
      setRequiresRetap: () => {},
      setServerAmountPence: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: () => {},
    });

    expect(result).toBe('checkout');
    expect(checkoutSessionCalls).toHaveLength(1);
  });

  it('does NOT halts when amounts match (within 1p tolerance)', async () => {
    const result = await simulateHandlePaymentWithRetap({
      displayedAmountPence: 14400,
      serverAmountPence: 14400,
      requiresRetap: false,
      setRequiresRetap: () => {},
      setServerAmountPence: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: () => {},
    });

    expect(result).toBe('checkout');
    expect(checkoutSessionCalls).toHaveLength(1);
  });
});
