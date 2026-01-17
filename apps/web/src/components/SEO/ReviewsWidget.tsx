'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Button,
  Select,
  Skeleton,
  useBreakpointValue,
  Grid,
  Flex,
  Divider,
} from '@chakra-ui/react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  city: string | null;
  serviceType: string | null;
  createdAt: string;
  customerName: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: Record<number, number>;
}

interface ReviewsWidgetProps {
  city?: string;
  minRating?: number;
  limit?: number;
  showFilters?: boolean;
}

export default function ReviewsWidget({
  city,
  minRating = 1,
  limit = 10,
  showFilters = true,
}: ReviewsWidgetProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRating, setSelectedRating] = useState<number>(minRating);

  const isMobile = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    fetchReviews();
  }, [city, selectedRating, page, limit]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        minRating: selectedRating.toString(),
      });

      if (city) {
        params.append('city', city);
      }

      const response = await fetch(`/api/reviews/public?${params}`);
      const data = await response.json();

      setReviews(data.reviews);
      setStats(data.stats);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      // Silent error: Error fetching reviews
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Icon key={i} as={FaStar} color="yellow.400" />);
      } else if (i - rating < 1) {
        stars.push(<Icon key={i} as={FaStarHalfAlt} color="yellow.400" />);
      } else {
        stars.push(<Icon key={i} as={FaRegStar} color="gray.300" />);
      }
    }
    return stars;
  };

  const formatServiceType = (type: string | null): string => {
    if (!type) return '';
    return type
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading
            as="h2"
            size={{ base: 'xl', md: '2xl' }}
            mb={3}
            color="blue.600"
          >
            Customer Reviews
            {city && ` in ${city}`}
          </Heading>
          {stats && (
            <VStack spacing={2}>
              <HStack spacing={1}>
                {renderStars(Math.round(stats.averageRating))}
                <Text fontSize="2xl" fontWeight="bold" ml={2}>
                  {stats.averageRating.toFixed(1)}
                </Text>
              </HStack>
              <Text color="gray.600">
                Based on {stats.totalReviews} customer reviews
              </Text>
            </VStack>
          )}
        </Box>

        {/* Filters */}
        {showFilters && (
          <Flex
            direction={{ base: 'column', md: 'row' }}
            gap={4}
            justify="center"
            align="center"
          >
            <Select
              value={selectedRating}
              onChange={(e) => {
                setSelectedRating(Number(e.target.value));
                setPage(1);
              }}
              maxW={{ base: 'full', md: '200px' }}
            >
              <option value="1">All Ratings</option>
              <option value="5">5 Stars Only</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </Select>
          </Flex>
        )}

        {/* Reviews Grid */}
        {loading ? (
          <VStack spacing={4}>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} height="150px" borderRadius="lg" />
            ))}
          </VStack>
        ) : reviews.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Text color="gray.600">No reviews yet. Be the first to leave one!</Text>
          </Box>
        ) : (
          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
            gap={6}
          >
            {reviews.map((review) => (
              <Box
                key={review.id}
                p={6}
                bg="white"
                borderRadius="lg"
                boxShadow="md"
                borderLeft="4px solid"
                borderLeftColor="blue.500"
                transition="all 0.2s"
                _hover={{
                  boxShadow: 'lg',
                  transform: 'translateY(-2px)',
                }}
              >
                <VStack align="start" spacing={3}>
                  {/* Rating & Date */}
                  <Flex justify="space-between" width="100%">
                    <HStack spacing={1}>
                      {renderStars(review.rating)}
                    </HStack>
                    <Text fontSize="sm" color="gray.500">
                      {formatDate(review.createdAt)}
                    </Text>
                  </Flex>

                  {/* Title */}
                  {review.title && (
                    <Heading size="md" color="gray.800">
                      {review.title}
                    </Heading>
                  )}

                  {/* Comment */}
                  {review.comment && (
                    <Text color="gray.700" lineHeight="tall">
                      "{review.comment}"
                    </Text>
                  )}

                  <Divider />

                  {/* Customer Info */}
                  <Flex
                    justify="space-between"
                    width="100%"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <Text fontWeight="medium" color="gray.800">
                      {review.customerName}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      {review.city && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {review.city}
                        </Badge>
                      )}
                      {review.serviceType && (
                        <Badge colorScheme="green" fontSize="xs">
                          {formatServiceType(review.serviceType)}
                        </Badge>
                      )}
                    </HStack>
                  </Flex>
                </VStack>
              </Box>
            ))}
          </Grid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="center" gap={2} flexWrap="wrap">
            <Button
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              isDisabled={page === 1 || loading}
            >
              Previous
            </Button>
            <HStack spacing={1}>
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  Math.abs(pageNum - page) <= 1
                ) {
                  return (
                    <Button
                      key={pageNum}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      colorScheme={page === pageNum ? 'blue' : 'gray'}
                      variant={page === pageNum ? 'solid' : 'outline'}
                      isDisabled={loading}
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (
                  pageNum === page - 2 ||
                  pageNum === page + 2
                ) {
                  return <Text key={pageNum}>...</Text>;
                }
                return null;
              })}
            </HStack>
            <Button
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              isDisabled={page === totalPages || loading}
            >
              Next
            </Button>
          </Flex>
        )}
      </VStack>
    </Container>
  );
}
