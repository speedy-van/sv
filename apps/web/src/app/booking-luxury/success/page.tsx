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
// SMS will be sent via API endpoint

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
  const [smsSent, setSmsSent] = useState(false);
  const [toastShown, setToastShown] = useState(false);
  const searchParams = useSearchParams();
  const toast = useToast();

  const sessionId = searchParams?.get('session_id');
  const bookingRef = searchParams?.get('booking_ref');
  
  // Safe localStorage helper (handles tracking prevention)
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Silently fail if localStorage is blocked
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Silently fail
      }
    }
  };
  
  // Generate unique key for SMS tracking (per session)
  const smsTrackingKey = sessionId ? `sms_sent_${sessionId}` : null;

  // Track page view for Google Ads
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'page_view', {
        page_title: 'Booking Success',
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  }, []);

  // Load Trustpilot script
  useEffect(() => {
    // Clean and validate Business Unit ID (remove newlines and whitespace)
    const rawBusinessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID;
    const businessUnitId = rawBusinessUnitId?.trim().replace(/[\r\n]/g, '');

    // Only load if Business Unit ID is configured and valid
    if (!businessUnitId || businessUnitId.length < 10) {
      // Silently skip if not configured (optional feature)
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src*="trustpilot.com/bootstrap"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Trustpilot widget script loaded successfully');
    };
    script.onerror = () => {
      console.warn('⚠️ Failed to load Trustpilot widget script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup - remove script on unmount
      const existingScript = document.querySelector('script[src*="trustpilot.com/bootstrap"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

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
          const bookingAmount = data.amount_total / 100; // Convert from pence to pounds
          
          setBookingDetails({
            id: data.client_reference_id || 'unknown',
            reference: data.metadata?.bookingReference || bookingRef || data.client_reference_id || 'SV-UNKNOWN',
            status: 'CONFIRMED',
            customer: {
              name: data.metadata?.customerName || data.customer_details?.name || 'Customer',
              email: data.metadata?.customerEmail || data.customer_details?.email || '',
              phone: data.customer_details?.phone || '',
            },
            totalAmount: bookingAmount,
            scheduledAt: new Date().toISOString(), // Default to now if not available
          });

          // Track Google Ads conversion
          // NOTE: If you need a specific conversion label, update 'send_to' to:
          // 'AW-17715630822/YOUR_CONVERSION_LABEL'
          if (typeof window !== 'undefined' && (window as any).gtag) {
            try {
              (window as any).gtag('event', 'conversion', {
                'send_to': 'AW-17715630822',
                'value': bookingAmount,
                'currency': 'GBP',
                'transaction_id': data.metadata?.bookingReference || sessionId
              });
              console.log('✅ Google Ads conversion tracked:', {
                value: bookingAmount,
                currency: 'GBP',
                bookingRef: data.metadata?.bookingReference,
                transactionId: sessionId
              });
            } catch (gtagError) {
              console.error('❌ Google Ads conversion tracking failed:', gtagError);
            }
          }

          // Show success toast (only once per session)
          const toastTrackingKey = sessionId ? `toast_shown_${sessionId}` : null;
          const alreadyShowedToast = toastTrackingKey ? safeLocalStorage.getItem(toastTrackingKey) : null;
          
          if (!toastShown && !alreadyShowedToast) {
            setToastShown(true);
            safeLocalStorage.setItem(toastTrackingKey || '', 'true');
            toast({
              title: 'Booking Confirmed!',
              description: "Your Speedy Van booking has been confirmed. We'll notify you once your driver is assigned.",
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          }

          // Send SMS confirmation automatically when success page loads (only once per session)
          if (data.customer_details?.phone && smsTrackingKey) {
            // Check if SMS was already sent (using safe localStorage + state)
            const alreadySentInStorage = safeLocalStorage.getItem(smsTrackingKey);
            
            if (!smsSent && !alreadySentInStorage) {
              try {
                // Mark as sent BEFORE making the request to prevent race conditions
                setSmsSent(true);
                safeLocalStorage.setItem(smsTrackingKey, 'true');
                
                // Send SMS via API endpoint
                const smsResponse = await fetch('/api/notifications/sms/send', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    to: data.customer_details.phone,
                    message: `Your Speedy Van booking ${data.metadata?.bookingReference || bookingRef || data.client_reference_id || 'SV-UNKNOWN'} has been confirmed. We'll notify you once your driver is assigned.\n\nTrack your booking: https://speedy-van.co.uk/track\n\nFor assistance, call 01202129764 or email support@speedy-van.co.uk`,
                    type: 'booking_confirmation'
                  })
                });
                
                if (smsResponse.ok) {
                  // SMS sent successfully
                  if (process.env.NODE_ENV === 'development') {
                    console.log('✅ SMS confirmation sent successfully');
                  }
                } else {
                  console.warn('⚠️ SMS confirmation failed from success page');
                  // Remove flag to allow retry on failure
                  setSmsSent(false);
                  safeLocalStorage.removeItem(smsTrackingKey);
                }
              } catch (smsError) {
                console.error('❌ Error sending SMS from success page:', smsError);
                // Remove flag to allow retry on error
                setSmsSent(false);
                safeLocalStorage.removeItem(smsTrackingKey);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('ℹ️ SMS already sent for this session - preventing duplicate');
              }
            }
          } else if (!data.customer_details?.phone) {
            if (process.env.NODE_ENV === 'development') {
              console.log('ℹ️ No phone number available for SMS');
            }
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
            Your Speedy Van booking has been confirmed. We'll notify you once your driver is assigned.
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
                    <strong>Driver Assignment:</strong> We'll notify you once your driver is assigned with their contact details.
                  </Text>
                </HStack>
                
                <HStack>
                  <Box w={2} h={2} bg="blue.500" borderRadius="full" mt={2} />
                  <Text fontSize={{ base: "sm", md: "md" }}>
                    <strong>Track Your Booking:</strong> Monitor your booking status at <a href="https://speedy-van.co.uk/track" style={{ color: '#3182ce', textDecoration: 'underline' }}>https://speedy-van.co.uk/track</a>
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
                    <strong>Need Help?</strong> Call 01202129764 or email support@speedy-van.co.uk for assistance.
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
                    <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>01202129764</Text>
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

        {/* Trustpilot Review Widget */}
        {process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID?.trim() && (
          <Box
            mt={8}
            p={6}
            bg="gray.50"
            borderRadius="lg"
            border="1px solid"
            borderColor="gray.200"
            textAlign="center"
          >
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="semibold" color="gray.700">
                How was your booking experience?
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Help us improve by leaving a review
              </Text>

              {/* Trustpilot Micro Review Count Widget */}
              <Box
                className="trustpilot-widget"
                data-locale="en-GB"
                data-template-id="56278e9abfbbba0bdcd568bc"
                data-businessunit-id={process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID?.trim().replace(/[\r\n]/g, '')}
                data-style-height="52px"
                data-style-width="100%"
                data-theme="light"
                sx={{
                  '& a': {
                    textDecoration: 'none',
                    color: 'inherit',
                  },
                  '& .trustpilot-widget': {
                    display: 'inline-block',
                  }
                }}
              >
                <a
                  href="https://uk.trustpilot.com/review/speedy-van.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Trustpilot
                </a>
              </Box>
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
}
