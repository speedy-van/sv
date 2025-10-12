/**
 * Landing Page: Moving Furniture Fast
 * 
 * Optimized for urgency-based searches
 * Target keywords: "moving furniture fast", "urgent furniture delivery", "same day furniture moving"
 */

import { Metadata } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Button,
  Badge,
  List,
  ListItem,
  ListIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FaBolt,
  FaClock,
  FaCheckCircle,
  FaPhone,
  FaStar,
  FaTruck,
} from 'react-icons/fa';
import QuickBookingWidget from '@/components/booking/QuickBookingWidget';
import { BUSINESS_INFO } from '@/config/seo';

export const metadata: Metadata = {
  title: 'Moving Furniture Fast - Same Day Service in 2-4 Hours | Speedy Van',
  description: 'Need furniture moved urgently? Book now for same-day delivery in 2-4 hours. Professional movers, real-time tracking, fully insured. From £25. Available 24/7.',
  keywords: [
    'moving furniture fast',
    'urgent furniture delivery',
    'same day furniture moving',
    'express furniture delivery',
    'quick furniture removal',
    'emergency furniture moving',
    'fast furniture transport',
    '24 hour furniture delivery',
  ],
  openGraph: {
    title: 'Moving Furniture Fast - Same Day Service in 2-4 Hours',
    description: 'Urgent furniture delivery across Scotland. Professional movers ready now. Book in 60 seconds.',
    type: 'website',
    locale: 'en_GB',
  },
};

