'use client';

import Link from 'next/link';
import { Box, Container, Heading, Text, Button, SimpleGrid, VStack, HStack, Icon, Flex, Badge } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiMapPin, FiTruck, FiCheckCircle, FiClock, FiShield, FiPhone } from 'react-icons/fi';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface RegionPageClientProps {
  regionName: string;
  regionPlaces: any[];
}

export default function RegionPageClient({ regionName, regionPlaces }: RegionPageClientProps) {
  return (
    <Box bg="gray.900" minH="100vh">
      {/* Hero Section with Animation */}
      <MotionBox
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transitionDuration="0.8"
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

        <Container maxW="7xl" position="relative" py={{ base: 24, md: 40 }}>
          <VStack spacing={8} textAlign="center">
            <MotionBox
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transitionDuration="0.6"
            >
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
              transitionDuration="0.6"
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
                  sx={{ transition: 'all 0.3s' }}
                >
                  Get Instant Quote
                </Button>
                <Button
                  as={Link}
                  href={`tel:+441202129746`}
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
                  sx={{ transition: 'all 0.3s' }}
                >
                  01202 129746
                </Button>
              </HStack>
            </MotionBox>
          </VStack>
        </Container>
      </MotionBox>

      {/* Features Section */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={6} align="stretch">
          {[
            {
              icon: FiClock,
              title: '24/7 Availability',
              description: 'Same-day and next-day service available across all areas'
            },
            {
              icon: FiShield,
              title: 'Fully Insured',
              description: 'Comprehensive insurance coverage for your peace of mind'
            },
            {
              icon: FiCheckCircle,
              title: 'Fixed Prices',
              description: 'No hidden fees - what you see is what you pay'
            }
          ].map((feature, idx) => (
            <MotionBox
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transitionDuration="0.5"
              viewport={{ once: true }}
              bg="gray.800"
              p={6}
              borderRadius="2xl"
              border="1px solid"
              borderColor="gray.700"
              w="full"
              _hover={{
                borderColor: 'neon.500',
                transform: 'translateY(-8px)',
                boxShadow: '0 10px 40px rgba(0, 224, 255, 0.2)'
              }}
              sx={{ transition: 'all 0.3s' }}
            >
              <HStack spacing={4} align="start">
                <Icon as={feature.icon} boxSize={{ base: 10, md: 12 }} color="neon.400" flexShrink={0} />
                <VStack align="start" spacing={2} flex={1}>
                  <Heading size="md" color="white">
                    {feature.title}
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    {feature.description}
                  </Text>
                </VStack>
              </HStack>
            </MotionBox>
          ))}
        </VStack>
      </Container>

      {/* Stats Section */}
      <Box bg="gray.800" py={16} borderY="2px solid" borderColor="gray.700">
        <Container maxW="7xl">
          <VStack spacing={6} align="stretch">
            {[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '98%', label: 'Satisfaction Rate' },
              { value: '24/7', label: 'Customer Support' }
            ].map((stat, idx) => (
              <HStack key={idx} spacing={4} justify={{ base: 'start', md: 'center' }} p={{ base: 4, md: 0 }}>
                <Text
                  fontSize={{ base: '3xl', md: '5xl' }}
                  fontWeight="bold"
                  bgGradient="linear(to-r, neon.400, green.400)"
                  bgClip="text"
                  minW={{ base: '100px', md: 'auto' }}
                >
                  {stat.value}
                </Text>
                <Text color="gray.400" fontSize={{ base: 'md', md: 'lg' }} textAlign="left">
                  {stat.label}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Container>
      </Box>

      {/* Areas Covered Section */}
      {regionPlaces.length > 0 && (
        <Container maxW="7xl" py={20}>
          <MotionBox
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transitionDuration="0.8"
            viewport={{ once: true }}
            textAlign="center"
            mb={12}
          >
            <Heading size="2xl" color="white" mb={4}>
              Areas We Cover in {regionName}
            </Heading>
            <Text color="gray.400" fontSize="lg">
              Professional man and van services across all cities in {regionName} except islands.
            </Text>
          </MotionBox>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {regionPlaces.map((place: any, idx: number) => (
              <MotionBox
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transitionDuration="0.4"
                viewport={{ once: true }}
              >
                <Box
                  as={Link}
                  href={`/uk/${place.slug}`}
                  display="block"
                  bg="gray.800"
                  p={6}
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="gray.700"
                  _hover={{
                    borderColor: 'neon.500',
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0, 224, 255, 0.15)'
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  <HStack spacing={3}>
                    <Icon as={FiMapPin} color="neon.400" boxSize={5} />
                    <Heading size="sm" color="white">
                      {place.name}
                    </Heading>
                  </HStack>
                  <Text color="gray.500" fontSize="sm" mt={2}>
                    {place.postcode || 'Full coverage'}
                  </Text>
                </Box>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Container>
      )}

      {/* CTA Section */}
      <MotionBox
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transitionDuration="0.8"
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
            sx={{ transition: 'all 0.3s' }}
          >
            Book Your Move Now
          </Button>
        </Container>
      </MotionBox>
    </Box>
  );
}
