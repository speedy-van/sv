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
          >
            <HStack justify="center" mb={6}>
              <Box
                p={4}
                bg="neon.400"
                borderRadius="xl"
                boxShadow="0 0 20px rgba(0, 255, 157, 0.3)"
              >
                <Icon as={FiHome} boxSize={12} color="gray.900" />
              </Box>
            </HStack>
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, neon.400, green.400)"
              bgClip="text"
            >
              House Moving Services
            </Heading>
            <Text fontSize={{ base: 'md', md: 'xl' }} color="gray.400" lineHeight="tall" maxW="3xl" mx="auto">
              Professional residential moving services for homes and apartments. 
              From studio flats to large family homes, we handle your move with 
              care and expertise.
            </Text>
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
          <Box w="full">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
            >
              <Heading size="xl" mb={4} color="text.primary">
                Transparent Pricing
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                No hidden fees, no surprises. Get an instant quote based on your home size.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }}>
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

                      <Button
                        colorScheme="blue"
                        variant={index === 1 ? "solid" : "outline"}
                        w="full"
                        onClick={() => window.location.href = '/booking-luxury'}
                      >
                        Book Now
                      </Button>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* Testimonials */}
          <Box w="full">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
            >
              <Heading size="xl" mb={4} color="text.primary">
                What Our Customers Say
              </Heading>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {testimonials.map((testimonial, index) => (
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
                    borderColor: 'neon.400',
                  }}
                  sx={{ transition: 'all 0.3s ease' }}
                >
                  <Card bg="transparent">
                    <CardBody p={8}>
                    <VStack spacing={4} align="start">
                      <HStack>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Icon key={i} as={FiStar} color="yellow.400" />
                        ))}
                      </HStack>
                      <Text color="text.secondary" fontStyle="italic">
                        "{testimonial.text}"
                      </Text>
                      <HStack>
                        <Text fontWeight="bold" color="text.primary">
                          {testimonial.name}
                        </Text>
                        <Text color="text.secondary">
                          - {testimonial.location}
                        </Text>
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
            p={12}
            bg="linear-gradient(135deg, rgba(0, 255, 157, 0.2), rgba(0, 200, 100, 0.2))"
            borderRadius="2xl"
            border="2px solid"
            borderColor="neon.400"
            boxShadow="0 0 40px rgba(0, 255, 157, 0.3)"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Ready to Move?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Get your free instant quote now. Our team will handle everything 
                from packing to unpacking, so you can focus on settling into your new home.
              </Text>
              <HStack spacing={4}>
                <HeaderButton
                  variant="glass"
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                >
                  Get Free Quote
                </HeaderButton>
                <HeaderButton
                  variant="outline"
                  size="lg"
                  onClick={() => window.open('tel:+441202129746')}
                  borderColor="white"
                  color="white"
                  _hover={{
                    bg: 'rgba(255,255,255,0.1)',
                    borderColor: 'white',
                  }}
                  leftIcon={<FiPhone />}
                >
                  Call Now
                </HeaderButton>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
