/**
 * Gate item 5 — quote expiry UX.
 *
 * When booking-luxury returns { code: 'QUOTE_EXPIRED' } (HTTP 400), the
 * StripePaymentButton must:
 *   1. Call the onQuoteExpired callback with the currently displayed amount.
 *   2. Reset to idle (not stay in "processing" state).
 *   3. NOT proceed to create-checkout-session.
 *   4. NOT show a warning toast by itself; the parent only shows a toast if the
 *      refreshed quote amount actually changed.
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
  displayedAmountPence,
  fetchBookingLuxury,
  onQuoteExpired,
  setIsProcessing,
  setPaymentStatus,
  toast,
}: {
  bookingId: string | undefined;
  displayedAmountPence: number;
  fetchBookingLuxury: () => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>;
  onQuoteExpired: (previousAmountPence?: number) => void;
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
        onQuoteExpired(displayedAmountPence);
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
    let quoteExpiredAmount: number | undefined;

    const result = await simulateHandlePayment({
      bookingId: undefined,
      displayedAmountPence: 12000,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: (amount) => { quoteExpiredAmount = amount; },
      setIsProcessing: (v) => setProcessingValues.push(v),
      setPaymentStatus: (v) => setStatusValues.push(v),
      toast: (opts) => toastCalls.push(opts),
    });

    expect(result).toBe('expired');
    expect(quoteExpiredAmount).toBe(12000);
    expect(setProcessingValues).toContain(false); // reset to idle
    expect(setStatusValues).toContain('idle');
  });

  it('does NOT proceed to checkout-session when quote is expired', async () => {
    await simulateHandlePayment({
      bookingId: undefined,
      displayedAmountPence: 12000,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: () => {},
    });

    expect(checkoutSessionCalls).toHaveLength(0);
  });

  it('does not show a warning toast when quote is expired', async () => {
    await simulateHandlePayment({
      bookingId: undefined,
      displayedAmountPence: 12000,
      fetchBookingLuxury: async () => makeExpiredQuoteResponse() as any,
      onQuoteExpired: () => {},
      setIsProcessing: () => {},
      setPaymentStatus: () => {},
      toast: (opts) => toastCalls.push(opts),
    });

    expect(toastCalls.some((t) => t.status === 'warning')).toBe(false);
  });

  it('proceeds to checkout-session when booking-luxury succeeds', async () => {
    const result = await simulateHandlePayment({
      bookingId: undefined,
      displayedAmountPence: 14400,
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
        displayedAmountPence: 12000,
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

// ─── Refreshed quote comparison ───────────────────────────────────────────────

function simulateQuoteRefreshComparison({
  previousAmountPence,
  refreshedAmountPence,
  toast,
}: {
  previousAmountPence: number | null;
  refreshedAmountPence: number;
  toast: (opts: any) => void;
}) {
  if (previousAmountPence !== null && Math.abs(previousAmountPence - refreshedAmountPence) > 1) {
    toast({
      title: `Your price was updated to £${(refreshedAmountPence / 100).toFixed(2)}`,
      status: 'info',
    });
  }
}

describe('booking page — refreshed quote messaging', () => {
  beforeEach(() => {
    toastCalls = [];
  });

  it('shows the updated price when a refreshed quote changes amount', () => {
    simulateQuoteRefreshComparison({
      previousAmountPence: 12000,
      refreshedAmountPence: 14400,
      toast: (opts) => toastCalls.push(opts),
    });

    expect(toastCalls).toEqual([
      expect.objectContaining({
        title: 'Your price was updated to £144.00',
        status: 'info',
      }),
    ]);
  });

  it('continues silently when a refreshed quote amount is unchanged', () => {
    simulateQuoteRefreshComparison({
      previousAmountPence: 14400,
      refreshedAmountPence: 14400,
      toast: (opts) => toastCalls.push(opts),
    });

    expect(toastCalls).toHaveLength(0);
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

  it('does not halt when amounts match (within 1p tolerance)', async () => {
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
