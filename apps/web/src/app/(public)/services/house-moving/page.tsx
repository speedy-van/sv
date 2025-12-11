'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Badge,
  chakra,
  shouldForwardProp,
  Button,
  useColorModeValue,
  Image,
  List,
  ListItem,
  ListIcon,
  Divider,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiHome,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiTruck,
  FiPackage,
  FiUsers,
  FiStar,
  FiPhone,
  FiArrowRight,
  FiMapPin,
} from 'react-icons/fi';
import HeaderButton from '@/components/common/HeaderButton';
import Header from '@/components/site/Header';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
    }
    return true;
  },
});

const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
    }
    return true;
  },
});

const services = [
  {
    title: 'Full Packing Service',
    description: 'Professional packing of all your belongings with premium materials',
    icon: FiPackage,
    features: ['Bubble wrap & boxes included', 'Fragile item protection', 'Labeling system']
  },
  {
    title: 'Furniture Assembly',
    description: 'Expert disassembly and reassembly of furniture at your new home',
    icon: FiHome,
    features: ['All tools provided', 'Warranty protection', 'Quick turnaround']
  },
  {
    title: 'Loading & Transport',
    description: 'Safe loading, secure transport, and careful unloading',
    icon: FiTruck,
    features: ['Professional equipment', 'GPS tracking', 'Real-time updates']
  },
  {
    title: 'Storage Solutions',
    description: 'Temporary or long-term storage in secure facilities',
    icon: FiShield,
    features: ['Climate controlled', '24/7 security', 'Flexible terms']
  }
];

const pricingTiers = [
  {
    name: 'Studio/1 Bed',
    price: '£150-250',
    duration: '2-4 hours',
    team: '2 movers',
    van: 'Medium van',
    features: [
      'Up to 15 boxes',
      'Basic furniture',
      'Same day service',
      'Insurance included'
    ]
  },
  {
    name: '2-3 Bedroom',
    price: '£300-450',
    duration: '4-6 hours',
    team: '3 movers',
    van: 'Large van',
    features: [
      'Up to 40 boxes',
      'All furniture',
      'Packing service',
      'Insurance included'
    ]
  },
  {
    name: '4+ Bedroom',
    price: '£500+',
    duration: '6-8 hours',
    team: '4+ movers',
    van: 'Multiple vans',
    features: [
      'Unlimited boxes',
      'Full house service',
      'Premium packing',
      'Comprehensive insurance'
    ]
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    location: 'Manchester',
    rating: 5,
    text: 'Absolutely fantastic service! The team was professional, careful with our belongings, and completed our 3-bedroom move in just 5 hours.'
  },
  {
    name: 'David Smith',
    location: 'Birmingham',
    rating: 5,
    text: 'Best moving experience we\'ve ever had. They handled our antique furniture with extreme care and everything arrived in perfect condition.'
  }
];

