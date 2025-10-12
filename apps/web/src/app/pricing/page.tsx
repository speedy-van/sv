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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiHome,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiTruck,
  FiUsers,
  FiStar,
  FiPhone,
  FiPackage,
  FiDollarSign,
  FiBookOpen,
  FiSettings,
  FiAlertTriangle,
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

const servicePricing = [
  {
    service: 'House Moving',
    icon: FiHome,
    color: 'blue',
    basePrice: '£150',
    hourlyRate: '£45/hour',
    description: 'Complete residential relocation',
    features: [
      'Full packing service',
      'Furniture disassembly',
      'Insurance coverage',
      'Professional team'
    ]
  },
  {
    service: 'Office Relocation',
    icon: FiSettings,
    color: 'purple',
    basePrice: '£300',
    hourlyRate: '£65/hour',
    description: 'Professional business moving',
    features: [
      'IT equipment handling',
      'Document security',
      'After-hours service',
      'Project management'
    ]
  },
  {
    service: 'Furniture Delivery',
    icon: FiTruck,
    color: 'green',
    basePrice: '£80',
    hourlyRate: '£35/hour',
    description: 'Safe furniture transport',
    features: [
      'White glove service',
      'Assembly included',
      'Damage protection',
      'Scheduled delivery'
    ]
  },
  {
    service: 'Student Moving',
    icon: FiBookOpen,
    color: 'orange',
    basePrice: '£60',
    hourlyRate: '£30/hour',
    description: 'Affordable student moves',
    features: [
      'Student discounts',
      'Flexible scheduling',
      'Small load specialist',
      'University partnerships'
    ]
  }
];

const pricingFactors = [
  {
    factor: 'Distance',
    icon: FiTruck,
    description: 'Mileage charges apply for moves over 15 miles',
    impact: '£1.50 per mile'
  },
  {
    factor: 'Volume',
    icon: FiPackage,
    description: 'Based on number of rooms and items to move',
    impact: '£25-50 per room'
  },
  {
    factor: 'Time',
    icon: FiClock,
    description: 'Hourly rates for extended moves',
    impact: '£35-65 per hour'
  },
  {
    factor: 'Access',
    icon: FiUsers,
    description: 'Stairs, elevators, and parking restrictions',
    impact: '£20-50 per floor'
  }
];

const homeSizePricing = [
  {
    size: 'Studio/1 Bed',
    rooms: '1-2 rooms',
    team: '2 movers',
    van: 'Medium van',
    duration: '2-4 hours',
    price: '£150-250',
    features: [
      'Up to 15 boxes',
      'Basic furniture',
      'Same day service',
      'Insurance included'
    ]
  },
  {
    size: '2-3 Bedroom',
    rooms: '3-4 rooms',
    team: '3 movers',
    van: 'Large van',
    duration: '4-6 hours',
    price: '£300-450',
    features: [
      'Up to 40 boxes',
      'All furniture',
      'Packing service',
      'Insurance included'
    ]
  },
  {
    size: '4+ Bedroom',
    rooms: '5+ rooms',
    team: '4+ movers',
    van: 'Multiple vans',
    duration: '6-8 hours',
    price: '£500+',
    features: [
      'Unlimited boxes',
      'Full house service',
      'Premium packing',
      'Comprehensive insurance'
    ]
  }
];

const addOnServices = [
  {
    service: 'Packing Service',
    price: '£15/hour',
    description: 'Professional packing of all belongings',
    icon: FiPackage
  },
  {
    service: 'Furniture Assembly',
    price: '£25/item',
    description: 'Assembly and disassembly service',
    icon: FiSettings
  },
  {
    service: 'Storage Solutions',
    price: '£50/month',
    description: 'Temporary or long-term storage',
    icon: FiShield
  },
  {
    service: 'Cleaning Service',
    price: '£100-200',
    description: 'Professional cleaning after move',
    icon: FiUsers
  }
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    location: 'Manchester',
    rating: 5,
    text: 'The pricing was exactly as quoted - no hidden fees or surprises. Great value for money!',
    service: 'House Moving'
  },
  {
    name: 'David Thompson',
    location: 'Birmingham',
    rating: 5,
    text: 'Transparent pricing and excellent service. They delivered everything on time and within budget.',
    service: 'Office Relocation'
  }
];

