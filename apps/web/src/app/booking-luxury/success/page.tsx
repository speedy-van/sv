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
  SimpleGrid,
} from '@chakra-ui/react';
import { CheckCircleIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
// @ts-ignore - Temporary fix for Next.js module resolution
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
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
                "🎉 Your premium Speedy Van booking is confirmed! You'll receive instant notifications via SMS and email when your driver is assigned and on their way.",
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
    <Box 
      minH="100vh" 
      bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 50%, rgba(15, 23, 42, 0.98) 100%)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgGradient: 'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.15), transparent 50%), radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15), transparent 50%)',
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none',
      }}
    >
      <Box position="relative" zIndex={100}>
        <Header />
        <MobileHeader />
      </Box>
      <Container maxW="container.lg" py={{ base: 6, md: 12 }} position="relative" zIndex={1}>
        <VStack spacing={{ base: 6, md: 10 }} align="stretch">
          {/* Success Header - Enhanced */}
          <VStack 
            spacing={{ base: 4, md: 6 }} 
            textAlign="center"
            position="relative"
            py={{ base: 6, md: 8 }}
            pt={{ base: 24, md: 32 }}
          >
            <Box
              position="relative"
              animation="successPulse 2s ease-in-out infinite"
              sx={{
                '@keyframes successPulse': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                }
              }}
            >
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                w={{ base: 24, md: 32 }}
                h={{ base: 24, md: 32 }}
                bg="radial-gradient(circle, rgba(34, 197, 94, 0.3), transparent 70%)"
                borderRadius="full"
                animation="ripple 2s ease-out infinite"
                sx={{
                  '@keyframes ripple': {
                    '0%': { opacity: 1, transform: 'translate(-50%, -50%) scale(0.5)' },
                    '100%': { opacity: 0, transform: 'translate(-50%, -50%) scale(2)' },
                  }
                }}
              />
              <Icon 
                as={CheckCircleIcon} 
                w={{ base: 16, md: 20 }} 
                h={{ base: 16, md: 20 }} 
                color="green.400"
                filter="drop-shadow(0 0 20px rgba(34, 197, 94, 0.6))"
              />
            </Box>
            
            <VStack spacing={3}>
              <Text 
                fontSize={{ base: "3xl", md: "5xl" }} 
                fontWeight="900" 
                bgGradient="linear(to-r, green.300, emerald.400)"
                bgClip="text"
                letterSpacing="tight"
              >
                Booking Confirmed!
              </Text>
              <Text 
                fontSize={{ base: "md", md: "xl" }} 
                color="whiteAlpha.800"
                maxW="2xl"
                lineHeight="tall"
              >
                🎉 Your premium Speedy Van booking is confirmed! You'll receive instant notifications via SMS and email when your driver is assigned and on their way.
              </Text>
            </VStack>
          </VStack>

          {/* Booking Details Card - Premium Design */}
          <Card
            bg="linear-gradient(135deg, rgba(26, 32, 44, 0.95) 0%, rgba(45, 55, 72, 0.9) 100%)"
            border="2px solid"
            borderColor="rgba(34, 197, 94, 0.3)"
            borderRadius="2xl"
            backdropFilter="blur(20px)"
            boxShadow="0 25px 60px rgba(0,0,0,0.5), 0 0 80px rgba(34, 197, 94, 0.15)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgGradient: 'linear(to-r, green.400, emerald.500, teal.400)',
            }}
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={{ base: 5, md: 6 }} align="stretch">
                <HStack justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Box
                      w="10px"
                      h="10px"
                      bg="green.400"
                      borderRadius="full"
                      boxShadow="0 0 20px rgba(34, 197, 94, 0.8)"
                      animation="blink 2s ease-in-out infinite"
                      sx={{
                        '@keyframes blink': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.3 },
                        }
                      }}
                    />
                    <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="white">
                      Booking Details
                    </Text>
                  </HStack>
                  <Badge 
                    colorScheme="green" 
                    fontSize={{ base: "xs", md: "sm" }} 
                    px={{ base: 3, md: 4 }} 
                    py={{ base: 1, md: 2 }} 
                    borderRadius="full"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    ✓ CONFIRMED
                  </Badge>
                </HStack>
                
                <Divider borderColor="whiteAlpha.200" />
                
                <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                  <HStack 
                    justify="space-between" 
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    transition="all 0.3s"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <Text color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} fontWeight="medium">Booking Reference:</Text>
                    <Text 
                      fontWeight="bold" 
                      fontFamily="mono" 
                      fontSize={{ base: "md", md: "lg" }}
                      color="green.300"
                      letterSpacing="wider"
                    >
                      {bookingDetails.reference}
                    </Text>
                  </HStack>
                  
                  <HStack 
                    justify="space-between"
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    transition="all 0.3s"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <Text color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} fontWeight="medium">Customer Name:</Text>
                    <Text fontWeight="semibold" fontSize={{ base: "sm", md: "md" }} color="white">{bookingDetails.customer.name}</Text>
                  </HStack>
                  
                  <HStack 
                    justify="space-between"
                    p={4}
                    bg="linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))"
                    border="2px solid"
                    borderColor="rgba(34, 197, 94, 0.3)"
                    borderRadius="xl"
                    transition="all 0.3s"
                    _hover={{ 
                      bg: "linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15))",
                      borderColor: "rgba(34, 197, 94, 0.5)"
                    }}
                  >
                    <Text color="white" fontSize={{ base: "sm", md: "md" }} fontWeight="medium">Total Amount:</Text>
                    <Text 
                      fontWeight="bold" 
                      fontSize={{ base: "xl", md: "2xl" }}
                      color="white"
                    >
                      £{bookingDetails.totalAmount.toFixed(2)}
                    </Text>
                  </HStack>
                  
                  <HStack 
                    justify="space-between"
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    transition="all 0.3s"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    <Text color="whiteAlpha.800" fontSize={{ base: "sm", md: "md" }} fontWeight="medium">Status:</Text>
                    <Badge 
                      colorScheme="green" 
                      size={{ base: "md", md: "lg" }}
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize={{ base: "xs", md: "sm" }}
                    >
                      ✓ Confirmed
                    </Badge>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Next Steps - Enhanced */}
          <Card
            bg="linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(45, 55, 72, 0.9))"
            border="2px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
            borderRadius="2xl"
            backdropFilter="blur(20px)"
            boxShadow="0 20px 50px rgba(59, 130, 246, 0.15)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgGradient: 'linear(to-r, blue.400, cyan.400, teal.400)',
            }}
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={{ base: 5, md: 6 }} align="stretch">
                <HStack spacing={3}>
                  <Box
                    w={3}
                    h={3}
                    bg="blue.400"
                    borderRadius="full"
                    boxShadow="0 0 15px rgba(59, 130, 246, 0.8)"
                  />
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="white">
                    What happens next?
                  </Text>
                </HStack>
                
                <VStack spacing={{ base: 4, md: 5 }} align="stretch">
                  <HStack 
                    align="start" 
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    borderLeft="4px solid"
                    borderColor="blue.400"
                    transition="all 0.3s"
                    _hover={{ 
                      bg: "whiteAlpha.100",
                      transform: "translateX(4px)"
                    }}
                  >
                    <Box
                      minW={10}
                      h={10}
                      bg="linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.2))"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor="blue.400"
                    >
                      <Text fontSize="xl" fontWeight="bold" color="blue.300">1</Text>
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="blue.300">
                        Driver Assignment
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.800">
                        We'll notify you once your driver is assigned with their contact details.
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack 
                    align="start"
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    borderLeft="4px solid"
                    borderColor="cyan.400"
                    transition="all 0.3s"
                    _hover={{ 
                      bg: "whiteAlpha.100",
                      transform: "translateX(4px)"
                    }}
                  >
                    <Box
                      minW={10}
                      h={10}
                      bg="linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(103, 232, 249, 0.2))"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor="cyan.400"
                    >
                      <Text fontSize="xl" fontWeight="bold" color="cyan.300">2</Text>
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="cyan.300">
                        Track Your Booking
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.800">
                        Monitor your booking status at{' '}
                        <Text 
                          as="a" 
                          href="https://speedy-van.co.uk/track" 
                          color="cyan.300"
                          fontWeight="semibold"
                          textDecoration="underline"
                          _hover={{ color: "cyan.200" }}
                        >
                          speedy-van.co.uk/track
                        </Text>
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack 
                    align="start"
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    borderLeft="4px solid"
                    borderColor="teal.400"
                    transition="all 0.3s"
                    _hover={{ 
                      bg: "whiteAlpha.100",
                      transform: "translateX(4px)"
                    }}
                  >
                    <Box
                      minW={10}
                      h={10}
                      bg="linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(94, 234, 212, 0.2))"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor="teal.400"
                    >
                      <Text fontSize="xl" fontWeight="bold" color="teal.300">3</Text>
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="teal.300">
                        Pre-Move Contact
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.800">
                        Your driver will contact you 30 minutes before arrival.
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <HStack 
                    align="start"
                    p={4}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    borderLeft="4px solid"
                    borderColor="purple.400"
                    transition="all 0.3s"
                    _hover={{ 
                      bg: "whiteAlpha.100",
                      transform: "translateX(4px)"
                    }}
                  >
                    <Box
                      minW={10}
                      h={10}
                      bg="linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(192, 132, 252, 0.2))"
                      borderRadius="lg"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      border="2px solid"
                      borderColor="purple.400"
                    >
                      <Text fontSize="xl" fontWeight="bold" color="purple.300">?</Text>
                    </Box>
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontSize={{ base: "sm", md: "md" }} fontWeight="bold" color="purple.300">
                        Need Help?
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="whiteAlpha.800">
                        Call <Text as="span" fontWeight="bold" color="purple.300">01202 129746</Text> or email{' '}
                        <Text as="span" fontWeight="bold" color="purple.300">support@speedy-van.co.uk</Text> for assistance.
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Contact Information - Premium */}
          <Card
            bg="linear-gradient(135deg, rgba(45, 55, 72, 0.95), rgba(26, 32, 44, 0.9))"
            border="2px solid"
            borderColor="rgba(236, 72, 153, 0.3)"
            borderRadius="2xl"
            backdropFilter="blur(20px)"
            boxShadow="0 20px 50px rgba(236, 72, 153, 0.15)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgGradient: 'linear(to-r, pink.400, purple.400, fuchsia.400)',
            }}
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={{ base: 5, md: 6 }} align="stretch">
                <HStack spacing={3}>
                  <Box
                    w={3}
                    h={3}
                    bg="pink.400"
                    borderRadius="full"
                    boxShadow="0 0 15px rgba(236, 72, 153, 0.8)"
                  />
                  <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="white">
                    Need help or have questions?
                  </Text>
                </HStack>
                
                <VStack spacing={{ base: 3, md: 4 }} w="full">
                  <HStack 
                    spacing={4}
                    p={5}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="whiteAlpha.100"
                    transition="all 0.3s"
                    w="full"
                    _hover={{
                      bg: "whiteAlpha.100",
                      borderColor: "pink.400",
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 30px rgba(236, 72, 153, 0.2)"
                    }}
                  >
                    <Box
                      p={3}
                      bg="linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.2))"
                      borderRadius="lg"
                      border="2px solid"
                      borderColor="pink.400"
                    >
                      <Icon as={PhoneIcon} color="pink.300" boxSize={6} />
                    </Box>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color="white">Call us</Text>
                      <Text color="pink.300" fontSize={{ base: "md", md: "lg" }} fontWeight="semibold">01202 129746</Text>
                    </VStack>
                  </HStack>
                  
                  <HStack 
                    spacing={4}
                    p={5}
                    bg="whiteAlpha.50"
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="whiteAlpha.100"
                    transition="all 0.3s"
                    w="full"
                    _hover={{
                      bg: "whiteAlpha.100",
                      borderColor: "purple.400",
                      transform: "translateY(-4px)",
                      boxShadow: "0 10px 30px rgba(168, 85, 247, 0.2)"
                    }}
                  >
                    <Box
                      p={3}
                      bg="linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(147, 51, 234, 0.2))"
                      borderRadius="lg"
                      border="2px solid"
                      borderColor="purple.400"
                    >
                      <Icon as={EmailIcon} color="purple.300" boxSize={6} />
                    </Box>
                    <VStack spacing={1} align="start" flex={1}>
                      <Text fontWeight="bold" fontSize={{ base: "sm", md: "md" }} color="white">Email us</Text>
                      <Text color="purple.300" fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">support@speedy-van.co.uk</Text>
                    </VStack>
                  </HStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Action Buttons - Enhanced */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 3, md: 4 }} w="full">
            <Button 
              as={Link} 
              href="/" 
              size="lg"
              h="60px"
              bg="whiteAlpha.100"
              color="white"
              border="2px solid"
              borderColor="whiteAlpha.200"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="md"
              transition="all 0.3s"
              _hover={{ 
                bg: "whiteAlpha.200",
                borderColor: "whiteAlpha.400",
                transform: "translateY(-2px)",
                boxShadow: "0 10px 30px rgba(255, 255, 255, 0.1)"
              }}
            >
              Return Home
            </Button>
            
            <Button 
              as={Link} 
              href={`/track?ref=${bookingDetails.reference}`}
              size="lg"
              h="60px"
              bgGradient="linear(to-r, green.400, emerald.500)"
              color="white"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="md"
              leftIcon={<Icon as={CheckCircleIcon} />}
              boxShadow="0 10px 30px rgba(34, 197, 94, 0.3)"
              transition="all 0.3s"
              _hover={{ 
                bgGradient: "linear(to-r, green.500, emerald.600)",
                transform: "translateY(-2px)",
                boxShadow: "0 15px 40px rgba(34, 197, 94, 0.5)"
              }}
              _active={{
                transform: "translateY(0)",
              }}
            >
              Track Your Order
            </Button>
            
            <Button 
              as="a"
              href={`/api/booking-luxury/invoice/${bookingDetails.reference}`}
              target="_blank"
              size="lg"
              h="60px"
              bgGradient="linear(to-r, purple.400, fuchsia.500)"
              color="white"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="md"
              leftIcon={<Icon as={EmailIcon} />}
              boxShadow="0 10px 30px rgba(168, 85, 247, 0.3)"
              transition="all 0.3s"
              _hover={{ 
                bgGradient: "linear(to-r, purple.500, fuchsia.600)",
                transform: "translateY(-2px)",
                boxShadow: "0 15px 40px rgba(168, 85, 247, 0.5)"
              }}
              _active={{
                transform: "translateY(0)",
              }}
            >
              Download Invoice
            </Button>
            
            <Button
              as={Link}
              href="/customer"
              size="lg"
              h="60px"
              bgGradient="linear(to-r, blue.400, cyan.500)"
              color="white"
              borderRadius="xl"
              fontWeight="bold"
              fontSize="md"
              boxShadow="0 10px 30px rgba(59, 130, 246, 0.3)"
              transition="all 0.3s"
              _hover={{ 
                bgGradient: "linear(to-r, blue.500, cyan.600)",
                transform: "translateY(-2px)",
                boxShadow: "0 15px 40px rgba(59, 130, 246, 0.5)"
              }}
              _active={{
                transform: "translateY(0)",
              }}
            >
              View My Bookings
            </Button>
          </SimpleGrid>

        {/* Enhanced Trustpilot Review Section */}
        {(() => {
          const config = getTrustpilotConfig();
          return config.isConfigured ? (
            <Box
              mt={6}
              p={{ base: 6, md: 10 }}
              bg="linear-gradient(135deg, rgba(0, 194, 255, 0.08) 0%, rgba(59, 130, 246, 0.12) 100%)"
              borderRadius="2xl"
              border="3px solid"
              borderColor="rgba(0, 194, 255, 0.3)"
              textAlign="center"
              boxShadow="0 20px 50px rgba(0, 194, 255, 0.2)"
              position="relative"
              overflow="hidden"
              transition="all 0.4s ease"
              _hover={{
                boxShadow: '0 30px 70px rgba(0, 194, 255, 0.35)',
                borderColor: 'rgba(0, 194, 255, 0.5)',
                transform: 'translateY(-4px)',
              }}
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: 'linear(to-r, cyan.400, blue.500, purple.500)',
              }}
            >
              <VStack spacing={{ base: 6, md: 8 }}>
                <Box>
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="black" color="white" mb={3}>
                    ⭐ Share Your Experience
                  </Text>
                  <Text fontSize={{ base: "md", md: "lg" }} color="whiteAlpha.800" maxW="2xl" mx="auto">
                    Your feedback helps us serve you better and helps others make informed decisions
                  </Text>
                </Box>

                {/* Trustpilot Widget */}
                <Box
                  className="trustpilot-widget"
                  data-locale={config.locale}
                  data-template-id={config.templateId}
                  data-businessunit-id={config.businessUnitId}
                  data-style-height="52px"
                  data-style-width="100%"
                  data-token={config.token}
                  maxW="600px"
                  mx="auto"
                  p={4}
                  bg="whiteAlpha.100"
                  borderRadius="xl"
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
                  gap={3}
                  px={{ base: 8, md: 12 }}
                  py={{ base: 4, md: 5 }}
                  bgGradient="linear(to-r, cyan.400, blue.500)"
                  color="white"
                  fontWeight="black"
                  fontSize={{ base: "md", md: "lg" }}
                  borderRadius="full"
                  textDecoration="none"
                  transition="all 0.3s ease"
                  boxShadow="0 10px 35px rgba(0, 194, 255, 0.4)"
                  _hover={{
                    transform: 'translateY(-3px) scale(1.03)',
                    boxShadow: '0 15px 50px rgba(0, 194, 255, 0.6)',
                    bgGradient: "linear(to-r, cyan.500, blue.600)",
                  }}
                  _active={{
                    transform: 'translateY(0) scale(0.98)',
                  }}
                >
                  <Text fontSize="2xl">⭐</Text>
                  <Text>Write a Review on Trustpilot</Text>
                </Box>
              </VStack>
            </Box>
          ) : null;
        })()}
      </VStack>
    </Container>
  </Box>
  );
}