export default function HouseMovingPage() {
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <Box bg={bgColor} minH="100vh">
      <Header />
      <Container maxW="container.xl" py={{ base: 6, md: 16 }} px={{ base: 4, md: 6 }} pt={{ base: 24, md: 32 }}>
        <VStack spacing={16}>
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="4xl"
            position="relative"
          >
            <HStack justify="center" mb={6}>
              <Box
                p={5}
                bg="rgba(0,255,157,0.2)"
                borderRadius="2xl"
                border="2px solid"
                borderColor="rgba(0,255,157,0.4)"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '2xl',
                  background: 'linear-gradient(135deg, rgba(0,255,157,0.5), rgba(34,197,94,0.5))',
                  filter: 'blur(10px)',
                  opacity: 0.6,
                  zIndex: -1,
                }}
              >
                <Icon as={FiHome} boxSize={14} color="rgba(0,255,157,1)" />
              </Box>
            </HStack>
            <Badge
              colorScheme="green"
              variant="subtle"
              fontSize="sm"
              px={4}
              py={1}
              borderRadius="full"
              mb={4}
              textTransform="none"
            >
              ✓ Professional & Reliable
            </Badge>
            <Heading
              size={{ base: 'xl', md: '3xl' }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, neon.400, green.300, emerald.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              House Moving Services
            </Heading>
            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.300" lineHeight="tall" maxW="3xl" mx="auto" mb={6}>
              <Box as="span" color="neon.400" fontWeight="bold">Professional residential moving services</Box> for homes and apartments.{' '}
              From <Box as="span" color="green.400" fontWeight="semibold">studio flats</Box> to{' '}
              <Box as="span" color="green.400" fontWeight="semibold">large family homes</Box>, we handle your move with{' '}
              care and expertise.
            </Text>
            <HStack 
              justify="center" 
              spacing={6} 
              flexWrap="wrap"
              p={5}
              bg="rgba(0,255,157,0.05)"
              borderRadius="xl"
              border="1px solid rgba(0,255,157,0.2)"
            >
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiShield color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">Fully Insured</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiCheckCircle color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">Expert Team</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiClock color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">On-Time Delivery</Text>
                </HStack>
              </VStack>
            </HStack>
          </MotionBox>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 4, md: 6 }} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
                border="1px solid"
                borderColor="rgba(0, 255, 157, 0.1)"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 40px rgba(0, 255, 157, 0.2)',
                  borderColor: 'neon.400',
                }}
                sx={{ transition: 'all 0.3s ease' }}
                cursor="pointer"
                onClick={() => window.location.href = '/booking-luxury'}
              >
                <Card bg="transparent">
                  <CardBody p={{ base: 4, md: 6 }} textAlign="center">
                  <VStack spacing={{ base: 3, md: 4 }}>
                    <Box
                      p={3}
                      bg="rgba(0, 255, 157, 0.1)"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="neon.400"
                    >
                      <Icon as={service.icon} boxSize={6} color="neon.400" />
                    </Box>
                    <Heading size="md" color="text.primary">
                      {service.title}
                    </Heading>
                    <Text fontSize="sm" color="text.secondary" textAlign="center">
                      {service.description}
                    </Text>
                    <List spacing={1}>
                      {service.features.map((feature, idx) => (
                        <ListItem key={idx} fontSize="xs" color="text.secondary">
                          <ListIcon as={FiCheckCircle} color="green.500" />
                          {feature}
                        </ListItem>
                      ))}
                    </List>
                  </VStack>
                </CardBody>
                </Card>
              </MotionCard>
            ))}
          </SimpleGrid>

          {/* Pricing Section */}
          <Box 
            w="full"
            p={8}
            bg="rgba(13,13,13,0.8)"
            borderRadius="2xl"
            border="1px solid rgba(255,255,255,0.1)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgGradient: 'radial(circle at 50% 0%, rgba(0,255,157,0.08), transparent 70%)',
              pointerEvents: 'none',
            }}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
              position="relative"
              zIndex={1}
            >
              <HStack justify="center" mb={4}>
                <Box
                  p={3}
                  bg="rgba(0,255,157,0.1)"
                  borderRadius="full"
                  border="1px solid rgba(0,255,157,0.3)"
                >
                  <FiCheckCircle size={28} color="rgba(0,255,157,1)" />
                </Box>
              </HStack>
              <Badge
                colorScheme="green"
                variant="subtle"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Clear & Simple Pricing
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, neon.400, green.300)"
                bgClip="text"
                fontWeight="bold"
              >
                Transparent Pricing
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg" 
                maxW="2xl" 
                mx="auto"
                lineHeight="tall"
              >
                <Box as="span" color="red.400" fontWeight="bold">No hidden fees</Box>,{' '}
                <Box as="span" color="red.400" fontWeight="bold">no surprises</Box>. Get an{' '}
                <Box as="span" color="neon.400" fontWeight="semibold">instant quote</Box> based on your home size.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }} position="relative" zIndex={1}>
              {pricingTiers.map((tier, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                  transition={`0.6s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="xl"
                  border={index === 1 ? "2px solid" : "1px solid"}
                  borderColor={index === 1 ? "blue.400" : "gray.200"}
                  position="relative"
                  cursor="pointer"
                  onClick={() => window.location.href = '/booking-luxury'}
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: '2xl',
                  }}
                  sx={{ transition: 'all 0.3s ease' }}
                >
                  <Card>
                    <CardBody p={8} textAlign="center">
                    <VStack spacing={6}>
                      <VStack spacing={2}>
                        <Heading size="lg" color="text.primary">
                          {tier.name}
                        </Heading>
                        <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                          {tier.price}
                        </Text>
                      </VStack>

                      <VStack spacing={3} align="start" w="full">
                        <HStack>
                          <Icon as={FiClock} color="gray.500" />
                          <Text fontSize="sm">{tier.duration}</Text>
                        </HStack>
                        <HStack>
                          <Icon as={FiUsers} color="gray.500" />
                          <Text fontSize="sm">{tier.team}</Text>
                        </HStack>
                        <HStack>
                          <Icon as={FiTruck} color="gray.500" />
                          <Text fontSize="sm">{tier.van}</Text>
                        </HStack>
                      </VStack>

                      <Divider />

                      <List spacing={2} w="full">
                        {tier.features.map((feature, idx) => (
                          <ListItem key={idx} fontSize="sm">
                            <ListIcon as={FiCheckCircle} color="green.500" />
                            {feature}
                          </ListItem>
                        ))}
                      </List>

                      <Text 
                        fontSize="sm" 
                        color="blue.400" 
                        fontWeight="medium"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        gap={2}
                      >
                        Click to Book <Icon as={FiArrowRight} />
                      </Text>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* Testimonials */}
          <Box 
            w="full"
            p={{ base: 6, md: 10 }}
            bg="rgba(13,13,13,0.6)"
            borderRadius="2xl"
            border="1px solid rgba(255,255,255,0.05)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              bgGradient: 'radial(circle at 80% 50%, rgba(251,191,36,0.1), transparent 60%)',
              pointerEvents: 'none',
            }}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
              position="relative"
              zIndex={1}
            >
              <HStack justify="center" mb={4}>
                <Box
                  p={3}
                  bg="rgba(251,191,36,0.15)"
                  borderRadius="full"
                  border="1px solid rgba(251,191,36,0.3)"
                >
                  <FiUsers size={28} color="rgb(250,204,21)" />
                </Box>
              </HStack>
              <Badge
                colorScheme="yellow"
                variant="subtle"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Customer Reviews
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, yellow.300, orange.400)"
                bgClip="text"
                fontWeight="bold"
              >
                What Our Customers Say
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                Real feedback from <Box as="span" color="yellow.400" fontWeight="semibold">satisfied customers</Box>
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} position="relative" zIndex={1}>
              {testimonials.map((testimonial, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg="rgba(26,26,26,0.9)"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="rgba(251,191,36,0.2)"
                  _hover={{
                    borderColor: 'yellow.400',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(251,191,36,0.2)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  <Card bg="transparent" border="none" boxShadow="none">
                    <CardBody p={8}>
                    <VStack spacing={5} align="start">
                      <HStack spacing={1}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Icon key={i} as={FiStar} color="yellow.400" fill="yellow.400" boxSize={5} />
                        ))}
                      </HStack>
                      <Box
                        p={4}
                        bg="rgba(251,191,36,0.05)"
                        borderRadius="lg"
                        borderLeft="4px solid"
                        borderColor="yellow.400"
                      >
                        <Text 
                          color="gray.200" 
                          fontSize="md" 
                          fontStyle="italic"
                          lineHeight="tall"
                        >
                          "{testimonial.text}"
                        </Text>
                      </Box>
                      <HStack spacing={3}>
                        <Box
                          w={10}
                          h={10}
                          bg="yellow.500"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="gray.900"
                          fontWeight="bold"
                          fontSize="lg"
                        >
                          {testimonial.name.charAt(0)}
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color="white" fontSize="md">
                            {testimonial.name}
                          </Text>
                          <HStack spacing={2}>
                            <FiMapPin size={14} color="rgba(251,191,36,1)" />
                            <Text fontSize="sm" color="gray.400">
                              {testimonial.location}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* CTA Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out 0.4s"
            textAlign="center"
            p={{ base: 8, md: 16 }}
            bgGradient="linear(to-br, rgba(0,255,157,0.15), rgba(34,197,94,0.15))"
            borderRadius="3xl"
            border="2px solid"
            borderColor="neon.400"
            w="full"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              bgGradient: 'conic(from 0deg, transparent, rgba(0,255,157,0.3), transparent 30%)',
              animation: 'rotate 8s linear infinite',
              pointerEvents: 'none',
            }}
            sx={{
              '@keyframes rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <VStack spacing={8} position="relative" zIndex={1}>
              <Box
                p={4}
                bg="rgba(0,255,157,0.2)"
                borderRadius="full"
                border="2px solid"
                borderColor="neon.400"
                display="inline-flex"
              >
                <FiHome size={40} color="rgba(0,255,157,1)" />
              </Box>
              <VStack spacing={4}>
                <Badge
                  colorScheme="green"
                  variant="solid"
                  fontSize="sm"
                  px={4}
                  py={2}
                  borderRadius="full"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  🚀 Start Your Move Today
                </Badge>
                <Heading 
                  size="3xl" 
                  bgGradient="linear(to-r, white, neon.400, green.300)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  Ready to Move?
                </Heading>
                <Text 
                  fontSize="xl" 
                  maxW="3xl" 
                  color="gray.200"
                  lineHeight="tall"
                >
                  Get your <Box as="span" color="neon.400" fontWeight="semibold">free instant quote</Box> now. Our team will handle{' '}
                  <Box as="span" color="green.400" fontWeight="semibold">everything from packing to unpacking</Box>, so you can focus on settling into your new home.
                </Text>
              </VStack>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                  bg="neon.400"
                  color="gray.900"
                  fontWeight="bold"
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: 'neon.500',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(0,255,157,0.4)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  Get Free Quote
                </Button>
                <Button
                  size="lg"
                  onClick={() => window.open('tel:+441202129746')}
                  variant="outline"
                  borderColor="neon.400"
                  borderWidth="2px"
                  color="white"
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: 'rgba(0,255,157,0.1)',
                    borderColor: 'neon.500',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(0,255,157,0.2)',
                  }}
                  leftIcon={<FiPhone />}
                  sx={{ transition: 'all 0.3s' }}
                >
                  Call Now
                </Button>
              </HStack>
              <HStack 
                spacing={3}
                p={4}
                bg="rgba(0,255,157,0.1)"
                borderRadius="xl"
                border="1px solid rgba(0,255,157,0.3)"
              >
                <FiCheckCircle size={24} color="rgba(0,255,157,1)" />
                <Text fontSize="md" color="white" fontWeight="semibold">
                  📦 Full Packing Service • 🚚 Professional Team • 💰 Instant Quote
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
