import type { Metadata } from 'next';
import { Box, Container, Heading, Text, Button, VStack, SimpleGrid, Link as ChakraLink } from '@chakra-ui/react';
import { FaTruck } from 'react-icons/fa';
import Link from 'next/link';
import { locations } from '@/data/locations';

export const metadata: Metadata = {
  title: 'Man and Van Services UK | 24/7 Removals | Speedy Van',
  description: 'Professional man and van services across the UK. 24/7 online booking, instant quotes, fully insured. From £25/hour. Same-day service available.',
  keywords: 'man and van uk, removals uk, van hire uk, delivery service uk',
};

export default function ManAndVanIndexPage() {
  // Group locations by first letter
  const groupedLocations = locations.reduce((acc, location) => {
    const firstLetter = location.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(location);
    return acc;
  }, {} as Record<string, typeof locations>);

  const sortedLetters = Object.keys(groupedLocations).sort();

  return (
    <Box>
      {/* Hero */}
      <Box bg="brand.500" color="white" py={{ base: 12, md: 20 }}>
        <Container maxW="container.xl">
          <VStack spacing={6} align="start">
            <Heading as="h1" size="2xl" fontWeight="bold">
              Man and Van Services Across the UK
            </Heading>
            <Text fontSize="xl" maxW="2xl">
              Professional removal and delivery service available 24/7 in {locations.length}+ UK locations.
              Instant online booking, fully insured, from just £25/hour.
            </Text>
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
          </VStack>
        </Container>
      </Box>

      {/* Locations Directory */}
      <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
        <Heading size="xl" mb={8}>Find Man and Van Services in Your Area</Heading>
        
        {sortedLetters.map((letter) => (
          <Box key={letter} mb={8}>
            <Heading size="md" mb={4} color="brand.500">{letter}</Heading>
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {groupedLocations[letter].map((location) => (
                <ChakraLink
                  key={location.slug}
                  as={Link}
                  href={`/man-and-van/${location.slug}`}
                  color="gray.700"
                  _hover={{ color: 'brand.500', textDecoration: 'underline' }}
                >
                  {location.name}
                </ChakraLink>
              ))}
            </SimpleGrid>
          </Box>
        ))}

        {/* CTA */}
        <Box mt={16} textAlign="center" bg="gray.50" p={8} borderRadius="lg">
          <Heading size="lg" mb={4}>Don't See Your Location?</Heading>
          <Text mb={6}>We serve the entire UK. Get an instant quote for your area.</Text>
          <Link href="/booking-luxury">
            <Button size="lg" colorScheme="brand" leftIcon={<FaTruck />}>
              Get Instant Quote
            </Button>
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
