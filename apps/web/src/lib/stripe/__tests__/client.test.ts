/**
 * STRIPE INTEGRATION UNIT TESTS - PRODUCTION GRADE
 * 
 * Comprehensive test suite for Stripe client functions covering:
 * - Payment Intent creation and management
 * - Webhook signature verification
 * - Currency conversion and formatting
 * - Error handling and validation
 * - Idempotency key generation
 * - GBP pence precision handling
 */

import Stripe from 'stripe';

// Mock Stripe constructor
jest.mock('stripe');
const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

import { 
  createPaymentIntent,
  retrievePaymentIntent,
  confirmPaymentIntent,
  cancelPaymentIntent,
  formatGbpMinor,
  parseGbpMajor,
  verifyWebhookSignature,
  generateIdempotencyKey,
  setStripeInstanceForTesting
} from '../client';

describe('Stripe Integration', () => {
  let mockStripeInstance: any;
  
  beforeEach(() => {
    // Set up environment variables for tests first
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_secret';
    
    // Create properly typed mock functions
    const mockPaymentIntents = {
      create: jest.fn() as jest.MockedFunction<any>,
      retrieve: jest.fn() as jest.MockedFunction<any>,
      confirm: jest.fn() as jest.MockedFunction<any>,
      cancel: jest.fn() as jest.MockedFunction<any>,
    };
    
    const mockWebhooks = {
      constructEvent: jest.fn() as jest.MockedFunction<any>,
    };
    
    mockStripeInstance = {
      paymentIntents: mockPaymentIntents,
      webhooks: mockWebhooks,
    } as any;
    
    // Mock the Stripe constructor to return our mock instance
    MockedStripe.mockImplementation(() => mockStripeInstance);
    
    // Inject the mock instance into the client
    setStripeInstanceForTesting(mockStripeInstance);
    
    // Clear all mocks before each test
    jest.clearAllMocks();
  });



  afterEach(() => {
    jest.clearAllMocks();
    // Reset the stripe instance
    setStripeInstanceForTesting(null);
  });

  describe('Payment Intent Creation', () => {
    test('should create Payment Intent with valid input', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        status: 'requires_payment_method',
        amount: 5000, // £50.00 in pence
        currency: 'gbp',
        metadata: { correlationId: 'test-123' },
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const input = {
        amountGbpMinor: 5000,
        description: 'Test booking payment',
        metadata: { bookingId: 'booking-123' }
      };

      const result = await createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-correlation-id');

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          currency: 'gbp',
          description: 'Test booking payment',
          metadata: expect.objectContaining({
            correlationId: 'test-correlation-id',
            bookingId: 'booking-123'
          }),
          statement_descriptor: 'SPEEDY VAN MOVE',
          automatic_payment_methods: { enabled: true },
          capture_method: 'automatic'
        }),
        undefined
      );

      expect(result).toEqual({
        id: 'pi_mock_123',
        clientSecret: 'pi_mock_123_secret',
        status: 'requires_payment_method',
        amountGbpMinor: 5000,
        currency: 'gbp',
        metadata: { correlationId: 'test-123' },
        created: 1234567890
      });
    });

    test('should create Payment Intent with customer ID', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        status: 'requires_payment_method',
        amount: 3000,
        currency: 'gbp',
        customer: 'cus_mock_customer',
        metadata: {},
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const input = {
        amountGbpMinor: 3000,
        description: 'Customer payment',
        customerId: 'cus_mock_customer'
      };

      const result = await createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id');

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_mock_customer',
          amount: 3000,
          currency: 'gbp',
          automatic_payment_methods: { enabled: true },
          capture_method: 'automatic'
        }),
        undefined
      );

      expect(result.id).toBe('pi_mock_123');
    });

    test('should create Payment Intent with idempotency key', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_123',
        client_secret: 'pi_mock_123_secret',
        status: 'requires_payment_method',
        amount: 2000,
        currency: 'gbp',
        metadata: {},
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const input = {
        amountGbpMinor: 2000,
        description: 'Idempotent payment',
        idempotencyKey: 'idem_key_123'
      };

      const result = await createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id');

      expect(mockStripeInstance.paymentIntents.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          idempotencyKey: 'idem_key_123'
        })
      );
    });

    test('should handle Stripe errors gracefully', async () => {
      // Reset the mock to ensure clean state
      mockStripeInstance.paymentIntents.create.mockReset();
      
      const stripeError = new Stripe.errors.StripeCardError({
        message: 'Your card was declined.',
        type: 'card_error',
        code: 'card_declined'
      });

      mockStripeInstance.paymentIntents.create.mockRejectedValue(stripeError);

      const input = {
        amountGbpMinor: 1000,
        description: 'Failing payment'
      };

      await expect(createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow(
        'Stripe error: Your card was declined. (card_error)'
      );
    });

    test('should validate minimum amount', async () => {
      const input = {
        amountGbpMinor: 30, // Below 50p minimum
        description: 'Too small amount'
      };

      await expect(createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow();
    });
  });

  describe('Payment Intent Retrieval', () => {
    test('should retrieve existing Payment Intent', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_retrieve',
        client_secret: 'pi_mock_retrieve_secret',
        status: 'succeeded',
        amount: 7500,
        currency: 'gbp',
        metadata: { bookingId: 'booking-retrieve' },
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await retrievePaymentIntent('pi_mock_retrieve', 'test-id');

      expect(mockStripeInstance.paymentIntents.retrieve).toHaveBeenCalledWith('pi_mock_retrieve');
      expect(result.id).toBe('pi_mock_retrieve');
      expect(result.status).toBe('succeeded');
    });

    test('should handle non-existent Payment Intent', async () => {
      const stripeError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'No such payment_intent: pi_nonexistent'
      });

      mockStripeInstance.paymentIntents.retrieve.mockRejectedValue(stripeError);

      await expect(retrievePaymentIntent('pi_nonexistent', 'test-id')).rejects.toThrow(
        'Failed to retrieve Payment Intent'
      );
    });
  });

  describe('Payment Intent Confirmation', () => {
    test('should confirm Payment Intent successfully', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_confirm',
        client_secret: 'pi_mock_confirm_secret',
        status: 'succeeded',
        amount: 4000,
        currency: 'gbp',
        metadata: {},
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await confirmPaymentIntent('pi_mock_confirm', 'pm_mock_method', 'test-id');

      expect(mockStripeInstance.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_mock_confirm',
        expect.objectContaining({
          payment_method: 'pm_mock_method'
        })
      );

      expect(result.status).toBe('succeeded');
    });

    test('should confirm Payment Intent without payment method', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_confirm_no_pm',
        client_secret: 'pi_mock_confirm_no_pm_secret',
        status: 'succeeded',
        amount: 6000,
        currency: 'gbp',
        metadata: {},
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.confirm.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await confirmPaymentIntent('pi_mock_confirm_no_pm');

      expect(mockStripeInstance.paymentIntents.confirm).toHaveBeenCalledWith(
        'pi_mock_confirm_no_pm',
        {}
      );
    });
  });

  describe('Payment Intent Cancellation', () => {
    test('should cancel Payment Intent successfully', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_mock_cancel',
        client_secret: 'pi_mock_cancel_secret',
        status: 'canceled',
        amount: 3500,
        currency: 'gbp',
        metadata: {},
        created: 1234567890,
        cancellation_reason: 'requested_by_customer'
      };

      mockStripeInstance.paymentIntents.cancel.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const result = await cancelPaymentIntent('pi_mock_cancel', 'Customer request', 'test-id');

      expect(mockStripeInstance.paymentIntents.cancel).toHaveBeenCalledWith(
        'pi_mock_cancel',
        expect.objectContaining({
          cancellation_reason: 'Customer request'
        })
      );

      expect(result.status).toBe('canceled');
    });
  });

  describe('Currency Utilities', () => {
    test('should format GBP minor currency correctly', () => {
      expect(formatGbpMinor(0)).toBe('£0.00');
      expect(formatGbpMinor(50)).toBe('£0.50');
      expect(formatGbpMinor(100)).toBe('£1.00');
      expect(formatGbpMinor(1250)).toBe('£12.50');
      expect(formatGbpMinor(999999)).toBe('£9999.99');
    });

    test('should parse GBP major currency correctly', () => {
      expect(parseGbpMajor(0)).toBe(0);
      expect(parseGbpMajor(0.5)).toBe(50);
      expect(parseGbpMajor(1)).toBe(100);
      expect(parseGbpMajor(12.5)).toBe(1250);
      expect(parseGbpMajor(99.99)).toBe(9999);
      expect(parseGbpMajor(100.005)).toBe(10001); // Rounding
    });

    test('should handle edge cases in currency conversion', () => {
      expect(formatGbpMinor(-100)).toBe('£-1.00');
      expect(parseGbpMajor(0.001)).toBe(0); // Rounds down
      expect(parseGbpMajor(0.009)).toBe(1); // Rounds up
    });
  });

  describe('Webhook Verification', () => {
    test('should verify valid webhook signature', () => {
      const mockEvent = { id: 'evt_mock', type: 'payment_intent.succeeded' };
      mockStripeInstance.webhooks.constructEvent.mockReturnValue(mockEvent as Stripe.Event);

      const payload = '{"test": "payload"}';
      const signature = 'v1=mock_signature';
      const secret = 'whsec_mock_secret';

      const result = verifyWebhookSignature(payload, signature, secret);

      expect(mockStripeInstance.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        secret
      );
      expect(result).toEqual(mockEvent);
    });

    test('should reject invalid webhook signature', () => {
      const webhookError = new Error('Invalid signature');
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw webhookError;
      });

      const payload = '{"test": "payload"}';
      const signature = 'invalid_signature';
      const secret = 'whsec_mock_secret';

      expect(() => verifyWebhookSignature(payload, signature, secret)).toThrow(
        'Invalid webhook signature'
      );
    });
  });

  describe('Idempotency Key Generation', () => {
    test('should generate unique idempotency keys', () => {
      const key1 = generateIdempotencyKey();
      const key2 = generateIdempotencyKey();

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^sv_\d+_[a-z0-9]+$/);
      expect(key2).toMatch(/^sv_\d+_[a-z0-9]+$/);
    });

    test('should use custom prefix', () => {
      const key = generateIdempotencyKey('booking');

      expect(key).toMatch(/^booking_\d+_[a-z0-9]+$/);
    });

    test('should include timestamp for uniqueness', () => {
      const now = Date.now();
      const key = generateIdempotencyKey();
      const timestamp = parseInt(key.split('_')[1]);

      expect(timestamp).toBeGreaterThanOrEqual(now);
    });
  });

  describe('Input Validation', () => {
    test('should validate Payment Intent creation input', async () => {
      // Test with invalid amount
      const invalidInput = {
        amountGbpMinor: -100, // Negative amount
        description: 'Invalid payment'
      };

      await expect(createPaymentIntent({
        ...invalidInput,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow();
    });

    test('should validate required description', async () => {
      const invalidInput = {
        amountGbpMinor: 1000,
        description: '' // Empty description
      };

      await expect(createPaymentIntent({
        ...invalidInput,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow();
    });

    test('should validate email format in customer email', async () => {
      const invalidInput = {
        amountGbpMinor: 1000,
        description: 'Valid payment',
        customerEmail: 'invalid-email' // Invalid email format
      };

      await expect(createPaymentIntent({
        ...invalidInput,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockStripeInstance.paymentIntents.create.mockRejectedValue(networkError);

      const input = {
        amountGbpMinor: 1000,
        description: 'Network test'
      };

      await expect(createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-id')).rejects.toThrow(
        'Failed to create Payment Intent'
      );
    });

    test('should handle missing environment variables', () => {
      delete process.env.STRIPE_SECRET_KEY;

      expect(() => {
        // This would happen during module import in real scenario
        new (Stripe as any)();
      }).toThrow();
    });
  });

  describe('Metadata Handling', () => {
    test('should preserve metadata in Payment Intent', async () => {
      const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
        id: 'pi_metadata_test',
        client_secret: 'pi_metadata_test_secret',
        status: 'requires_payment_method',
        amount: 2500,
        currency: 'gbp',
        metadata: {
          bookingId: 'booking-metadata-test',
          customerName: 'John Doe',
          correlationId: 'test-correlation'
        },
        created: 1234567890
      };

      mockStripeInstance.paymentIntents.create.mockResolvedValue(mockPaymentIntent as Stripe.PaymentIntent);

      const input = {
        amountGbpMinor: 2500,
        description: 'Metadata test',
        metadata: {
          bookingId: 'booking-metadata-test',
          customerName: 'John Doe'
        }
      };

      const result = await createPaymentIntent({
        ...input,
        automaticPaymentMethods: true,
        captureMethod: 'manual'
      }, 'test-correlation');

      expect(result.metadata).toEqual(expect.objectContaining({
        bookingId: 'booking-metadata-test',
        customerName: 'John Doe',
        correlationId: 'test-correlation'
      }));
    });
  });
});
