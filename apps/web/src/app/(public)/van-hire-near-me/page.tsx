/**
 * Landing Page: Van Hire Near Me
 * 
 * Optimized for Google Ads and SEO
 * Target keyword: "van hire near me", "man and van near me"
 * Conversion-focused with 2-click booking
 */

export const revalidate = 3600; // Revalidate every hour

import { Metadata } from 'next';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Badge,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaClock,
  FaPoundSign,
  FaStar,
  FaMapMarkerAlt,
  FaPhone,
} from 'react-icons/fa';
import QuickBookingWidget from '@/components/booking/QuickBookingWidget';
import { BUSINESS_INFO } from '@/config/seo';
import {
  APP_BASE_URL,
  BRAND_NAME,
  SUPPORT_PHONE,
  SUPPORT_PHONE_E164,
} from '@/lib/seo/constants';

const canonicalUrl = `${APP_BASE_URL}/van-hire-near-me`;

export const metadata: Metadata = {
  title: `Van Hire Near Me - Same Day Service from £25 | ${BRAND_NAME}`,
  description:
    'Need a van near you? Book instantly online. Professional drivers, same-day service, real-time tracking. Serving Glasgow, Hamilton, Edinburgh. From £25. Book now!',
  keywords: [
    'van hire near me',
    'man and van near me',
    'van rental near me',
    'van hire Glasgow',
    'van hire Hamilton',
    'van hire Edinburgh',
    'same day van hire',
    'cheap van hire',
  ],
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: `Van Hire Near Me - Same Day Service from £25 | ${BRAND_NAME}`,
    description:
      'Book a van near you in minutes. Professional drivers, instant quotes, same-day service.',
    type: 'website',
    locale: 'en_GB',
    url: canonicalUrl,
    siteName: BRAND_NAME,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@speedyvan',
    creator: '@speedyvan',
    title: `Van Hire Near Me - Same Day Service from £25 | ${BRAND_NAME}`,
    description:
      'Book a van near you in minutes. Professional drivers, instant quotes, same-day service.',
  },
};

