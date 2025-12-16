'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import places from '@/data/places.json';
import { Box, Container, Heading, Text, Button, SimpleGrid, VStack, HStack, Icon, Flex, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiMapPin, FiTruck, FiCheckCircle, FiClock, FiShield, FiPhone } from 'react-icons/fi';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface RegionPageProps {
  params: { region: string };
}

export default function RegionPage({ params }: RegionPageProps) {
  const regionName = params.region
    .replace(/-/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  const regionPlaces = places.places.filter(
    (p: any) =>
      p.region && p.region.toLowerCase().replace(/\s+/g, '-') === params.region
  );

  return (
    <Box bg="gray.900" minH="100vh">
      {/* Hero Section with Animation */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        position="relative"
        overflow="hidden"
        bg="linear-gradient(135deg, #0D0D0D 0%, #1A1A1A 100%)"
        borderBottom="2px solid"
        borderColor="neon.500"
      >
        {/* Animated Background Pattern */}
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity="0.1"
          bgImage="radial-gradient(circle at 20% 50%, rgba(0, 224, 255, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(57, 255, 20, 0.3) 0%, transparent 50%)"
          animation="pulse 8s ease-in-out infinite"
        />

        <Container maxW="7xl" position="relative" py={{ base: 16, md: 24 }}>
          <VStack spacing={8} textAlign="center">
            <MotionBox
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <HStack justify="center" mb={4}>
                <Icon as={FiMapPin} boxSize={8} color="neon.400" />
                <Badge
                  colorScheme="green"
                  fontSize="md"
                  px={4}
                  py={2}
                  borderRadius="full"
                >
                  {regionPlaces.length} Areas Covered
                </Badge>
              </HStack>
              
              <Heading
                fontSize={{ base: '3xl', md: '5xl', lg: '6xl' }}
                fontWeight="bold"
                bgGradient="linear(to-r, neon.400, green.400)"
                bgClip="text"
                mb={4}
              >
                Man and Van in {regionName}
              </Heading>
            </MotionBox>

            <MotionBox
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                color="gray.300"
                maxW="3xl"
                mb={8}
              >
                Professional removal services across {regionName}. Fast, reliable, and
                fully insured moving solutions with instant online quotes.
              </Text>

              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Button
                  as={Link}
                  href="/booking-luxury"
                  size="lg"
                  bg="neon.500"
                  color="gray.900"
                  _hover={{
                    bg: 'neon.400',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 0 20px rgba(0, 224, 255, 0.5)'
                  }}
                  leftIcon={<FiTruck />}
                  px={8}
                  py={6}
                  fontSize="lg"
                  borderRadius="xl"
                  transition="all 0.3s"
                >
                  Get Instant Quote
                </Button>
                <Button
                  as={Link}
                  href={`tel:+442045429762`}
                  size="lg"
                  variant="outline"
                  borderColor="neon.500"
                  color="neon.400"
                  _hover={{
                    bg: 'rgba(0, 224, 255, 0.1)',
                    transform: 'translateY(-2px)'
                  }}
                  leftIcon={<FiPhone />}
                  px={8}
                  py={6}
                  fontSize="lg"
                  borderRadius="xl"
                  transition="all 0.3s"
                >
                  020 4542 9762
                </Button>
              </HStack>
            </MotionBox>
          </VStack>
        </Container>
      </MotionBox>

      {/* Features Section */}
      <Container maxW="7xl" py={16}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mb={16}>
          {[
            { icon: FiClock, title: '24/7 Availability', desc: 'Book anytime, move anytime' },
            { icon: FiShield, title: '100% Insured', desc: 'Full coverage on all moves' },
            { icon: FiCheckCircle, title: 'Fixed Prices', desc: 'No hidden fees or surprises' }
          ].map((feature, i) => (
            <MotionBox
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              bg="gray.800"
              p={6}
              borderRadius="xl"
              border="1px solid"
              borderColor="gray.700"
              _hover={{
                borderColor: 'neon.500',
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 30px rgba(0, 224, 255, 0.2)'
              }}
              sx={{ transition: 'all 0.3s' }}
            >
              <Icon as={feature.icon} boxSize={10} color="neon.400" mb={4} />
              <Heading size="md" color="white" mb={2}>
                {feature.title}
              </Heading>
              <Text color="gray.400">{feature.desc}</Text>
            </MotionBox>
          ))}
        </SimpleGrid>

        {/* Coverage Stats */}
        <MotionBox
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          bg="gray.800"
          p={8}
          borderRadius="2xl"
          border="2px solid"
          borderColor="neon.500"
          mb={16}
        >
          <Heading size="lg" color="white" mb={8} textAlign="center">
            Coverage in {regionName}
          </Heading>
          <Text color="gray.300" fontSize="lg" textAlign="center" mb={8} maxW="3xl" mx="auto">
            We provide comprehensive removal services across {regionName}, from
            major cities to smaller towns and villages. Our network of
            professional movers ensures reliable service wherever you are.
          </Text>
          
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <VStack>
              <Text fontSize="5xl" fontWeight="bold" color="neon.400">
                {regionPlaces.length}
              </Text>
              <Text color="gray.400" fontSize="lg">Areas Covered</Text>
            </VStack>
            <VStack>
              <Text fontSize="5xl" fontWeight="bold" color="green.400">
                24/7
              </Text>
              <Text color="gray.400" fontSize="lg">Availability</Text>
            </VStack>
            <VStack>
              <Text fontSize="5xl" fontWeight="bold" color="neon.400">
                100%
              </Text>
              <Text color="gray.400" fontSize="lg">Insured</Text>
            </VStack>
          </SimpleGrid>
        </MotionBox>

        {/* Areas Grid */}
        <Box mb={16}>
          <Heading size="lg" color="white" mb={8}>
            <Icon as={FiMapPin} color="neon.400" mr={3} />
            Areas we cover in {regionName}
          </Heading>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {regionPlaces.map((place: any, i: number) => (
              <Link key={place.slug} href={`/uk/${place.slug}`}>
                <MotionBox
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  viewport={{ once: true }}
                  bg="gray.800"
                  p={5}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{
                    borderColor: 'neon.500',
                    bg: 'gray.750',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 5px 20px rgba(0, 224, 255, 0.15)'
                  }}
                  sx={{ transition: 'all 0.3s' }}
                  cursor="pointer"
                >
                  <Heading size="sm" color="white" mb={2}>
                    {place.name}
                  </Heading>
                  <Text color="gray.500" fontSize="sm" mb={2}>
                    {place.type}
                  </Text>
                  {place.population && (
                    <Text color="neon.400" fontSize="sm" fontWeight="semibold">
                      {place.population.toLocaleString()} people
                    </Text>
                  )}
                </MotionBox>
              </Link>
            ))}
          </SimpleGrid>
        </Box>

        {/* Other Regions */}
        <Box>
          <Heading size="lg" color="white" mb={6}>
            Other UK Regions
          </Heading>
          <Flex gap={3} flexWrap="wrap">
            {[...new Set(places.places.map((p: any) => p.region).filter(Boolean))]
              .filter(r => r !== regionName)
              .slice(0, 8)
              .map(region => (
                <Button
                  key={region as string}
                  as={Link}
                  href={`/uk/regions/${(region as string).toLowerCase().replace(/\s+/g, '-')}`}
                  variant="outline"
                  borderColor="gray.700"
                  color="gray.300"
                  _hover={{
                    borderColor: 'neon.500',
                    color: 'neon.400',
                    bg: 'rgba(0, 224, 255, 0.1)'
                  }}
                  size="md"
                >
                  {region as string}
                </Button>
              ))}
          </Flex>
        </Box>
      </Container>

      {/* CTA Section */}
      <MotionBox
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        bg="linear-gradient(135deg, rgba(0, 224, 255, 0.1) 0%, rgba(57, 255, 20, 0.1) 100%)"
        borderTop="2px solid"
        borderColor="neon.500"
        py={16}
      >
        <Container maxW="4xl" textAlign="center">
          <Heading size="xl" color="white" mb={4}>
            Ready to move in {regionName}?
          </Heading>
          <Text color="gray.300" fontSize="lg" mb={8}>
            Get your instant quote in under 60 seconds
          </Text>
          <Button
            as={Link}
            href="/booking-luxury"
            size="lg"
            bg="neon.500"
            color="gray.900"
            _hover={{
              bg: 'neon.400',
              transform: 'scale(1.05)',
              boxShadow: '0 0 30px rgba(0, 224, 255, 0.6)'
            }}
            px={12}
            py={7}
            fontSize="xl"
            borderRadius="xl"
            transition="all 0.3s"
          >
            Book Your Move Now
          </Button>
        </Container>
      </MotionBox>
    </Box>
  );
}