export default function MovingFurnitureFastPage() {
  return (
    <>
      {/* Schema.org markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            name: 'Fast Furniture Moving Service',
            description: 'Same-day furniture moving and delivery service across Scotland',
            provider: {
              '@type': 'LocalBusiness',
              name: BUSINESS_INFO.name,
              telephone: BUSINESS_INFO.contact.phone,
              priceRange: '££',
            },
            areaServed: {
              '@type': 'Country',
              name: 'United Kingdom',
            },
            availableChannel: {
              '@type': 'ServiceChannel',
              serviceUrl: 'https://speedy-van.co.uk/moving-furniture-fast',
              availableLanguage: 'en',
            },
            offers: {
              '@type': 'Offer',
              price: '25',
              priceCurrency: 'GBP',
              availability: 'https://schema.org/InStock',
              validFrom: new Date().toISOString(),
            },
          }),
        }}
      />

      {/* Hero Section */}
      <Box
        bg="linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)"
        color="white"
        py={{ base: 12, md: 20 }}
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
            <VStack align="start" spacing={6}>
              <Badge colorScheme="red" fontSize="md" px={3} py={1} animation="pulse 2s infinite">
                ⚡ URGENT SERVICE AVAILABLE NOW
              </Badge>
              
              <Heading
                as="h1"
                size="2xl"
                lineHeight="1.2"
              >
                Moving Furniture Fast?
                <br />
                <Text as="span" fontSize="xl" fontWeight="normal">
                  We'll Get It There in 2-4 Hours
                </Text>
              </Heading>

              <Text fontSize="lg">
                Need furniture moved urgently? Our professional team is ready to help <strong>right now</strong>.
                Same-day service across Scotland with real-time tracking and full insurance.
              </Text>

              {/* Urgency Stats */}
              <SimpleGrid columns={3} spacing={4} w="full">
                <Stat bg="whiteAlpha.200" p={4} borderRadius="lg">
                  <StatLabel fontSize="sm">Average Response</StatLabel>
                  <StatNumber fontSize="2xl">15 min</StatNumber>
                </Stat>
                <Stat bg="whiteAlpha.200" p={4} borderRadius="lg">
                  <StatLabel fontSize="sm">Delivery Time</StatLabel>
                  <StatNumber fontSize="2xl">2-4 hrs</StatNumber>
                </Stat>
                <Stat bg="whiteAlpha.200" p={4} borderRadius="lg">
                  <StatLabel fontSize="sm">Success Rate</StatLabel>
                  <StatNumber fontSize="2xl">99.8%</StatNumber>
                </Stat>
              </SimpleGrid>

              {/* Urgent CTA */}
              <HStack spacing={4}>
                <Button
                  as="a"
                  href="tel:+441698123456"
                  size="lg"
                  colorScheme="whiteAlpha"
                  leftIcon={<FaPhone />}
                  animation="shake 0.5s infinite"
                >
                  Call Now - Urgent
                </Button>
                <Button
                  as="a"
                  href="#book-now"
                  size="lg"
                  bg="white"
                  color="red.500"
                  _hover={{ bg: 'gray.100' }}
                >
                  Book Instantly
                </Button>
              </HStack>
            </VStack>

            <Box id="book-now">
              <QuickBookingWidget variant="inline" />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Why Fast Service */}
      <Box bg="white" py={16}>
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={12}>
            Why Choose Our Fast Furniture Moving Service?
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {[
              {
                icon: FaBolt,
                title: 'Instant Response',
                description: 'Book online or call us. We respond within 15 minutes and can be with you in 2-4 hours.',
              },
              {
                icon: FaTruck,
                title: 'Ready to Go',
                description: 'Our vans and professional drivers are always ready. No waiting, no delays.',
              },
              {
                icon: FaCheckCircle,
                title: 'Fully Insured',
                description: 'All furniture is fully insured during transport. Peace of mind guaranteed.',
              },
              {
                icon: FaClock,
                title: '24/7 Availability',
                description: 'Need furniture moved at night or weekend? We are available around the clock.',
              },
              {
                icon: FaStar,
                title: 'Expert Movers',
                description: 'Trained professionals who handle your furniture with care, no matter how urgent.',
              },
              {
                icon: FaPhone,
                title: 'Live Support',
                description: 'Track your delivery in real-time and contact us anytime during the move.',
              },
            ].map((feature, index) => (
              <VStack
                key={index}
                p={6}
                bg="red.50"
                borderRadius="lg"
                align="start"
                spacing={3}
                borderLeft="4px solid"
                borderColor="red.500"
              >
                <Icon as={feature.icon} boxSize={10} color="red.500" />
                <Heading size="md">{feature.title}</Heading>
                <Text color="gray.700">{feature.description}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.lg">
          <Heading textAlign="center" mb={12}>
            How Our Fast Service Works
          </Heading>

          <VStack spacing={8} align="stretch">
            {[
              {
                step: '1',
                title: 'Book Instantly',
                description: 'Fill in our quick form (30 seconds) or call us directly. Get an instant quote.',
              },
              {
                step: '2',
                title: 'We Dispatch Immediately',
                description: 'Our nearest available driver is notified and heads to your location within minutes.',
              },
              {
                step: '3',
                title: 'Furniture Collected',
                description: 'Professional movers arrive, carefully load your furniture, and hit the road.',
              },
              {
                step: '4',
                title: 'Delivered Fast',
                description: 'Track your delivery in real-time. Furniture delivered safely in 2-4 hours.',
              },
            ].map((item) => (
              <HStack
                key={item.step}
                p={6}
                bg="white"
                borderRadius="lg"
                spacing={6}
                align="start"
                boxShadow="md"
              >
                <Box
                  bg="red.500"
                  color="white"
                  w="60px"
                  h="60px"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="2xl"
                  fontWeight="bold"
                  flexShrink={0}
                >
                  {item.step}
                </Box>
                <VStack align="start" spacing={2}>
                  <Heading size="md">{item.title}</Heading>
                  <Text color="gray.600">{item.description}</Text>
                </VStack>
              </HStack>
            ))}
          </VStack>
        </Container>
      </Box>

      {/* Urgent CTA Section */}
      <Box bg="red.500" color="white" py={16}>
        <Container maxW="container.md" textAlign="center">
          <Heading mb={4}>Need Furniture Moved Right Now?</Heading>
          <Text fontSize="xl" mb={8}>
            Don't wait! Our team is standing by. Book in 60 seconds or call for immediate dispatch.
          </Text>
          <HStack justify="center" spacing={4}>
            <Button
              as="a"
              href="tel:+441698123456"
              size="lg"
              colorScheme="whiteAlpha"
              leftIcon={<FaPhone />}
              px={12}
              py={7}
            >
              Call Now
            </Button>
            <Button
              as="a"
              href="#book-now"
              size="lg"
              bg="white"
              color="red.500"
              px={12}
              py={7}
            >
              Book Online
            </Button>
          </HStack>
        </Container>
      </Box>
    </>
  );
}

