import type { Metadata } from 'next';
import { Box, Container, Heading, Text, Button, VStack, HStack, SimpleGrid, Flex } from '@chakra-ui/react';
import { FaPhone, FaClock, FaCheckCircle, FaStar, FaTruck } from 'react-icons/fa';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { locations, type Location } from '@/data/locations';

// CRITICAL: Modern 2025 Next.js App Router ISR configuration
// This replaces thousands of static pages with one dynamic route
export const dynamic = 'force-static'; // Enable ISR
export const revalidate = 86400; // Revalidate every 24 hours (1 day)

interface PageProps {
  params: {
    slug: string;
  };
}

// Generate metadata dynamically for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = params;
  
  // Find location data
  const location = locations.find(loc => loc.slug === slug);
  
  if (!location) {
    return {
      title: 'Location Not Found',
    };
  }

  const cityName = location.name;
  const title = `Man and Van ${cityName} | 24/7 Removals & Delivery | Speedy Van`;
  const description = `Professional man and van service in ${cityName}. 24/7 online booking, instant quotes, fully insured. From £25/hour. Same-day service available.`;

  return {
    title,
    description,
    keywords: `man and van ${cityName.toLowerCase()}, removals ${cityName.toLowerCase()}, van hire ${cityName.toLowerCase()}, delivery service ${cityName.toLowerCase()}, house removals ${cityName.toLowerCase()}`,
    openGraph: {
      title: `Man and Van ${cityName} | 24/7 Removals & Delivery`,
      description,
      type: 'website',
      url: `https://speedy-van.co.uk/man-and-van/${slug}`,
    },
    alternates: {
      canonical: `https://speedy-van.co.uk/man-and-van/${slug}`,
    },
  };
}

export default function ManAndVanLocationPage({ params }: PageProps) {
  const { slug } = params;
  
  // Find location data
  const location = locations.find(loc => loc.slug === slug);
  
  // Return 404 if location not found
  if (!location) {
    notFound();
  }

  const cityName = location.name;
  const county = location.county || '';
  const population = location.population ? location.population.toLocaleString() : null;

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.500" color="white" py={{ base: 12, md: 20 }}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="start">
            <Heading as="h1" size="2xl" fontWeight="bold">
              Man and Van {cityName}
            </Heading>
            <Text fontSize="xl" maxW="2xl">
              Professional removal and delivery service in {cityName}{county && `, ${county}`}. 
              Available 24/7 with instant online booking. Fully insured, reliable, and affordable from just £25/hour.
            </Text>
            <HStack spacing={4} flexWrap="wrap">
              <Link href="/booking-luxury">
                <Button
                  size="lg"
                  bg="white"
                  color="brand.500"
                  _hover={{ bg: 'gray.100' }}
                  leftIcon={<FaTruck />}
                >
                  Get Instant Quote
                </Button>
              </Link>
              <Button
                as="a"
                href="tel:01202129746"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={<FaPhone />}
              >
                Call: 01202 129746
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features */}
      <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <VStack spacing={4} align="start">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              rounded="full"
              bg="brand.100"
              color="brand.500"
            >
              <FaClock size={24} />
            </Flex>
            <Heading size="md">24/7 Availability</Heading>
            <Text color="gray.600">
              Book online anytime, day or night. Same-day service available in {cityName}.
            </Text>
          </VStack>

          <VStack spacing={4} align="start">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              rounded="full"
              bg="brand.100"
              color="brand.500"
            >
              <FaCheckCircle size={24} />
            </Flex>
            <Heading size="md">Fully Insured</Heading>
            <Text color="gray.600">
              All our vans and drivers are fully insured. Your belongings are protected throughout the journey.
            </Text>
          </VStack>

          <VStack spacing={4} align="start">
            <Flex
              w={12}
              h={12}
              align="center"
              justify="center"
              rounded="full"
              bg="brand.100"
              color="brand.500"
            >
              <FaStar size={24} />
            </Flex>
            <Heading size="md">5-Star Service</Heading>
            <Text color="gray.600">
              Rated 5 stars by thousands of customers across {cityName} and the UK.
            </Text>
          </VStack>
        </SimpleGrid>

        {/* Services */}
        <Box mt={16}>
          <Heading size="xl" mb={8}>Our Services in {cityName}</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            <Box p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
              <Heading size="md" mb={3}>House Removals</Heading>
              <Text color="gray.600">
                Full house and flat removals in {cityName}. Professional packing and loading services available.
              </Text>
            </Box>
            <Box p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
              <Heading size="md" mb={3}>Office Moving</Heading>
              <Text color="gray.600">
                Business relocation services with minimal downtime. Available evenings and weekends.
              </Text>
            </Box>
            <Box p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
              <Heading size="md" mb={3}>Furniture Delivery</Heading>
              <Text color="gray.600">
                Safe delivery of furniture, white goods, and large items across {cityName}.
              </Text>
            </Box>
            <Box p={6} borderWidth={1} borderRadius="lg" borderColor="gray.200">
              <Heading size="md" mb={3}>Student Moves</Heading>
              <Text color="gray.600">
                Affordable student moving service with flexible scheduling and competitive rates.
              </Text>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Why Choose Us */}
        <Box mt={16} bg="gray.50" p={8} borderRadius="lg">
          <Heading size="xl" mb={6}>Why Choose Speedy Van in {cityName}?</Heading>
          <VStack spacing={4} align="start">
            <HStack spacing={3}>
              <FaCheckCircle color="green" />
              <Text>Instant online booking with transparent pricing</Text>
            </HStack>
            <HStack spacing={3}>
              <FaCheckCircle color="green" />
              <Text>Professional, uniformed drivers with years of experience</Text>
            </HStack>
            <HStack spacing={3}>
              <FaCheckCircle color="green" />
              <Text>Modern, clean vans suitable for all moving needs</Text>
            </HStack>
            <HStack spacing={3}>
              <FaCheckCircle color="green" />
              <Text>Flexible payment options and no hidden fees</Text>
            </HStack>
            <HStack spacing={3}>
              <FaCheckCircle color="green" />
              <Text>Serving {cityName} {population && `and ${population} residents`} with excellence</Text>
            </HStack>
          </VStack>
        </Box>

        {/* CTA Section */}
        <Box mt={16} textAlign="center">
          <Heading size="xl" mb={4}>Ready to Book Your Man and Van in {cityName}?</Heading>
          <Text fontSize="lg" color="gray.600" mb={8}>
            Get an instant quote and book online in less than 2 minutes
          </Text>
          <Link href="/booking-luxury">
            <Button
              size="lg"
              colorScheme="brand"
              leftIcon={<FaTruck />}
            >
              Get Instant Quote
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
