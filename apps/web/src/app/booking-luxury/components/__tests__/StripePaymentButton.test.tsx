import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ComponentProps } from 'react';
import StripePaymentButton from '../StripePaymentButton';

jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react');
  return {
    ...actual,
    useToast: () => jest.fn(),
  };
});

const createBookingData = (overrides: Record<string, unknown> = {}) => ({
  customer: {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '07123456789',
  },
  pickupAddress: {
    street: '100 Holbeach Road',
    city: 'Spalding',
    postcode: 'PE11 2HX',
    coordinates: { lat: 52.796562, lng: -0.133074 },
  },
  dropoffAddress: {
    street: '10 Market Place',
    city: 'Spalding',
    postcode: 'PE11 1SU',
    coordinates: { lat: 52.787, lng: -0.151 },
  },
  items: [
    {
      id: 'sofa',
      name: 'Sofa',
      quantity: 1,
      category: 'furniture',
      volume: 1,
    },
  ],
  pricing: {
    subtotal: 100,
    vat: 20,
    total: 120,
    currency: 'GBP',
  },
  serviceType: 'standard',
  scheduledDate: '2026-10-09',
  scheduledTime: 'morning',
  pickupDetails: { type: 'house' },
  dropoffDetails: { type: 'house' },
  ...overrides,
});

const renderButton = (props: Partial<ComponentProps<typeof StripePaymentButton>> = {}) => {
  const defaultProps: ComponentProps<typeof StripePaymentButton> = {
    amount: 120,
    bookingData: createBookingData() as ComponentProps<typeof StripePaymentButton>['bookingData'],
    onSuccess: jest.fn(),
    onError: jest.fn(),
  };

  return render(
    <ChakraProvider>
      <StripePaymentButton {...defaultProps} {...props} />
    </ChakraProvider>
  );
};

describe('StripePaymentButton checkout lifecycle', () => {
  const fetchMock = global.fetch as jest.Mock;

  beforeEach(() => {
    fetchMock.mockReset();
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
  });

  it('notifies submitting before the first checkout request and blocks rapid repeats', () => {
    const events: string[] = [];
    fetchMock.mockImplementation(() => {
      events.push('fetch');
      return new Promise(() => {});
    });

    renderButton({
      onSubmittingChange: (submitting) => events.push(`submitting:${submitting}`),
    });

    const button = screen.getByRole('button', { name: /pay now/i });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['submitting:true', 'fetch']);
  });

  it('resets submitting in the mounted finally path when booking creation fails', async () => {
    const events: string[] = [];
    const onError = jest.fn();
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'booking unavailable' }),
    });

    renderButton({
      onError,
      onSubmittingChange: (submitting) => events.push(`submitting:${submitting}`),
    });

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('booking unavailable'));
    expect(events).toEqual(['submitting:true', 'submitting:false']);
    expect(screen.getByRole('button', { name: /pay now/i })).toBeEnabled();
  });

  it('retains the created booking for recovery when checkout session creation fails', async () => {
    const events: string[] = [];
    const onBookingCreated = jest.fn();
    const onError = jest.fn();

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          booking: {
            id: 'booking_123',
            reference: 'SV-TEST123',
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'checkout unavailable' }),
      });

    renderButton({
      onBookingCreated,
      onError,
      onSubmittingChange: (submitting) => events.push(`submitting:${submitting}`),
    });

    fireEvent.click(screen.getByRole('button', { name: /pay now/i }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith('checkout unavailable'));

    expect(onBookingCreated).toHaveBeenCalledWith({
      bookingId: 'booking_123',
      reference: 'SV-TEST123',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const checkoutRequest = fetchMock.mock.calls[1][1] as RequestInit;
    const checkoutBody = JSON.parse(String(checkoutRequest.body));
    expect(checkoutBody.bookingData.bookingId).toBe('booking_123');
    expect(checkoutBody.bookingData.bookingReference).toBe('SV-TEST123');
    expect(events).toEqual(['submitting:true', 'submitting:false']);
  });
});
