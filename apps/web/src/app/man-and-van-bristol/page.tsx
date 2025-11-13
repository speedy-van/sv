import type { Metadata } from 'next'
import { Box, Container, Heading, Text, Button, VStack, HStack, SimpleGrid, Icon, Flex } from '@chakra-ui/react'
import { FaPhone, FaClock, FaCheckCircle, FaStar, FaTruck } from 'react-icons/fa'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Man and Van Bristol | 24/7 Removals & Delivery | Speedy Van',
  description: 'Professional man and van service in Bristol. 24/7 online booking, instant quotes, fully insured. From £25/hour. Call 01202 129746 for same-day service.',
  keywords: 'man and van bristol, removals bristol, van hire bristol, delivery service bristol, house removals bristol',
  openGraph: {
    title: 'Man and Van Bristol | 24/7 Removals & Delivery',
    description: 'Professional man and van service in Bristol. Instant quotes, fully insured, from £25/hour.',
    type: 'website',
  },
}

export default function ManAndVanBristolPage() {
  return (
    <Box>
      {/* Hero Section */}
      <Box bg="brand.500" color="white" py={{ base: 12, md: 20 }}>
        <Container maxW="container.xl">
          <VStack spacing={{6}} align="start">
            <Heading as="h1" size="2xl" fontWeight="bold">
              Man and Van Bristol
            </Heading>
            <Text fontSize="xl" maxW="2xl">
              Professional removal and delivery service in Bristol. Available 24/7 with instant online booking.
              Fully insured, reliable, and affordable from just £25/hour.
            </Text>
            <HStack spacing={{4}} flexWrap="wrap">
              <Button
                as={{Link}}
                href="/booking-luxury"
                size="lg"
                bg="white"
                color="brand.500"
                _hover={{ bg: 'gray.100' }}
                leftIcon={{<Icon as={{FaTruck}} />}}
              >
                Get Instant Quote
              </Button>
              <Button
                as="a"
                href="tel:01202129746"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={{<Icon as={{FaPhone}} />}}
              >
                Call 01202 129746
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Box py={{16}} bg="gray.50">
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={{8}} textAlign="center">
            Why Choose Our Bristol Man and Van Service?
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{8}}>
            <VStack align="start" spacing={{3}}>
              <Icon as={{FaClock}} boxSize={{8}} color="brand.500" />
              <Heading as="h3" size="md">24/7 Availability</Heading>
              <Text color="gray.600">
                Book online anytime. Phone support 9AM-6PM, 7 days a week.
              </Text>
            </VStack>
            <VStack align="start" spacing={{3}}>
              <Icon as={{FaCheckCircle}} boxSize={{8}} color="brand.500" />
              <Heading as="h3" size="md">Fully Insured</Heading>
              <Text color="gray.600">
                Comprehensive goods in transit insurance for complete peace of mind.
              </Text>
            </VStack>
            <VStack align="start" spacing={{3}}>
              <Icon as={{FaStar}} boxSize={{8}} color="brand.500" />
              <Heading as="h3" size="md">Professional Service</Heading>
              <Text color="gray.600">
                Experienced drivers, careful handling, and excellent customer service.
              </Text>
            </VStack>
            <VStack align="start" spacing={{3}}>
              <Icon as={{FaTruck}} boxSize={{8}} color="brand.500" />
              <Heading as="h3" size="md">Modern Fleet</Heading>
              <Text color="gray.600">
                Well-maintained vans from small to Luton size for any job.
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box py={{16}}>
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={{8}}>
            Our Bristol Services
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{8}}>
            <Box p={{6}} borderWidth={{1}} borderRadius="lg">
              <Heading as="h3" size="md" mb={{3}}>House Removals</Heading>
              <Text color="gray.600">
                Full house or flat removals in Bristol. From single items to entire properties.
                Professional packing service available.
              </Text>
            </Box>
            <Box p={{6}} borderWidth={{1}} borderRadius="lg">
              <Heading as="h3" size="md" mb={{3}}>Office Moves</Heading>
              <Text color="gray.600">
                Business relocations with minimal disruption. Evening and weekend moves available
                to keep your Bristol business running.
              </Text>
            </Box>
            <Box p={{6}} borderWidth={{1}} borderRadius="lg">
              <Heading as="h3" size="md" mb={{3}}>Furniture Delivery</Heading>
              <Text color="gray.600">
                Collect and deliver furniture anywhere in Bristol. Same-day service available
                for urgent deliveries.
              </Text>
            </Box>
            <Box p={{6}} borderWidth={{1}} borderRadius="lg">
              <Heading as="h3" size="md" mb={{3}}>Student Moves</Heading>
              <Text color="gray.600">
                Affordable student removal service in Bristol. Perfect for university accommodation
                moves and storage collection.
              </Text>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box py={{16}} bg="gray.50">
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={{8}} textAlign="center">
            Transparent Pricing in Bristol
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={{8}}>
            <Box bg="white" p={{8}} borderRadius="lg" borderWidth={{1}}>
              <Heading as="h3" size="lg" mb={{2}}>Small Van</Heading>
              <Text fontSize="3xl" fontWeight="bold" color="brand.500" mb={{4}}>£25/hr</Text>
              <VStack align="start" spacing={{2}}>
                <Text>✓ Perfect for small moves</Text>
                <Text>✓ 1-2 bedroom flat</Text>
                <Text>✓ Single items</Text>
                <Text>✓ 2-hour minimum</Text>
              </VStack>
            </Box>
            <Box bg="white" p={{8}} borderRadius="lg" borderWidth={{2}} borderColor="brand.500">
              <Heading as="h3" size="lg" mb={{2}}>Medium Van</Heading>
              <Text fontSize="3xl" fontWeight="bold" color="brand.500" mb={{4}}>£35/hr</Text>
              <VStack align="start" spacing={{2}}>
                <Text>✓ Most popular choice</Text>
                <Text>✓ 2-3 bedroom house</Text>
                <Text>✓ Office moves</Text>
                <Text>✓ 2-hour minimum</Text>
              </VStack>
            </Box>
            <Box bg="white" p={{8}} borderRadius="lg" borderWidth={{1}}>
              <Heading as="h3" size="lg" mb={{2}}>Luton Van</Heading>
              <Text fontSize="3xl" fontWeight="bold" color="brand.500" mb={{4}}>£45/hr</Text>
              <VStack align="start" spacing={{2}}>
                <Text>✓ Large capacity</Text>
                <Text>✓ 3-4 bedroom house</Text>
                <Text>✓ Tail lift available</Text>
                <Text>✓ 3-hour minimum</Text>
              </VStack>
            </Box>
          </SimpleGrid>
          <Flex justify="center" mt={{8}}>
            <Button
              as={{Link}}
              href="/booking-luxury"
              size="lg"
              colorScheme="brand"
              leftIcon={{<Icon as={{FaTruck}} />}}
            >
              Get Your Instant Quote
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Coverage Section */}
      <Box py={{16}}>
        <Container maxW="container.xl">
          <Heading as="h2" size="xl" mb={{6}}>
            Serving All of Bristol
          </Heading>
          <Text fontSize="lg" color="gray.600" mb={{6}}>
            Our man and van service covers all areas of Bristol and surrounding regions.
            Whether you're in the city centre or suburbs, we provide fast, reliable service
            with no hidden charges.
          </Text>
          <Text fontSize="lg" color="gray.600" mb={{8}}>
            We also offer competitive rates for moves between Bristol and other UK cities.
            Get an instant quote online or call us for long-distance pricing.
          </Text>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{16}} bg="brand.500" color="white">
        <Container maxW="container.xl">
          <VStack spacing={{6}}>
            <Heading as="h2" size="xl" textAlign="center">
              Ready to Book Your Bristol Man and Van?
            </Heading>
            <Text fontSize="lg" textAlign="center" maxW="2xl">
              Get an instant online quote in 60 seconds. No registration required.
              Book now and we'll confirm your booking immediately.
            </Text>
            <HStack spacing={{4}} flexWrap="wrap">
              <Button
                as={{Link}}
                href="/booking-luxury"
                size="lg"
                bg="white"
                color="brand.500"
                _hover={{ bg: 'gray.100' }}
              >
                Book Online Now
              </Button>
              <Button
                as="a"
                href="tel:01202129746"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Or Call 01202 129746
              </Button>
            </HStack>
            <Text fontSize="sm" opacity={{0.9}}>
              Phone support: 9AM-6PM, 7 days a week | Online booking: 24/7
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}
