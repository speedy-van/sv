'use client';

import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack,
  SimpleGrid, 
  Link as ChakraLink,
  Icon,
  Badge,
  Flex,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FaTruck, FaShieldAlt, FaClock, FaStar, FaMapMarkerAlt } from 'react-icons/fa';
import { FiCheckCircle, FiArrowRight, FiPhone } from 'react-icons/fi';
import Link from 'next/link';
import { locations } from '@/data/locations';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

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

  const features = [
    { icon: FaShieldAlt, title: 'Fully Insured', desc: 'Up to £10,000 cover' },
    { icon: FaClock, title: '24/7 Booking', desc: 'Book anytime online' },
    { icon: FaStar, title: '5-Star Rated', desc: '50,000+ happy customers' },
    { icon: FaTruck, title: 'Same Day', desc: 'Available nationwide' },
  ];

  return (
    <>
      <Header />
      <MobileHeader />
      <Box bg="gray.900" minH="100vh">
        {/* Hero */}
        <Box 
          bgGradient="linear(to-br, blue.900, purple.900, gray.900)" 
          color="white" 
          py={{ base: 20, md: 28 }}
          pt={{ base: 32, md: 36 }}
          position="relative"
          overflow="hidden"
        >
          {/* Background decoration */}
          <Box
            position="absolute"
            top="-50%"
            right="-20%"
            width="60%"
            height="200%"
            bg="whiteAlpha.50"
            transform="rotate(-12deg)"
            borderRadius="3xl"
          />
          
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <VStack spacing={8} align={{ base: 'center', md: 'start' }} textAlign={{ base: 'center', md: 'left' }}>
              <Badge colorScheme="blue" fontSize="md" px={4} py={2} borderRadius="full">
                <HStack spacing={2}>
                  <Icon as={FaTruck} />
                  <Text>UK&apos;s #1 Man and Van Service</Text>
                </HStack>
              </Badge>
              
              <Heading as="h1" size={{ base: 'xl', md: '3xl' }} fontWeight="bold" maxW="800px" lineHeight="shorter">
                Man & Van, Done Right
              </Heading>
              
              <Text fontSize={{ base: 'lg', md: 'xl' }} maxW="600px" color="gray.300">
                From just £25/hour. Trusted by 50,000+ customers. Available 24/7 across the UK. Instant quotes, fully insured, 5-star rated.
              </Text>
              
              <Flex wrap="wrap" gap={4} justify={{ base: 'center', md: 'start' }}>
                <Button
                  as={Link}
                  href="/booking-luxury"
                  size="lg"
                  colorScheme="blue"
                  rightIcon={<FiArrowRight />}
                  px={8}
                >
                  Get Instant Quote
                </Button>
                <Button
                  as="a"
                  href="tel:+441202129746"
                  size="lg"
                  variant="outline"
                  color="white"
                  borderColor="whiteAlpha.400"
                  leftIcon={<FiPhone />}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  01202 129746
                </Button>
              </Flex>

              {/* Features */}
              <Flex wrap="wrap" gap={4} mt={4} justify={{ base: 'center', md: 'start' }}>
                {features.map((feature, idx) => (
                  <Box 
                    key={idx}
                    bg="whiteAlpha.100" 
                    px={4} 
                    py={3} 
                    borderRadius="lg"
                    backdropFilter="blur(10px)"
                  >
                    <HStack spacing={3}>
                      <Icon as={feature.icon} color="blue.400" />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">{feature.title}</Text>
                        <Text fontSize="xs" color="gray.400">{feature.desc}</Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </Flex>
            </VStack>
          </Container>
        </Box>

        {/* What We Offer Section */}
        <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
          <VStack spacing={10}>
            <Box textAlign="center">
              <Heading size="xl" color="white" mb={4}>Why Choose Our Man and Van?</Heading>
              <Text color="gray.400" maxW="600px" mx="auto">
                Professional, reliable, and affordable moving services tailored to your needs.
              </Text>
            </Box>

            <Flex wrap="wrap" gap={6} justify="center">
              {[
                { title: 'Single Item Moves', desc: 'Perfect for furniture, appliances, or one-off deliveries', price: 'From £49' },
                { title: 'Small Moves', desc: 'Studio flats, student rooms, or partial house moves', price: 'From £99' },
                { title: 'Full House Moves', desc: 'Complete home removals with packing options available', price: 'From £199' },
                { title: 'Office Relocations', desc: 'Efficient business moves with minimal downtime', price: 'Custom Quote' },
              ].map((service, idx) => (
                <Box 
                  key={idx}
                  flex={{ base: '1 1 100%', md: '1 1 calc(50% - 12px)', lg: '1 1 calc(25% - 18px)' }}
                  minW={{ base: '280px', md: '280px' }}
                  maxW={{ base: '100%', md: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' }}
                >
                  <Card bg="gray.800" borderWidth="1px" borderColor="gray.700" h="full" _hover={{ borderColor: 'blue.500', transform: 'translateY(-4px)' }} transition="all 0.3s">
                    <CardBody>
                      <VStack align="start" spacing={3}>
                        <Badge colorScheme="blue">{service.price}</Badge>
                        <Heading size="md" color="white">{service.title}</Heading>
                        <Text color="gray.400" fontSize="sm">{service.desc}</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </Box>
              ))}
            </Flex>
          </VStack>
        </Container>

        {/* Locations Directory */}
        <Box bg="gray.800" py={{ base: 12, md: 16 }}>
          <Container maxW="container.xl">
            <VStack spacing={8} align="start">
              <Box textAlign={{ base: 'center', md: 'left' }} w="full">
                <Badge colorScheme="green" mb={4}>
                  <HStack spacing={2}>
                    <Icon as={FaMapMarkerAlt} />
                    <Text>{locations.length}+ Locations</Text>
                  </HStack>
                </Badge>
                <Heading size="xl" color="white" mb={2}>Find Man and Van in Your Area</Heading>
                <Text color="gray.400">Click on your city to see local pricing and availability</Text>
              </Box>
              
              {sortedLetters.map((letter) => (
                <Box key={letter} w="full">
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="blue.400" 
                    mb={4}
                    pb={2}
                    borderBottom="2px solid"
                    borderColor="blue.900"
                  >
                    {letter}
                  </Text>
                  <Flex wrap="wrap" gap={3}>
                    {groupedLocations[letter].map((location) => (
                      <Button
                        key={location.slug}
                        as={Link}
                        href={`/man-and-van/${location.slug}`}
                        size="sm"
                        variant="outline"
                        color="gray.300"
                        borderColor="gray.600"
                        _hover={{ 
                          bg: 'blue.600', 
                          borderColor: 'blue.600',
                          color: 'white',
                          transform: 'translateY(-2px)'
                        }}
                        transition="all 0.2s"
                        leftIcon={<FaMapMarkerAlt />}
                      >
                        {location.name}
                      </Button>
                    ))}
                  </Flex>
                </Box>
              ))}
            </VStack>
          </Container>
        </Box>

        {/* CTA */}
        <Box bgGradient="linear(to-r, blue.900, purple.900)" py={16}>
          <Container maxW="container.xl">
            <VStack spacing={6} textAlign="center">
              <Heading size="xl" color="white">Don&apos;t See Your Location?</Heading>
              <Text fontSize="lg" color="gray.300" maxW="600px">
                We cover the entire UK! Get an instant quote for anywhere in the country.
              </Text>
              <Flex wrap="wrap" gap={4} justify="center">
                <Button 
                  as={Link}
                  href="/booking-luxury" 
                  size="lg" 
                  colorScheme="blue" 
                  rightIcon={<FiArrowRight />}
                >
                  Get Instant Quote
                </Button>
                <Button
                  as="a"
                  href="tel:+441202129746"
                  size="lg"
                  variant="outline"
                  color="white"
                  borderColor="white"
                  leftIcon={<FiPhone />}
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  Call Us Now
                </Button>
              </Flex>
              
              {/* Trust badges */}
              <Flex wrap="wrap" gap={6} justify="center" mt={4}>
                {['✓ Free Quotes', '✓ No Hidden Fees', '✓ Fully Insured', '✓ 24/7 Support'].map((item, idx) => (
                  <Text key={idx} color="gray.300" fontSize="sm">{item}</Text>
                ))}
              </Flex>
            </VStack>
          </Container>
        </Box>
      </Box>
    </>
  );
}
