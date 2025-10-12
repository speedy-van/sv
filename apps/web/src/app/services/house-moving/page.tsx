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
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={bgColor} minH="100vh" pt={20}>
      <Container maxW="container.xl" py={16}>
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
                bg="blue.100"
                color="blue.600"
                borderRadius="xl"
              >
                <Icon as={FiHome} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
            >
              House Moving Services
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              Professional residential moving services for homes and apartments. 
              From studio flats to large family homes, we handle your move with 
              care and expertise.
            </Text>
          </MotionBox>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="lg"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                }}
              >
                <Card>
                  <CardBody p={6} textAlign="center">
                  <VStack spacing={4}>
                    <Box
                      p={3}
                      bg="blue.100"
                      color="blue.600"
                      borderRadius="lg"
                    >
                      <Icon as={service.icon} boxSize={6} />
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

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
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
                  {index === 1 && (
                    <Badge
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      colorScheme="blue"
                      borderRadius="full"
                      px={4}
                      py={1}
                    >
                      Most Popular
                    </Badge>
                  )}
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
                  boxShadow="lg"
                >
                  <Card>
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
            bg="linear-gradient(135deg, blue.400, blue.600)"
            borderRadius="2xl"
            color="white"
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
                  onClick={() => window.open('tel:+447901846297')}
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
