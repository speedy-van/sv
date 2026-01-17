'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Textarea,
  Input,
  HStack,
  Icon,
  Alert,
  AlertIcon,
  Spinner,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiStar, FiCheckCircle } from 'react-icons/fi';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

function SubmitReviewContent() {
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [bookingData, setBookingData] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      verifyToken(tokenParam);
    } else {
      setError('Invalid review link');
      setLoading(false);
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`/api/reviews/verify?token=${token}`);
      const data = await response.json();
      
      if (data.valid) {
        setBookingData(data.booking);
      } else {
        setError(data.message || 'Invalid or expired review link');
      }
    } catch (err) {
      setError('Failed to verify review link');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!token || rating < 1) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSubmitted(true);
        toast({
          title: 'Review submitted!',
          description: data.discountCode 
            ? `Thank you! Your 10% discount code: ${data.discountCode}`
            : 'Thank you for your feedback!',
          status: 'success',
          duration: 8000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message || 'Failed to submit review');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to submit review',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <MobileHeader />
        <Container maxW="xl" py={20}>
          <VStack spacing={4}>
            <Spinner size="xl" color="cyan.500" />
            <Text>Loading...</Text>
          </VStack>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <MobileHeader />
        <Container maxW="xl" py={20}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Header />
        <MobileHeader />
        <Container maxW="xl" py={20}>
          <VStack spacing={6} textAlign="center">
            <Icon as={FiCheckCircle} boxSize={16} color="green.500" />
            <Heading size="lg" color="white">
              Thank You!
            </Heading>
            <Text color="gray.300" fontSize="lg">
              Your review has been submitted successfully.
            </Text>
            {bookingData?.discountCode && (
              <Box
                p={6}
                bg="cyan.900"
                borderRadius="lg"
                border="2px solid"
                borderColor="cyan.500"
              >
                <Text fontSize="sm" color="gray.300" mb={2}>
                  Your 10% Discount Code:
                </Text>
                <Badge
                  fontSize="2xl"
                  px={6}
                  py={3}
                  colorScheme="cyan"
                  borderRadius="md"
                >
                  {bookingData.discountCode}
                </Badge>
                <Text fontSize="xs" color="gray.400" mt={2}>
                  Valid for 3 months on your next booking
                </Text>
              </Box>
            )}
            <Button
              as="a"
              href="/"
              colorScheme="cyan"
              size="lg"
              mt={4}
            >
              Return to Homepage
            </Button>
          </VStack>
        </Container>
      </>
    );
  }

  return (
    <>
      <Header />
      <MobileHeader />
      <Box
        minH="100vh"
        bg="linear-gradient(180deg, #0A0E17 0%, #0D1321 50%, #0A0E17 100%)"
        pt={{ base: 20, md: 24 }}
      >
        <Container maxW="2xl" py={12}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <VStack spacing={3} textAlign="center">
              <Heading size="xl" color="white">
                Rate Your Move
              </Heading>
              <Text color="gray.300" fontSize="lg">
                How was your experience with Speedy Van?
              </Text>
              {bookingData && (
                <HStack spacing={2} mt={2}>
                  <Text color="gray.400" fontSize="sm">
                    Booking Reference:
                  </Text>
                  <Badge colorScheme="cyan">{bookingData.reference}</Badge>
                </HStack>
              )}
            </VStack>

            {/* Rating */}
            <Box
              p={8}
              bg="rgba(255,255,255,0.03)"
              border="1px solid rgba(255,255,255,0.08)"
              borderRadius="2xl"
            >
              <VStack spacing={6}>
                <Text color="white" fontSize="lg" fontWeight="semibold">
                  Rate Your Experience
                </Text>
                <HStack spacing={4}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                      key={star}
                      as={FiStar}
                      boxSize={10}
                      color={star <= rating ? 'yellow.400' : 'gray.600'}
                      fill={star <= rating ? 'yellow.400' : 'none'}
                      cursor="pointer"
                      onClick={() => setRating(star)}
                      transition="all 0.2s"
                      _hover={{
                        transform: 'scale(1.2)',
                        color: 'yellow.300',
                      }}
                    />
                  ))}
                </HStack>
                <Text color="gray.400" fontSize="sm">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Good'}
                  {rating === 3 && 'Average'}
                  {rating === 2 && 'Below Average'}
                  {rating === 1 && 'Poor'}
                </Text>
              </VStack>
            </Box>

            {/* Review Form */}
            <VStack spacing={4} align="stretch">
              <Box>
                <Text color="white" mb={2} fontSize="sm" fontWeight="medium">
                  Review Title (Optional)
                </Text>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Great service!"
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  _focus={{
                    borderColor: 'cyan.500',
                    bg: 'rgba(255,255,255,0.08)',
                  }}
                />
              </Box>

              <Box>
                <Text color="white" mb={2} fontSize="sm" fontWeight="medium">
                  Your Review (Optional)
                </Text>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  rows={6}
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  _focus={{
                    borderColor: 'cyan.500',
                    bg: 'rgba(255,255,255,0.08)',
                  }}
                />
              </Box>
            </VStack>

            {/* Incentive Message */}
            <Alert
              status="info"
              bg="rgba(0,194,255,0.1)"
              border="1px solid rgba(0,194,255,0.3)"
              borderRadius="lg"
            >
              <AlertIcon color="cyan.400" />
              <Text color="gray.300" fontSize="sm">
                Submit your review to receive a <strong>10% discount code</strong> for your next booking!
              </Text>
            </Alert>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              loadingText="Submitting..."
              colorScheme="cyan"
              size="lg"
              isDisabled={rating < 1}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
              }}
              transition="all 0.2s"
            >
              Submit Review
            </Button>
          </VStack>
        </Container>
      </Box>
    </>
  );
}

export default function SubmitReviewPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="cyan.500" />
      </Box>
    }>
      <SubmitReviewContent />
    </Suspense>
  );
}
