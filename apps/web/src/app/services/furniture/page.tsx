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
  List,
  ListItem,
  ListIcon,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiTruck,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiPackage,
  FiUsers,
  FiStar,
  FiPhone,
  FiHome,
  FiSettings,
  FiAward,
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
    title: 'White Glove Service',
    description: 'Premium delivery with unpacking and setup in your desired room',
    icon: FiAward,
    features: ['Room of choice placement', 'Packaging removal', 'Quality inspection']
  },
  {
    title: 'Assembly Service',
    description: 'Expert furniture assembly by trained professionals',
    icon: FiSettings,
    features: ['All tools provided', 'Warranty protection', 'Instructions followed']
  },
  {
    title: 'Damage Protection',
    description: 'Comprehensive insurance coverage for your furniture',
    icon: FiShield,
    features: ['Full replacement value', 'Instant claims', 'No deductibles']
  },
  {
    title: 'Flexible Scheduling',
    description: 'Delivery slots that work with your busy schedule',
    icon: FiClock,
    features: ['Evening delivery', 'Weekend service', 'Real-time tracking']
  }
];

const furnitureTypes = [
  {
    category: 'Living Room',
    items: ['Sofas & Sectionals', 'Coffee Tables', 'TV Units', 'Bookcases'],
    icon: FiHome,
    color: 'blue'
  },
  {
    category: 'Bedroom',
    items: ['Beds & Mattresses', 'Wardrobes', 'Dressing Tables', 'Bedside Tables'],
    icon: FiPackage,
    color: 'purple'
  },
  {
    category: 'Dining Room',
    items: ['Dining Tables', 'Chairs', 'Sideboards', 'Display Cabinets'],
    icon: FiUsers,
    color: 'green'
  },
  {
    category: 'Office',
    items: ['Desks', 'Office Chairs', 'Filing Cabinets', 'Bookcases'],
    icon: FiSettings,
    color: 'orange'
  }
];

const pricingTiers = [
  {
    name: 'Single Item',
    price: '£80-120',
    description: 'Perfect for individual furniture pieces',
    features: [
      'One furniture item',
      'Basic delivery',
      'Ground floor only',
      'Insurance included'
    ]
  },
  {
    name: 'Room Package',
    price: '£150-250',
    description: 'Multiple items for one room',
    features: [
      'Up to 5 items',
      'White glove service',
      'Any floor delivery',
      'Assembly included'
    ]
  },
  {
    name: 'Full Home',
    price: '£300+',
    description: 'Complete furniture delivery solution',
    features: [
      'Unlimited items',
      'Premium service',
      'Full setup service',
      'Extended warranty'
    ]
  }
];

const testimonials = [
  {
    name: 'Lisa Chen',
    location: 'London',
    rating: 5,
    text: 'Amazing service! They delivered my new sofa and assembled it perfectly. The team was professional and respectful of my home.'
  },
  {
    name: 'Michael Brown',
    location: 'Manchester',
    rating: 5,
    text: 'Best furniture delivery experience ever. They even helped rearrange my living room to fit the new pieces perfectly.'
  }
];

export default function FurniturePage() {
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
                bg="green.100"
                color="green.600"
                borderRadius="xl"
              >
                <Icon as={FiTruck} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, green.400, green.600)"
              bgClip="text"
            >
              Furniture Delivery Service
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              Professional furniture delivery and assembly service. From single items 
              to complete room setups, we handle your furniture with expert care.
            </Text>
          </MotionBox>

          {/* Alert for Special Offer */}
          <Alert status="info" borderRadius="xl" maxW="2xl">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">Free Assembly Included!</Text>
              <Text fontSize="sm">All furniture deliveries include free professional assembly service.</Text>
            </Box>
          </Alert>

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
                      bg="green.100"
                      color="green.600"
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

          {/* Furniture Types */}
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
                We Deliver All Types of Furniture
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                From living room essentials to office furniture, we handle it all.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {furnitureTypes.map((type, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  border="2px solid"
                  borderColor={`${type.color}.200`}
                >
                  <Card>
                    <CardBody p={6} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        p={3}
                        bg={`${type.color}.100`}
                        color={`${type.color}.600`}
                        borderRadius="lg"
                      >
                        <Icon as={type.icon} boxSize={6} />
                      </Box>
                      <Heading size="md" color="text.primary">
                        {type.category}
                      </Heading>
                      <List spacing={1}>
                        {type.items.map((item, idx) => (
                          <ListItem key={idx} fontSize="sm" color="text.secondary">
                            <ListIcon as={FiCheckCircle} color={`${type.color}.500`} />
                            {item}
                          </ListItem>
                        ))}
                      </List>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

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
                No hidden fees, no surprises. Choose the package that fits your needs.
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
                  borderColor={index === 1 ? "green.400" : "gray.200"}
                  position="relative"
                >
                  {index === 1 && (
                    <Badge
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      colorScheme="green"
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
                        <Text fontSize="3xl" fontWeight="bold" color="green.500">
                          {tier.price}
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                          {tier.description}
                        </Text>
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
                        colorScheme="green"
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
                Happy Customers
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
            bg="linear-gradient(135deg, green.400, green.600)"
            borderRadius="2xl"
            color="white"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Ready for Delivery?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Get your furniture delivered and assembled by professionals. 
                Book now for same-day or next-day delivery slots.
              </Text>
              <HStack spacing={4}>
                <HeaderButton
                  variant="glass"
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                >
                  Book Delivery
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
