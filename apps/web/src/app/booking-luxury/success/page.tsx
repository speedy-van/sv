'use client';

import { useEffect, useState } from 'react';
// @ts-ignore - Temporary fix for Next.js module resolution
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Card,
  CardBody,
  Divider,
  Badge,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { CheckCircleIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
// @ts-ignore - Temporary fix for Next.js module resolution
import Link from 'next/link';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';

interface BookingDetails {
  id: string;
  reference: string;
  status: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalAmount: number;
  scheduledAt: string;
}

export default function BookingSuccessPage() {
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading your booking details...');
  const searchParams = useSearchParams();
  const toast = useToast();

  const sessionId = searchParams?.get('session_id');
  const bookingRef = searchParams?.get('booking_ref');

  useEffect(() => {
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout reached - stopping loading');
      setIsLoading(false);
      setError('Request timed out. Please refresh the page.');
    }, 30000); // 30 seconds max

    const fetchBookingDetails = async (retryCount = 0) => {
      if (!sessionId) {
        setError('No session ID provided');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch session details from Stripe
        const response = await fetch(`/api/stripe/session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch booking details');
        }

        if (data && data.payment_status === 'paid') {
          // Extract booking details from session metadata
          setBookingDetails({
            id: data.client_reference_id || 'unknown',
            reference: data.metadata?.bookingReference || bookingRef || data.client_reference_id || 'SV-UNKNOWN',
            status: 'CONFIRMED',
            customer: {
              name: data.metadata?.customerName || data.customer_details?.name || 'Customer',
              email: data.metadata?.customerEmail || data.customer_details?.email || '',
              phone: data.customer_details?.phone || '',
            },
            totalAmount: data.amount_total / 100, // Convert from pence to pounds
            scheduledAt: new Date().toISOString(), // Default to now if not available
          });

          // Show success toast
          toast({
            title: 'Payment Successful!',
            description: 'Your booking has been confirmed! Our admin team will review your order and send confirmation details.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Send SMS confirmation automatically when success page loads
          if (data.customer_details?.phone) {
            try {
              const voodooSMS = getVoodooSMSService();
              const smsResult = await voodooSMS.sendBookingConfirmation({
                phoneNumber: data.customer_details.phone,
                customerName: data.metadata?.customerName || data.customer_details?.name || 'Customer',
                orderNumber: data.metadata?.bookingReference || bookingRef || data.client_reference_id || 'SV-UNKNOWN',
                pickupAddress: data.metadata?.pickupAddress || 'Pickup address not available',
                dropoffAddress: data.metadata?.dropoffAddress || 'Dropoff address not available',
                scheduledDate: data.metadata?.scheduledDate || new Date().toLocaleDateString('en-GB'),
                driverName: data.metadata?.driverName,
                driverPhone: data.metadata?.driverPhone,
              });
              
              if (smsResult.success) {
                // SMS sent successfully
              } else {
                console.warn('⚠️ SMS confirmation failed from success page:', smsResult.error);
              }
            } catch (smsError) {
              console.error('❌ Error sending SMS from success page:', smsError);
            }
          } else {
            // No phone number available for SMS
          }
          
          // Stop loading on success
          clearTimeout(safetyTimeout);
          setIsLoading(false);
        } else {
          // Handle different payment statuses with retry logic
          if (data?.payment_status === 'unpaid' && retryCount < 3) {
            setLoadingMessage(`Payment processing... Checking status (${retryCount + 1}/3)`);
            setTimeout(() => fetchBookingDetails(retryCount + 1), 2000);
            return; // Don't set loading to false here
          } else if (data?.payment_status === 'unpaid') {
            // Final attempt failed - stop loading
            clearTimeout(safetyTimeout);
            setIsLoading(false);
            throw new Error('Payment is still pending after multiple attempts. Please refresh the page or contact support.');
          } else if (data?.payment_status === 'no_payment_required') {
            throw new Error('No payment was required for this session.');
          } else {
            throw new Error(`Payment not completed. Status: ${data?.payment_status || 'unknown'}`);
          }
        }
      } catch (err) {
        console.error('Error fetching booking details:', err);
        
        // Retry on network errors (but not on payment status errors)
        if (retryCount < 2 && err instanceof Error && !err.message.includes('Payment')) {
          setLoadingMessage(`Connection error... Retrying (${retryCount + 1}/2)`);
          setTimeout(() => fetchBookingDetails(retryCount + 1), 3000);
          return; // Don't set loading to false here
        }
        
        // Final failure - stop loading and show error
        clearTimeout(safetyTimeout);
        setError(err instanceof Error ? err.message : 'Failed to load booking details');
        setIsLoading(false);
      }
    };

    fetchBookingDetails();
    
    // Cleanup function to clear timeout on unmount
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, [sessionId, bookingRef, toast]);

  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Spinner size="xl" color="green.500" />
          <Text fontSize="lg">{loadingMessage}</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Unable to load booking details</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Box>
        </Alert>
        <Box mt={6} textAlign="center">
          <Button as={Link} href="/" colorScheme="blue">
            Return Home
          </Button>
        </Box>
      </Container>
    );
  }

  if (!bookingDetails) {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>No booking details found</AlertTitle>
            <AlertDescription>
              Your payment may still be processing. Please check your email for confirmation.
            </AlertDescription>
          </Box>
        </Alert>
        <Box mt={6} textAlign="center">
          <Button as={Link} href="/" colorScheme="blue">
            Return Home
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        {/* Success Header */}
        <VStack spacing={{ base: 3, md: 4 }} textAlign="center">
          <Icon as={CheckCircleIcon} w={{ base: 12, md: 16 }} h={{ base: 12, md: 16 }} color="green.500" />
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="green.600">
            Booking Confirmed!
          </Text>
          <Text fontSize={{ base: "md", md: "lg" }} color="gray.600">
            Thank you for choosing Speedy Van. Your booking has been successfully confirmed.
          </Text>
        </VStack>

        {/* Booking Details Card */}
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold">
                  Booking Details
                </Text>
                <Badge colorScheme="green" fontSize={{ base: "xs", md: "sm" }} px={{ base: 2, md: 3 }} py={{ base: 1, md: 1 }} borderRadius="full">
                  CONFIRMED
                </Badge>
              </HStack>
              
              <Divider />
              
              <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>Booking Reference:</Text>
                  <Text fontWeight="semibold" fontFamily="mono" fontSize={{ base: "sm", md: "md" }}>
                    {bookingDetails.reference}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>Customer Name:</Text>
                  <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>{bookingDetails.customer.name}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>Total Amount:</Text>
                  <Text fontWeight="semibold" fontSize={{ base: "md", md: "lg" }} color="green.600">
                    £{bookingDetails.totalAmount.toFixed(2)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>Status:</Text>
                  <Badge colorScheme="green" size={{ base: "sm", md: "md" }}>Confirmed</Badge>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">
                What happens next?
              </Text>
              
              <VStack spacing={{ base: 2, md: 3 }} align="stretch">
                <HStack>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" mt={2} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    <strong>Admin Review:</strong> Our team will review your booking and send detailed confirmation with floor information.
                  </Text>
                </HStack>
                
                <HStack>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" mt={2} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    <strong>Driver Assignment:</strong> We'll assign a driver to your booking and notify you with their details.
                  </Text>
                </HStack>
                
                <HStack>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" mt={2} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    <strong>Pre-Move Contact:</strong> Your driver will contact you 30 minutes before arrival.
                  </Text>
                </HStack>
                
                <HStack>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" mt={2} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    <strong>Real-time Tracking:</strong> Track your driver's location in real-time on the day of your move.
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardBody>
            <VStack spacing={{ base: 3, md: 4 }} align="stretch">
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">
                Need help or have questions?
              </Text>
              
              <VStack spacing={{ base: 2, md: 3 }}>
                <HStack spacing={4}>
                  <Icon as={PhoneIcon} color="blue.500" />
                  <VStack spacing={0} align="start">
                    <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>Call us</Text>
                    <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>07901846297</Text>
                  </VStack>
                </HStack>
                
                <HStack spacing={4}>
                  <Icon as={EmailIcon} color="blue.500" />
                  <VStack spacing={0} align="start">
                    <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }}>Email us</Text>
                    <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>support@speedy-van.co.uk</Text>
                  </VStack>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <HStack spacing={{ base: 3, md: 4 }} justify="center" wrap="wrap">
          <Button as={Link} href="/" size={{ base: "md", md: "lg" }} variant="outline">
            Return Home
          </Button>
          <Button 
            as={Link} 
            href={`/track?ref=${bookingDetails.reference}`}
            size={{ base: "md", md: "lg" }} 
            colorScheme="green"
            leftIcon={<Icon as={CheckCircleIcon} />}
          >
            Track Your Order
          </Button>
          <Button 
            as="a"
            href={`/api/booking-luxury/invoice/${bookingDetails.reference}`}
            target="_blank"
            size={{ base: "md", md: "lg" }} 
            colorScheme="purple"
            leftIcon={<Icon as={EmailIcon} />}
          >
            Download Invoice
          </Button>
          <Button 
            as={Link} 
            href="/customer" 
            size={{ base: "md", md: "lg" }} 
            colorScheme="blue"
          >
            View My Bookings
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}
