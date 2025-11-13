import { Box, Button, Container, Heading, SimpleGrid, Stack, Text, VStack } from '@chakra-ui/react';
import Link from 'next/link';
import { FaTruck, FaClock, FaCheckCircle, FaStar, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export const metadata = {
  title: 'Man and Van Fareham | 24/7 Removals & Delivery | Speedy Van',
  description: 'Professional man and van service in Fareham. 24/7 availability, fully insured, competitive rates. Book your Fareham removal or delivery today!',
};

export default function ManAndVanFarehamPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.50" py={20}>
        <Container maxW="container.xl">
          <Stack spacing={6} textAlign="center">
            <Heading as="h1" size="2xl">
              Man and Van Fareham
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Professional removal and delivery service in Fareham. Available 24/7 with competitive rates.
            </Text>
            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} justify="center">
              <Link href="/quote">
                <Button size="lg" colorScheme="brand">
                  Get Instant Quote
                </Button>
              </Link>
              <Link href="tel:01202129746">
                <Button size="lg" variant="outline" leftIcon={<FaPhone />}>
                  Call 01202 129746
                </Button>
              </Link>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <VStack>
            <FaClock size={32} color="var(--chakra-colors-brand-500)" />
            <Heading size="md">24/7 Availability</Heading>
            <Text textAlign="center" color="gray.600">
              Round-the-clock service in Fareham
            </Text>
          </VStack>
          <VStack>
            <FaCheckCircle size={32} color="var(--chakra-colors-brand-500)" />
            <Heading size="md">Fully Insured</Heading>
            <Text textAlign="center" color="gray.600">
              Complete peace of mind for your move
            </Text>
          </VStack>
          <VStack>
            <FaStar size={32} color="var(--chakra-colors-brand-500)" />
            <Heading size="md">Professional Service</Heading>
            <Text textAlign="center" color="gray.600">
              Experienced and reliable drivers
            </Text>
          </VStack>
          <VStack>
            <FaTruck size={32} color="var(--chakra-colors-brand-500)" />
            <Heading size="md">Modern Fleet</Heading>
            <Text textAlign="center" color="gray.600">
              Well-maintained vans of all sizes
            </Text>
          </VStack>
        </SimpleGrid>
      </Container>

      {/* Services Section */}
      <Box bg="gray.50" py={16}>
        <Container maxW="container.xl">
          <Heading textAlign="center" mb={12}>
            Our Services in Fareham
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <Box bg="white" p={6} borderRadius="lg" shadow="md">
              <Heading size="md" mb={4}>House Removals</Heading>
              <Text color="gray.600">
                Full house moving service with professional packing and loading in Fareham.
              </Text>
            </Box>
            <Box bg="white" p={6} borderRadius="lg" shadow="md">
              <Heading size="md" mb={4}>Office Moves</Heading>
              <Text color="gray.600">
                Efficient office relocation with minimal downtime for Fareham businesses.
              </Text>
            </Box>
            <Box bg="white" p={6} borderRadius="lg" shadow="md">
              <Heading size="md" mb={4}>Furniture Delivery</Heading>
              <Text color="gray.600">
                Safe delivery of furniture and large items across Fareham.
              </Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Container maxW="container.xl" py={16}>
        <Heading textAlign="center" mb={12}>
          Transparent Pricing for Fareham
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <Box borderWidth={1} borderRadius="lg" p={6} textAlign="center">
            <Heading size="lg" mb={2}>£25/hr</Heading>
            <Text fontWeight="bold" mb={4}>Small Van</Text>
            <Text color="gray.600">Perfect for small moves and deliveries in Fareham</Text>
          </Box>
          <Box borderRadius="lg" p={6} textAlign="center" borderColor="brand.500" borderWidth={2}>
            <Heading size="lg" mb={2}>£35/hr</Heading>
            <Text fontWeight="bold" mb={4}>Medium Van</Text>
            <Text color="gray.600">Ideal for 1-2 bedroom moves in Fareham</Text>
          </Box>
          <Box borderWidth={1} borderRadius="lg" p={6} textAlign="center">
            <Heading size="lg" mb={2}>£45/hr</Heading>
            <Text fontWeight="bold" mb={4}>Luton Van</Text>
            <Text color="gray.600">Best for large moves and office relocations in Fareham</Text>
          </Box>
        </SimpleGrid>
      </Container>

      {/* CTA Section */}
      <Box bg="brand.500" color="white" py={16}>
        <Container maxW="container.xl" textAlign="center">
          <Heading mb={4}>Ready to Book Your Fareham Move?</Heading>
          <Text fontSize="lg" mb={8}>
            Get an instant quote or call us now for same-day service in Fareham
          </Text>
          <Stack direction={{ base: 'column', md: 'row' }} spacing={4} justify="center">
            <Link href="/quote">
              <Button size="lg" bg="white" color="brand.500" _hover={{ bg: 'gray.100' }}>
                Get Instant Quote
              </Button>
            </Link>
            <Link href="tel:01202129746">
              <Button size="lg" variant="outline" borderColor="white" color="white" _hover={{ bg: 'whiteAlpha.200' }} leftIcon={<FaPhone />}>
                Call 01202 129746
              </Button>
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
