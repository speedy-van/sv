'use client';

import { useEffect, useRef, useState } from 'react';
// @ts-ignore - Temporary fix for Next.js module resolution
import { useSearchParams } from 'next/navigation';
import {
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
  safeLocalStorageRemoveItem,
} from '@/lib/safe-storage';
import { getTrustpilotConfig, loadTrustpilotWidget } from '@/lib/trustpilot-config';
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
  const bookingRef = searchParams?.get('booking_ref');  // Generate unique key for SMS tracking (per session)
  const smsTrackingKey = sessionId ? `sms_sent_${sessionId}` : null;

  const hasTrackedInitialConversion = useRef(false);

  // Track page view for Google Ads (only once per page load)
  useEffect(() => {
    if (hasTrackedInitialConversion.current) {
      return;
    }

    if (typeof window === 'undefined' || !(window as any).gtag) {
      return;
    }

    const transactionId = sessionId || bookingRef || '';

    // Track page view
    (window as any).gtag('event', 'page_view', {
      page_title: 'Booking Success',
      page_location: window.location.href,
      page_path: window.location.pathname,
    });

    hasTrackedInitialConversion.current = true;

    console.log('âœ… Google Ads page view tracked:', {
      page: 'Booking Success',
      transaction_id: transactionId,
    });
  }, [sessionId, bookingRef]);

  // Load Trustpilot script using centralized configuration
  useEffect(() => {
    const config = getTrustpilotConfig();
    
    // Only load if Business Unit ID is configured and valid
    if (!config.businessUnitId || config.businessUnitId.length < 10) {
      // Silently skip if not configured (optional feature)
      return;
    }

    // Use centralized script loading helper
    const cleanup = loadTrustpilotWidget(config.businessUnitId);
    
    return cleanup;
  }, []);

  useEffect(() => {
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn('âš ï¸ Safety timeout reached - stopping loading');
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

          // Show success toast (only once per session)
          const toastTrackingKey = sessionId ? `toast_shown_${sessionId}` : null;
          const alreadyShowedToast = toastTrackingKey ? safeLocalStorageGetItem(toastTrackingKey) : null;
          
          if (!toastShown && !alreadyShowedToast) {
            setToastShown(true);
            safeLocalStorageSetItem(toastTrackingKey || '', 'true');
            toast({
              title: 'Booking Confirmed!',
              description:
                "Your Speedy Van booking has been confirmed. We'll notify you once your driver is assigned.",
              status: 'success',
              duration: 5000,
              isClosable: true,
            });
          }

          // Update booking with payment intent (in case webhook didn't fire in test mode)
          try {
            const bookingId = data.client_reference_id || data.metadata?.bookingId;
            if (bookingId && data.payment_intent) {
              const updateResponse = await fetch(`/api/booking-luxury/${bookingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  stripePaymentIntentId: data.payment_intent,
                  status: 'CONFIRMED',
                  paidAt: new Date().toISOString()
                })
              });

              if (updateResponse.ok) {
                const result = await updateResponse.json();
                console.log('✅ Booking updated successfully:', result);
              } else {
                const errorText = await updateResponse.text();
                console.error('❌ Failed to update booking. Status:', updateResponse.status, 'Response:', errorText);
              }
            }
          } catch (updateError) {
            console.error('âŒ Error updating booking:', updateError);
          }

          // Send confirmation email as backup (in case webhook didn't fire)
          try {
            const emailResponse = await fetch('/api/booking-luxury/send-confirmation-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });

            if (emailResponse.ok) {
              console.log('âœ… Confirmation email sent successfully from success page');
            } else {
              console.warn('âš ï¸ Confirmation email failed from success page');
            }
          } catch (emailError) {
            console.error('âŒ Error sending confirmation email from success page:', emailError);
          }

          // Send SMS confirmation automatically when success page loads (only once per session)
          if (data.customer_details?.phone && smsTrackingKey) {
            // Check if SMS was already sent (using safe localStorage + state)
            const alreadySentInStorage = safeLocalStorageGetItem(smsTrackingKey);
            
            if (!smsSent && !alreadySentInStorage) {
              try {
                // Mark as sent BEFORE making the request to prevent race conditions
                setSmsSent(true);
                safeLocalStorageSetItem(smsTrackingKey, 'true');
              
              // Send SMS via API endpoint
              const smsResponse = await fetch('/api/notifications/sms/send', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  to: data.customer_details.phone,
                    message: `Your Speedy Van booking ${data.metadata?.bookingReference || bookingRef || data.client_reference_id || 'SV-UNKNOWN'} has been confirmed. We'll notify you once your driver is assigned.\n\nTrack your booking: https://speedy-van.co.uk/track\n\nFor assistance, call 01202 129746 or email support@speedy-van.co.uk`,
                  type: 'booking_confirmation'
                })
              });
              
              if (smsResponse.ok) {
                  // SMS sent successfully
                  if (process.env.NODE_ENV === 'development') {
                console.log('âœ… SMS confirmation sent successfully');
                  }
              } else {
                console.warn('âš ï¸ SMS confirmation failed from success page');
                  // Remove flag to allow retry on failure
                  setSmsSent(false);
                  safeLocalStorageRemoveItem(smsTrackingKey);
              }
            } catch (smsError) {
              console.error('âŒ Error sending SMS from success page:', smsError);
                // Remove flag to allow retry on error
                setSmsSent(false);
                safeLocalStorageRemoveItem(smsTrackingKey);
              }
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('â„¹ï¸ SMS already sent for this session - preventing duplicate');
              }
            }
          } else if (!data.customer_details?.phone) {
            if (process.env.NODE_ENV === 'development') {
            console.log('â„¹ï¸ No phone number available for SMS');
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
                    Â£{bookingDetails.totalAmount.toFixed(2)}
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
                    <strong>Need Help?</strong> Call 01202 129746 or email support@speedy-van.co.uk for assistance.
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
                    <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>01202 129746</Text>
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

        {/* Enhanced Trustpilot Review Section */}
        {(() => {
          const config = getTrustpilotConfig();
          return config.isConfigured ? (
            <Box
              mt={8}
              p={8}
              bg="linear-gradient(135deg, rgba(0, 194, 255, 0.03) 0%, rgba(59, 130, 246, 0.05) 100%)"
              borderRadius="2xl"
              border="2px solid"
              borderColor="rgba(0, 194, 255, 0.2)"
              textAlign="center"
              boxShadow="0 4px 20px rgba(0, 194, 255, 0.1)"
              transition="all 0.3s ease"
              _hover={{
                boxShadow: '0 8px 30px rgba(0, 194, 255, 0.2)',
                borderColor: 'rgba(0, 194, 255, 0.4)',
                transform: 'translateY(-2px)',
              }}
            >
              <VStack spacing={6}>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800" mb={2}>
                    ⭐ Share Your Experience
                  </Text>
                  <Text fontSize="md" color="gray.600">
                    Your feedback helps us serve you better
                  </Text>
                </Box>

                {/* Trustpilot Widget - Official TrustBox snippet with all required attributes */}
                <Box
                  className="trustpilot-widget"
                  data-locale={config.locale}
                  data-template-id={config.templateId}
                  data-businessunit-id={config.businessUnitId}
                  data-style-height="52px"
                  data-style-width="100%"
                  data-token={config.token}
                  maxW="500px"
                  mx="auto"
                  sx={{
                    '& a': {
                      textDecoration: 'none',
                      color: '#00C2FF',
                      fontWeight: '600',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#3B82F6',
                      }
                    },
                    '& .trustpilot-widget': {
                      display: 'inline-block',
                    },
                    '& iframe': {
                      borderRadius: '12px',
                    }
                  }}
                >
                  <a
                    href="https://www.trustpilot.com/review/speedy-van.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trustpilot
                  </a>
                </Box>

                <Box
                  as="a"
                  href="https://www.trustpilot.com/review/speedy-van.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                  px={8}
                  py={4}
                  bg="linear-gradient(135deg, #00C2FF 0%, #3B82F6 100%)"
                  color="white"
                  fontWeight="bold"
                  fontSize="md"
                  borderRadius="full"
                  textDecoration="none"
                  transition="all 0.3s ease"
                  boxShadow="0 4px 15px rgba(0, 194, 255, 0.3)"
                  _hover={{
                    transform: 'translateY(-2px) scale(1.02)',
                    boxShadow: '0 8px 25px rgba(0, 194, 255, 0.5)',
                  }}
                  _active={{
                    transform: 'translateY(0) scale(0.98)',
                  }}
                >
                  Write a Review
                </Box>
              </VStack>
            </Box>
          ) : null;
        })()}
      </VStack>
    </Container>
  );
}