export default function VanHireNearMePage() {
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: 'Van Hire Near Me',
    provider: {
      '@type': 'LocalBusiness',
      name: BRAND_NAME,
      telephone: SUPPORT_PHONE_E164,
      address: {
        '@type': 'PostalAddress',
        streetAddress: `${BUSINESS_INFO.address.office}, ${BUSINESS_INFO.address.street}`,
        addressLocality: BUSINESS_INFO.address.city,
        postalCode: BUSINESS_INFO.address.postcode,
        addressCountry: 'GB',
      },
    },
    areaServed: ['Glasgow', 'Hamilton', 'Edinburgh', 'Scotland'],
    availableChannel: {
      '@type': 'ServiceChannel',
      serviceUrl: canonicalUrl,
    },
    offers: {
      '@type': 'Offer',
      price: '25',
      priceCurrency: 'GBP',
      description: 'Van hire starting from £25',
    },
  };

  return (
    <>
      {/* Schema.org markup for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(serviceSchema),
        }}
      />

      {/* Hero Section - Above the fold */}
      <Box
        bg="linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)"
        color="white"
        py={{ base: 12, md: 20 }}
      >
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
            {/* Left: Value Proposition */}
            <VStack align="start" spacing={6}>
              <Badge colorScheme="green" fontSize="md" px={3} py={1}>
                ⚡ Available Now in Your Area
              </Badge>
              
              <Heading
                as="h1"
                size="2xl"
                lineHeight="1.2"
                bgGradient="linear(to-r, #00C2FF, #00D18F)"
                bgClip="text"
              >
                Van Hire Near Me
                <br />
                <Text as="span" fontSize="xl" color="gray.300">
                  Book Online in 60 Seconds
                </Text>
              </Heading>

              <Text fontSize="lg" color="gray.300">
                Professional van hire service with vetted drivers. Same-day delivery across
                Scotland. Real-time tracking included. No hidden fees.
              </Text>

              {/* Trust Signals */}
              <HStack spacing={6} flexWrap="wrap">
                <HStack>
                  <Box color="yellow.400" fontSize="lg">
                    <FaStar />
                  </Box>
                  <Text fontWeight="bold">4.8/5 Rating</Text>
                </HStack>
                <HStack>
                  <Box color="green.400" fontSize="lg">
                    <FaCheckCircle />
                  </Box>
                  <Text fontWeight="bold">1,247+ Reviews</Text>
                </HStack>
                <HStack>
                  <Box color="blue.400" fontSize="lg">
                    <FaClock />
                  </Box>
                  <Text fontWeight="bold">Same Day Service</Text>
                </HStack>
              </HStack>

              {/* CTA Buttons */}
              <HStack spacing={4}>
                <Button
                  as="a"
                  href={`tel:${SUPPORT_PHONE_E164}`}
                  size="lg"
                  colorScheme="green"
                  leftIcon={<FaPhone />}
                >
                  Call Now {SUPPORT_PHONE && `(${SUPPORT_PHONE})`}
                </Button>
                <Button
                  as="a"
                  href="#book-now"
                  size="lg"
                  variant="outline"
                  colorScheme="whiteAlpha"
                >
                  Get Instant Quote
                </Button>
              </HStack>
            </VStack>

            {/* Right: Quick Booking Form */}
            <Box id="book-now">
              <QuickBookingWidget variant="inline" />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box bg="white" py={16}>
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={12}>
            Why Choose Speedy Van?
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            {[
              {
                icon: FaPoundSign,
                title: 'From £25',
                description: 'Transparent pricing with no hidden fees. Get instant quote online.',
              },
              {
                icon: FaClock,
                title: 'Same Day Service',
                description: 'Book now, delivered today. Express service available in 1-2 hours.',
              },
              {
                icon: FaMapMarkerAlt,
                title: 'Real-Time Tracking',
                description: 'Track your driver live on the map. Know exactly when they arrive.',
              },
              {
                icon: FaCheckCircle,
                title: 'Vetted Drivers',
                description: 'All drivers are background checked, insured, and professionally trained.',
              },
              {
                icon: FaStar,
                title: 'Top Rated',
                description: '4.8/5 stars from 1,247+ customers. Trusted across Scotland.',
              },
              {
                icon: FaPhone,
                title: '24/7 Support',
                description: 'Customer support available around the clock. We are here to help.',
              },
            ].map(({ icon: IconComponent, title, description }, index) => (
              <VStack
                key={index}
                p={6}
                bg="gray.50"
                borderRadius="lg"
                align="start"
                spacing={3}
              >
                <Box color="green.500" fontSize="3xl">
                  <IconComponent />
                </Box>
                <Heading size="md">{title}</Heading>
                <Text color="gray.600">{description}</Text>
              </VStack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Service Areas */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={8}>
            Van Hire Available Near You
          </Heading>
          
          <Text textAlign="center" fontSize="lg" color="gray.600" mb={8}>
            We serve all major cities and towns across Scotland
          </Text>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {[
              'Glasgow',
              'Hamilton',
              'Edinburgh',
              'Motherwell',
              'East Kilbride',
              'Paisley',
              'Stirling',
              'Dundee',
              'Aberdeen',
              'Inverness',
              'Perth',
              'Ayr',
            ].map((area) => (
              <Box
                key={area}
                p={4}
                bg="white"
                borderRadius="md"
                textAlign="center"
                fontWeight="medium"
              >
                📍 {area}
              </Box>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* FAQ Section */}
      <Box bg="white" py={16}>
        <Container maxW="container.lg">
          <Heading textAlign="center" mb={12}>
            Frequently Asked Questions
          </Heading>

          <VStack spacing={6} align="stretch">
            {[
              {
                q: 'How quickly can I get a van?',
                a: 'Same-day service is available with 2-4 hours notice. Express service (1-2 hours) is also available for urgent deliveries.',
              },
              {
                q: 'What is included in the price?',
                a: 'The price includes the driver, fuel, insurance, and real-time tracking. No hidden fees.',
              },
              {
                q: 'Do I need to pay upfront?',
                a: 'No payment required for a quote. You can book and pay securely online or after delivery.',
              },
              {
                q: 'What areas do you cover?',
                a: 'We cover all of Scotland, including Glasgow, Edinburgh, Hamilton, and surrounding areas.',
              },
            ].map((faq, index) => (
              <Box key={index} p={6} bg="gray.50" borderRadius="lg">
                <Heading size="sm" mb={2}>
                  {faq.q}
                </Heading>
                <Text color="gray.600">{faq.a}</Text>
              </Box>
            ))}
          </VStack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box bg="green.500" color="white" py={16}>
        <Container maxW="container.md" textAlign="center">
          <Heading mb={4}>Ready to Book Your Van?</Heading>
          <Text fontSize="lg" mb={8}>
            Get an instant quote in 30 seconds. No payment required.
          </Text>
          <Button
            as="a"
            href="#book-now"
            size="lg"
            colorScheme="whiteAlpha"
            px={12}
            py={7}
          >
            Get Instant Quote →
          </Button>
        </Container>
      </Box>
    </>
  );
}

