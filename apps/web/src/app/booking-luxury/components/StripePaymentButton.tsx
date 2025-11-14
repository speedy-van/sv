'use client';

import { useState } from 'react';
import {
  Button,
  VStack,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  Box,
  useToast,
} from '@chakra-ui/react';
import { FaCreditCard, FaLock, FaShieldAlt } from 'react-icons/fa';

interface CustomerData {
  name: string;
  email: string;
  phone: string;
}

interface AddressData {
  address?: string;
  city?: string;
  postcode?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
  houseNumber?: string;
  flatNumber?: string;
  floorNumber?: string;
  formatted_address?: string;
  place_name?: string;
  street?: string;
  full?: string;
  line1?: string;
  number?: string;
  buildingDetails?: {
    flatNumber?: string;
    apartmentNumber?: string;
    floorNumber?: string;
    hasElevator?: boolean;
    type?: string;
  };
}

interface ItemData {
  id?: string;
  name?: string;
  description?: string;
  category?: string;
  size?: 'small' | 'medium' | 'large';
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  weight?: number;
  volume?: number;
  image?: string;
}

interface PropertyDetails {
  type?: 'house' | 'apartment' | 'office' | 'warehouse' | 'other';
  floors?: number;
  hasLift?: boolean;
  hasParking?: boolean;
  accessNotes?: string;
  requiresPermit?: boolean;
  flatNumber?: string;
}

interface PricingData {
  baseFee?: number;
  distanceFee?: number;
  volumeFee?: number;
  serviceFee?: number;
  urgencyFee?: number;
  vat?: number;
  total?: number;
  distance?: number;
}

interface BookingData {
  customer: CustomerData;
  pickupAddress: AddressData;
  dropoffAddress: AddressData;
  items: ItemData[];
  pricing: PricingData;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string;
  pickupDetails: PropertyDetails;
  dropoffDetails: PropertyDetails;
  notes?: string;
  bookingId?: string;
  // Three-tier pricing support
  economyPrice?: number;
  standardPrice?: number;
  priorityPrice?: number;
  // Promotion code support
  promotionCode?: string;
  promotionDetails?: {
    id?: string;
    code?: string;
    name?: string;
    description?: string;
    type?: 'percentage' | 'fixed';
    value?: number;
    discountAmount?: number;
    originalAmount?: number;
    finalAmount?: number;
  };
}

const normaliseFlatNumber = (address?: AddressData): string | undefined => {
  if (!address) return undefined;

  const candidates = [
    address.flatNumber,
    address.buildingDetails?.flatNumber,
    address.buildingDetails?.apartmentNumber,
    address.line1?.startsWith('Flat ') ? address.line1 : undefined,
    address.line1?.startsWith('Apartment ') ? address.line1 : undefined,
    address.full?.startsWith('Flat ') ? address.full : undefined,
    address.full?.startsWith('Apartment ') ? address.full : undefined,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      const trimmed = value.trim();
      if (/^flat\s+/i.test(trimmed)) {
        const withoutPrefix = trimmed.replace(/^flat\s+/i, '').trim();
        return withoutPrefix.length > 0 ? withoutPrefix : trimmed;
      }
      if (/^apartment\s+/i.test(trimmed)) {
        const withoutApartment = trimmed.replace(/^apartment\s+/i, '').trim();
        return withoutApartment.length > 0 ? withoutApartment : trimmed;
      }
      return trimmed;
    }
  }

  return undefined;
};

