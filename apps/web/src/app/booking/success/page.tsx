'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Icon,
  HStack,
  Card,
  CardBody,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FaCheckCircle, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import Link from 'next/link';

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const sessionId = searchParams?.get('session_id');
    const bookingId = searchParams?.get('booking_id');
    
    if (!sessionId || !bookingId) {
      toast({
        title: 'Invalid booking reference',
        description: 'Please check your confirmation email for your booking details.',
        status: 'warning',
        duration: 5000,
      });
      setLoading(false);
      return;
    }
    
    // Fetch booking details
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        const data = await response.json();
        
        if (data.success) {
          setBookingDetails(data.booking);
          
          // Track Google Ads conversion for successful booking
          if (typeof window !== 'undefined' && (window as any).gtag) {
            try {
              (window as any).gtag('event', 'conversion', {
                'send_to': 'AW-17715630822/Submit_lead_form_Website',
                'value': data.booking.total || 1.0,
                'currency': 'GBP',
                'transaction_id': data.booking.bookingNumber || bookingId
              });
              console.log('✅ Google Ads conversion tracked: Booking completed', {
                bookingId,
                value: data.booking.total
              });
            } catch (gtagError) {
              console.error('❌ Google Ads conversion tracking failed:', gtagError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch booking:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooking();
  }, [searchParams, toast]);
  
  if (loading) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading your booking details...</Text>
        </VStack>
      </Container>
    );
  }
  
  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="stretch">
        {/* Success Header */}
        <VStack spacing={4} textAlign="center">
          <Box
            bg="green.50"
            borderRadius="full"
            p={6}
            border="4px solid"
            borderColor="green.400"
          >
            <Icon as={FaCheckCircle} color="green.500" boxSize={16} />
          </Box>
          <Heading size="2xl" color="green.600">
            Booking Confirmed!
          </Heading>
          <Text fontSize="lg" color="gray.600">
            Your booking has been successfully created and payment confirmed.
          </Text>
        </VStack>
        
        {/* Booking Details Card */}
        {bookingDetails && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="sm" color="gray.500" mb={1}>
                    Booking Number
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                    {bookingDetails.bookingNumber}
                  </Text>
                </Box>
                
                <Divider />
                
                <HStack spacing={4} align="start">
                  <Icon as={FaMapMarkerAlt} color="blue.500" mt={1} />
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      Pickup Location
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {bookingDetails.pickupAddress}
                    </Text>
                  </Box>
                </HStack>
                
                <HStack spacing={4} align="start">
                  <Icon as={FaMapMarkerAlt} color="green.500" mt={1} />
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="semibold" mb={1}>
                      Drop-off Location
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {bookingDetails.dropoffAddress}
                    </Text>
                  </Box>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Service Type:</Text>
                  <Text textTransform="uppercase">{bookingDetails.serviceType}</Text>
                </HStack>
                
                <HStack justify="space-between">
                  <Text fontWeight="semibold">Total Paid:</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    £{bookingDetails.total.toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}
        
        {/* Confirmation Email Alert */}
        <Alert status="info" borderRadius="lg">
          <AlertIcon />
          <Box>
            <Text fontWeight="semibold">Confirmation email sent!</Text>
            <Text fontSize="sm">
              We've sent a detailed confirmation to {bookingDetails?.customerEmail || 'your email'} with your booking details and tracking link.
            </Text>
          </Box>
        </Alert>
        
        {/* Next Steps */}
        <Card bg="blue.50">
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Heading size="md" color="blue.700">
                What's Next?
              </Heading>
              <Text fontSize="sm">
                1. Check your email for the confirmation and tracking link
              </Text>
              <Text fontSize="sm">
                2. Our team will contact you 24 hours before your scheduled pickup
              </Text>
              <Text fontSize="sm">
                3. Track your booking status in real-time using the tracking link
              </Text>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Contact Information */}
        <Card>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <Heading size="sm">Need Help?</Heading>
              <HStack>
                <Icon as={FaEnvelope} color="blue.500" />
                <Text fontSize="sm">support@speedy-van.co.uk</Text>
              </HStack>
              <HStack>
                <Icon as={FaPhone} color="blue.500" />
                <Text fontSize="sm">01202129764</Text>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
        
        {/* Action Buttons */}
        <HStack spacing={4} justify="center">
          {bookingDetails?.trackingLink && (
            <Button
              as="a"
              href={bookingDetails.trackingLink}
              colorScheme="blue"
              size="lg"
            >
              Track My Booking
            </Button>
          )}
          <Button
            as={Link}
            href="/"
            variant="outline"
            colorScheme="blue"
            size="lg"
          >
            Back to Home
          </Button>
        </HStack>
      </VStack>
    </Container>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <Container maxW="container.md" py={20}>
        <VStack spacing={8}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text>Loading...</Text>
        </VStack>
      </Container>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