export default function PricingPage() {
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
                bg="neon.100"
                color="neon.600"
                borderRadius="xl"
              >
                <Icon as={FiDollarSign} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, neon.400, green.400)"
              bgClip="text"
            >
              Transparent Pricing
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              No hidden fees, no surprises. Get a clear, upfront quote for your move 
              with our transparent pricing structure. All prices include insurance and professional service.
            </Text>
          </MotionBox>

          {/* Pricing Alert */}
          <Alert status="info" borderRadius="xl" maxW="3xl">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">💡 Get Your Free Quote</Text>
              <Text fontSize="sm">Use our online calculator for an instant, accurate quote based on your specific requirements.</Text>
            </Box>
          </Alert>

          {/* Pricing Tabs */}
          <Tabs variant="enclosed" colorScheme="blue" w="full" maxW="6xl">
            <TabList>
              <Tab>By Service Type</Tab>
              <Tab>By Home Size</Tab>
              <Tab>Add-On Services</Tab>
            </TabList>

            <TabPanels>
              {/* Service Type Pricing */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={8}>
                  {servicePricing.map((service, index) => (
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
                      borderColor={`${service.color}.200`}
                    >
                      <Card>
                        <CardBody p={6} textAlign="center">
                        <VStack spacing={4}>
                          <Box
                            p={3}
                            bg={`${service.color}.100`}
                            color={`${service.color}.600`}
                            borderRadius="lg"
                          >
                            <Icon as={service.icon} boxSize={6} />
                          </Box>
                          <Heading size="md" color="text.primary">
                            {service.service}
                          </Heading>
                          <Text fontSize="sm" color="text.secondary">
                            {service.description}
                          </Text>
                          <VStack spacing={2}>
                            <Text fontSize="2xl" fontWeight="bold" color={`${service.color}.500`}>
                              {service.basePrice}
                            </Text>
                            <Text fontSize="sm" color="text.secondary">
                              {service.hourlyRate}
                            </Text>
                          </VStack>
                          <List spacing={1}>
                            {service.features.map((feature, idx) => (
                              <ListItem key={idx} fontSize="xs" color="text.secondary">
                                <ListIcon as={FiCheckCircle} color={`${service.color}.500`} />
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
              </TabPanel>

              {/* Home Size Pricing */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} mt={8}>
                  {homeSizePricing.map((size, index) => (
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
                      borderColor={index === 1 ? "neon.400" : "gray.200"}
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
                              {size.size}
                            </Heading>
                            <Text fontSize="3xl" fontWeight="bold" color="neon.500">
                              {size.price}
                            </Text>
                          </VStack>

                          <VStack spacing={3} align="start" w="full">
                            <HStack>
                              <Icon as={FiHome} color="gray.500" />
                              <Text fontSize="sm">{size.rooms}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiUsers} color="gray.500" />
                              <Text fontSize="sm">{size.team}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiTruck} color="gray.500" />
                              <Text fontSize="sm">{size.van}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiClock} color="gray.500" />
                              <Text fontSize="sm">{size.duration}</Text>
                            </HStack>
                          </VStack>

                          <Divider />

                          <List spacing={2} w="full">
                            {size.features.map((feature, idx) => (
                              <ListItem key={idx} fontSize="sm">
                                <ListIcon as={FiCheckCircle} color="neon.500" />
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
                            Get Quote
                          </Button>
                        </VStack>
                      </CardBody>
                      </Card>
                    </MotionCard>
                  ))}
                </SimpleGrid>
              </TabPanel>

              {/* Add-On Services */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mt={8}>
                  {addOnServices.map((addon, index) => (
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
                            bg="gray.100"
                            color="gray.600"
                            borderRadius="lg"
                          >
                            <Icon as={addon.icon} boxSize={6} />
                          </Box>
                          <Heading size="md" color="text.primary">
                            {addon.service}
                          </Heading>
                          <Text fontSize="lg" fontWeight="bold" color="neon.500">
                            {addon.price}
                          </Text>
                          <Text fontSize="sm" color="text.secondary" textAlign="center">
                            {addon.description}
                          </Text>
                        </VStack>
                      </CardBody>
                      </Card>
                    </MotionCard>
                  ))}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>

          {/* Pricing Factors */}
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
                What Affects Your Price?
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                Our pricing is based on several factors to ensure fair and transparent costs.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {pricingFactors.map((factor, index) => (
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
                    <CardBody p={6} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        p={3}
                        bg="orange.100"
                        color="orange.600"
                        borderRadius="lg"
                      >
                        <Icon as={factor.icon} boxSize={6} />
                      </Box>
                      <Heading size="md" color="text.primary">
                        {factor.factor}
                      </Heading>
                      <Text fontSize="sm" color="text.secondary" textAlign="center">
                        {factor.description}
                      </Text>
                      <Text fontSize="lg" fontWeight="bold" color="orange.500">
                        {factor.impact}
                      </Text>
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
                What Our Customers Say About Our Pricing
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
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" color="text.primary">
                          {testimonial.name}
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                          {testimonial.location} • {testimonial.service}
                        </Text>
                      </VStack>
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
            bg="linear-gradient(135deg, neon.400, green.400)"
            borderRadius="2xl"
            color="white"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Get Your Free Quote Today</Heading>
              <Text fontSize="lg" maxW="2xl">
                No obligation, no hidden fees. Get an instant quote for your move 
                and see exactly what you'll pay before you book.
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
              <Text fontSize="sm" opacity={0.9}>
                💡 All quotes include insurance and professional service
              </Text>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