const normaliseFloorNumber = (address?: AddressData): string | undefined => {
  if (!address) return undefined;

  const candidates = [
    address.floorNumber,
    address.buildingDetails?.floorNumber,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return undefined;
};

// Helper functions for three-tier pricing
const getCorrectTotal = (bookingData: BookingData): number => {
  const serviceType = bookingData.serviceType;
  const baseTotal = bookingData.pricing.total || 0;

  // If promotion is applied, use the final amount from promotion details
  if (bookingData.promotionDetails?.finalAmount) {
    return bookingData.promotionDetails.finalAmount;
  }

  // Otherwise use three-tier pricing
  switch (serviceType) {
    case 'standard':
      return bookingData.economyPrice || (baseTotal * 0.85); // 15% discount for economy
    case 'premium':
      return bookingData.standardPrice || baseTotal; // Standard price
    case 'white-glove':
      return bookingData.priorityPrice || (baseTotal * 1.5); // 50% premium for priority
    default:
      return baseTotal;
  }
};

const getCorrectSubtotal = (bookingData: BookingData): number => {
  const total = getCorrectTotal(bookingData);
  const vat = getCorrectVAT(bookingData);
  return total - vat;
};

const getCorrectVAT = (bookingData: BookingData): number => {
  const total = getCorrectTotal(bookingData);
  // Calculate VAT correctly: VAT = (Total / 1.2) * 0.2
  // This extracts the VAT from a total that already includes VAT
  const subtotal = total / 1.2;
  const vat = subtotal * 0.2;
  return Math.round(vat * 100) / 100; // Round to 2 decimal places
};

interface StripePaymentButtonProps {
  amount: number;
  bookingData: BookingData;
  onSuccess: (sessionId: string, paymentIntentId?: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function StripePaymentButton({
  amount,
  bookingData,
  onSuccess,
  onError,
  disabled = false,
}: StripePaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const toast = useToast();

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    // CRITICAL: Save scroll position before payment processing
    const scrollY = window.scrollY;

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Validate required data
      if (!bookingData.customer.email || !bookingData.customer.name) {
        throw new Error('Customer email and name are required');
      }
      
      // Validate amount (must be in pounds with max 2 decimal places)
      if (!amount || amount <= 0) {
        throw new Error('Valid amount is required');
      }

      // Restore scroll position immediately
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });

      // Ensure amount has at most 2 decimal places
      const formattedAmount = Math.round(amount * 100) / 100;
      if (formattedAmount !== amount) {
        console.error('❌ Amount has more than 2 decimal places:', {
          original: amount,
          formatted: formattedAmount
        });
        throw new Error('Amount cannot have more than 2 decimal places');
      }

      let bookingId = bookingData.bookingId;

      // Create booking if it doesn't exist yet
      if (!bookingId) {
        // Transform the data to match the API schema
        const pickupFlatNumber = normaliseFlatNumber(bookingData.pickupAddress);
        const dropoffFlatNumber = normaliseFlatNumber(bookingData.dropoffAddress);
        const pickupFloorNumber = normaliseFloorNumber(bookingData.pickupAddress);
        const dropoffFloorNumber = normaliseFloorNumber(bookingData.dropoffAddress);

        const bookingRequest = {
          customer: {
            name: bookingData.customer.name || '',
            email: bookingData.customer.email || '',
            phone: bookingData.customer.phone || '',
          },
          pickupAddress: {
            // Extract street from multiple possible sources
            street: bookingData.pickupAddress.street || 
                   bookingData.pickupAddress.address || 
                   bookingData.pickupAddress.formatted_address ||
                   bookingData.pickupAddress.full ||
                   bookingData.pickupAddress.line1 ||
                   '',
            city: bookingData.pickupAddress.city || 'Unknown City',
            postcode: bookingData.pickupAddress.postcode || '',
            country: 'UK',
            flatNumber: pickupFlatNumber,
            floorNumber: pickupFloorNumber,
            buildingDetails: {
              flatNumber: pickupFlatNumber,
              floorNumber: pickupFloorNumber,
              hasElevator: bookingData.pickupAddress.buildingDetails?.hasElevator,
              type: bookingData.pickupAddress.buildingDetails?.type,
            },
          },
          dropoffAddress: {
            // Extract street from multiple possible sources
            street: bookingData.dropoffAddress.street || 
                   bookingData.dropoffAddress.address || 
                   bookingData.dropoffAddress.formatted_address ||
                   bookingData.dropoffAddress.full ||
                   bookingData.dropoffAddress.line1 ||
                   '',
            city: bookingData.dropoffAddress.city || 'Unknown City',
            postcode: bookingData.dropoffAddress.postcode || '',
            country: 'UK',
            flatNumber: dropoffFlatNumber,
            floorNumber: dropoffFloorNumber,
            buildingDetails: {
              flatNumber: dropoffFlatNumber,
              floorNumber: dropoffFloorNumber,
              hasElevator: bookingData.dropoffAddress.buildingDetails?.hasElevator,
              type: bookingData.dropoffAddress.buildingDetails?.type,
            },
          },
          pickupDetails: {
            type: bookingData.pickupDetails?.type || 'house',
            floors: bookingData.pickupDetails?.floors || 0,
            hasLift: bookingData.pickupDetails?.hasLift
              ?? bookingData.pickupAddress.buildingDetails?.hasElevator
              ?? false,
            hasParking: bookingData.pickupDetails?.hasParking !== false, // Default true
            accessNotes: bookingData.pickupDetails?.accessNotes || '',
            requiresPermit: bookingData.pickupDetails?.requiresPermit || false,
            flatNumber: bookingData.pickupDetails?.flatNumber || pickupFlatNumber,
          },
          dropoffDetails: {
            type: bookingData.dropoffDetails?.type || 'house',
            floors: bookingData.dropoffDetails?.floors || 0,
            hasLift: bookingData.dropoffDetails?.hasLift
              ?? bookingData.dropoffAddress.buildingDetails?.hasElevator
              ?? false,
            hasParking: bookingData.dropoffDetails?.hasParking !== false, // Default true
            accessNotes: bookingData.dropoffDetails?.accessNotes || '',
            requiresPermit: bookingData.dropoffDetails?.requiresPermit || false,
            flatNumber: bookingData.dropoffDetails?.flatNumber || dropoffFlatNumber,
          },
          items: bookingData.items.map(item => ({
            id: item.id || `item-${Date.now()}-${Math.random()}`,
            name: item.name || 'Unknown Item',
            quantity: item.quantity || 1,
            category: item.category || 'furniture',
            volumeFactor: item.volume || 0.1,
            requiresTwoPerson: false,
            isFragile: false,
            requiresDisassembly: false,
          })),
          pickupDate: bookingData.scheduledDate ? new Date(bookingData.scheduledDate).toISOString() : undefined,
          pickupTimeSlot: bookingData.scheduledTime || 'flexible',
          urgency: 'scheduled' as const,
          notes: bookingData.notes || '',
          pricing: {
            subtotal: Math.round(getCorrectSubtotal(bookingData) * 100) / 100,
            vat: Math.round(getCorrectVAT(bookingData) * 100) / 100,
            total: Math.round(getCorrectTotal(bookingData) * 100) / 100,
            currency: 'GBP',
          },
        };

        // Validate all required fields before sending
        const requiredFields = [
          { field: 'customer.name', value: bookingRequest.customer.name },
          { field: 'customer.email', value: bookingRequest.customer.email },
          { field: 'customer.phone', value: bookingRequest.customer.phone },
          { field: 'pickupAddress.street', value: bookingRequest.pickupAddress.street },
          { field: 'dropoffAddress.street', value: bookingRequest.dropoffAddress.street },
          { field: 'items', value: bookingRequest.items.length > 0 },
          { field: 'pricing.total', value: bookingRequest.pricing.total > 0 }
        ];

        const missingFields = requiredFields.filter(field => !field.value);
        if (missingFields.length > 0) {
          const missingFieldNames = missingFields.map(f => f.field).join(', ');
          throw new Error(`Missing required fields: ${missingFieldNames}`);
        }

        console.log('🔍 Sending booking request:', {
          customer: bookingRequest.customer.name,
          pickup: bookingRequest.pickupAddress.street,
          dropoff: bookingRequest.dropoffAddress.street,
          items: bookingRequest.items.length,
          pricing: `£${bookingRequest.pricing.total}`
        });

        const bookingResponse = await fetch('/api/booking-luxury', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingRequest),
        });

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json();
          console.error('❌ Booking API error:', {
            status: bookingResponse.status,
            error: errorData.error,
            details: errorData.details,
            validationErrors: errorData.validationErrors
          });
          
          if (errorData.validationErrors && Array.isArray(errorData.validationErrors)) {
            const errorMessages = errorData.validationErrors.map((err: any) => `${err.field}: ${err.message}`).join(', ');
            throw new Error(`Validation failed: ${errorMessages}`);
          }
          
          throw new Error(errorData.error || `Failed to create booking (${bookingResponse.status})`);
        }

        const bookingResponseData = await bookingResponse.json();
        bookingId = bookingResponseData.booking.id;
      }

      const requestData = {
        amount: formattedAmount,
        currency: 'gbp',
        customerEmail: bookingData.customer.email,
        customerName: bookingData.customer.name,
        bookingData: {
          ...bookingData,
          bookingId: bookingId, // Use the booking ID
        },
        successUrl: `${window.location.origin}/booking-luxury/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/booking-luxury?step=1&payment=cancelled`,
      };
      
      // Create Stripe checkout session
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server response:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { sessionUrl, sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = sessionUrl;
      
    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Payment failed';
      onError(errorMessage);
      
      toast({
        title: 'Payment Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch" w="full">
      <Box position="relative" w="full">
        <Button
          size="xl"
          h={{ base: "64px", md: "72px" }}
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="700"
          letterSpacing="0.5px"
          w="full"
          bg="linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)"
          color="white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handlePayment();
          }}
          isDisabled={disabled || isProcessing}
          leftIcon={
            isProcessing ? (
              <Spinner size="md" color="white" thickness="3px" speed="0.8s" />
            ) : (
              <Box
                as={FaCreditCard}
                fontSize="24px"
                filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
              />
            )
          }
          borderRadius="xl"
          border="2px solid"
          borderColor="rgba(16, 185, 129, 0.5)"
          boxShadow="0 8px 32px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          _hover={{
            transform: "translateY(-4px) scale(1.02)",
            shadow: "0 12px 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
            bg: "linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)",
            borderColor: "rgba(16, 185, 129, 0.7)",
          }}
          _active={{
            transform: "translateY(-2px) scale(0.98)",
            shadow: "0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
          _disabled={{
            opacity: 0.6,
            cursor: "not-allowed",
            transform: "none",
            bg: "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",
            borderColor: "rgba(107, 114, 128, 0.5)",
            boxShadow: "none",
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%)",
            opacity: 0.6,
            zIndex: 0,
            pointerEvents: "none",
          }}
          _after={{
            content: '""',
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
            animation: !disabled && !isProcessing ? "shineAnimation 3s infinite" : "none",
            zIndex: 1,
            pointerEvents: "none",
          }}
          sx={{
            "@keyframes shineAnimation": {
              "0%": { left: "-100%" },
              "50%": { left: "100%" },
              "100%": { left: "100%" },
            },
            "& > *": {
              position: "relative",
              zIndex: 2,
            },
          }}
        >
          {isProcessing ? (
            <HStack spacing={2}>
              <Text>Processing Payment...</Text>
            </HStack>
          ) : (
            <HStack spacing={3} align="center">
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="700" letterSpacing="0.5px">
                Pay Now
              </Text>
              <Box
                as={FaLock}
                fontSize="16px"
                opacity={0.9}
                filter="drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))"
              />
            </HStack>
          )}
        </Button>
      </Box>

      {paymentStatus === 'error' && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>
              Please try again or contact support if the problem persists.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      <VStack spacing={4} align="center" pt={2}>
        <HStack justify="center" spacing={6} fontSize="sm" color="rgba(255, 255, 255, 0.7)">
          <HStack spacing={2} align="center">
            <Box
              as={FaLock}
              color="#10B981"
              fontSize="16px"
              filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))"
            />
            <Text fontWeight="600" letterSpacing="0.2px">Secure Payment</Text>
          </HStack>
          <HStack spacing={2} align="center">
            <Box
              as={FaShieldAlt}
              color="#10B981"
              fontSize="16px"
              filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.4))"
            />
            <Text fontWeight="600" letterSpacing="0.2px">Protected by Stripe</Text>
          </HStack>
        </HStack>

        <HStack spacing={4} align="center" flexWrap="wrap" justify="center">
          <Badge
            bg="linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(5, 150, 105, 0.2) 100%)"
            color="white"
            px={5}
            py={2.5}
            borderRadius="full"
            fontSize="2xs"
            fontWeight="600"
            letterSpacing="0.2px"
            border="2px solid"
            borderColor="rgba(16, 185, 129, 0.4)"
            boxShadow="0 4px 12px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          >
            🔒 Bank-level Security
          </Badge>
          <Badge
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.2) 100%)"
            color="white"
            px={5}
            py={2.5}
            borderRadius="full"
            fontSize="2xs"
            fontWeight="600"
            letterSpacing="0.2px"
            border="2px solid"
            borderColor="rgba(59, 130, 246, 0.4)"
            boxShadow="0 4px 12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          >
            ⚡ Instant Processing
          </Badge>
        </HStack>

        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" textAlign="center" maxW="400px" fontWeight="500" letterSpacing="0.2px" lineHeight="1.6">
          Your payment information is encrypted and secure. We never store your card details.
        </Text>
      </VStack>
    </VStack>
  );
}