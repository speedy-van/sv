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
  FiMapPin,
} from 'react-icons/fi';
import HeaderButton from '@/components/common/HeaderButton';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';
import { WhatsAppFloatingButton } from '@/components/shared/WhatsAppEntryPoint';
import CallMeBackFloating from '@/components/shared/CallMeBackFloating';

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
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <>
      <Header />
      <MobileHeader />
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
            position="relative"
          >
            <HStack justify="center" mb={6}>
              <Box
                p={5}
                bg="rgba(0,255,157,0.15)"
                color="neon.400"
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
                  background: 'linear-gradient(135deg, rgba(0,255,157,0.5), rgba(59,130,246,0.5))',
                  filter: 'blur(10px)',
                  opacity: 0.5,
                  zIndex: -1,
                }}
              >
                <Icon as={FiDollarSign} boxSize={14} />
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
              ✓ No Hidden Charges
            </Badge>
            <Heading
              size="3xl"
              mb={6}
              bgGradient="linear(to-r, neon.400, green.300, blue.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Transparent Pricing
            </Heading>
            <Text fontSize="xl" color="gray.300" lineHeight="tall" mb={6}>
              <Box as="span" color="red.400" fontWeight="bold">No hidden fees</Box>, <Box as="span" color="red.400" fontWeight="bold">no surprises</Box>. Get a clear, upfront quote for your move 
              with our transparent pricing structure.
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
                  <Text color="white" fontSize="sm" fontWeight="semibold">Insurance Included</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiCheckCircle color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">Professional Service</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiStar color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">Fixed Rates</Text>
                </HStack>
              </VStack>
            </HStack>
          </MotionBox>

          {/* Pricing Alert */}
          <Alert 
            status="info" 
            borderRadius="xl" 
            maxW="3xl"
            bg="rgba(59, 130, 246, 0.1)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <AlertIcon color="neon.400" />
            <Box>
              <Text fontWeight="bold" color="white">💡 Get Your Free Quote</Text>
              <Text fontSize="sm" color="gray.300">Use our online calculator for an instant, accurate quote based on your specific requirements.</Text>
            </Box>
          </Alert>

          {/* Pricing Tabs */}
          <Tabs 
            variant="enclosed" 
            colorScheme="blue" 
            w="full" 
            maxW="6xl"
            sx={{
              '& .chakra-tabs__tablist': {
                bg: 'rgba(26, 26, 26, 0.95)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
              },
              '& .chakra-tabs__tab': {
                color: 'gray.300',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                _selected: {
                  color: 'white',
                  bg: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                },
                _hover: {
                  color: 'white',
                  bg: 'rgba(59, 130, 246, 0.1)',
                }
              },
              '& .chakra-tabs__tab-panels': {
                bg: 'transparent',
              }
            }}
          >
            <TabList>
              <Tab>By Service Type</Tab>
              <Tab>By Home Size</Tab>
              <Tab>Add-On Services</Tab>
            </TabList>

            <TabPanels>
              {/* Service Type Pricing */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6} mt={8}>
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
                      <Card bg="transparent" border="none" boxShadow="none">
                        <CardBody p={6} textAlign="center" bg="transparent">
                        <VStack spacing={4}>
                          <Box
                            p={3}
                            bg={`rgba(59, 130, 246, 0.2)`}
                            color={`${service.color}.400`}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={`rgba(59, 130, 246, 0.3)`}
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
                            <HStack justify="center" spacing={2} flexWrap="wrap">
                              <Text fontSize="2xl" fontWeight="bold" color={`${service.color}.500`}>
                                {service.basePrice}
                              </Text>
                              <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
                                BNPL: Klarna & Clearpay
                              </Badge>
                            </HStack>
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
                <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8} mt={8}>
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
                      <Card bg="transparent" border="none" boxShadow="none">
                        <CardBody p={8} textAlign="center" bg="transparent">
                        <VStack spacing={6}>
                          <VStack spacing={2}>
                            <Heading size="lg" color="text.primary">
                              {size.size}
                            </Heading>
                            <HStack justify="center" spacing={2} flexWrap="wrap">
                              <Text fontSize="3xl" fontWeight="bold" color="neon.500">
                                {size.price}
                              </Text>
                              <Badge colorScheme="teal" variant="subtle" borderRadius="full" px={3} py={1} fontSize="xs">
                                Klarna & Clearpay
                              </Badge>
                            </HStack>
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
                <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6} mt={8}>
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
                      <Card bg="transparent" border="none" boxShadow="none">
                        <CardBody p={6} textAlign="center" bg="transparent">
                        <VStack spacing={4}>
                          <Box
                            p={3}
                            bg="rgba(59, 130, 246, 0.2)"
                            color="neon.400"
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="rgba(59, 130, 246, 0.3)"
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
                  <FiAlertTriangle size={28} color="rgba(0,255,157,1)" />
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
                Pricing Breakdown
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, neon.400, green.300)"
                bgClip="text"
                fontWeight="bold"
              >
                What Affects Your Price?
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg" 
                maxW="2xl" 
                mx="auto"
                lineHeight="tall"
              >
                Our pricing is based on <Box as="span" color="neon.400" fontWeight="semibold">several factors</Box> to ensure{' '}
                <Box as="span" color="green.400" fontWeight="semibold">fair and transparent costs</Box>.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={6} position="relative" zIndex={1}>
              {pricingFactors.map((factor, index) => (
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
                  borderColor="rgba(0,255,157,0.2)"
                  _hover={{
                    borderColor: 'neon.400',
                    transform: 'translateY(-8px)',
                    shadow: '0 12px 40px rgba(0,255,157,0.2)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  <Card bg="transparent" border="none" boxShadow="none">
                    <CardBody p={6} textAlign="center" bg="transparent">
                    <VStack spacing={4}>
                      <Box
                        p={4}
                        bgGradient="linear(to-br, rgba(0,255,157,0.2), rgba(59,130,246,0.2))"
                        color="neon.400"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(0,255,157,0.3)"
                        position="relative"
                        _before={{
                          content: '""',
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-2px',
                          borderRadius: 'xl',
                          background: 'linear-gradient(135deg, rgba(0,255,157,0.3), rgba(59,130,246,0.3))',
                          filter: 'blur(8px)',
                          opacity: 0.6,
                          zIndex: -1,
                        }}
                      >
                        <Icon as={factor.icon} boxSize={8} />
                      </Box>
                      <Heading size="md" color="white" fontWeight="bold">
                        {factor.factor}
                      </Heading>
                      <Text fontSize="sm" color="gray.300" textAlign="center" lineHeight="tall">
                        {factor.description}
                      </Text>
                      <Badge
                        colorScheme="green"
                        variant="solid"
                        fontSize="md"
                        px={4}
                        py={2}
                        borderRadius="full"
                        fontWeight="bold"
                      >
                        {factor.impact}
                      </Badge>
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
              bgGradient: 'radial(circle at 80% 50%, rgba(59,130,246,0.1), transparent 60%)',
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
                  bg="rgba(59,130,246,0.15)"
                  borderRadius="full"
                  border="1px solid rgba(59,130,246,0.3)"
                >
                  <FiStar size={28} color="rgb(250,204,21)" />
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
                bgGradient="linear(to-r, white, blue.300, purple.400)"
                bgClip="text"
                fontWeight="bold"
              >
                What Our Customers Say About Our Pricing
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                Real feedback from real customers who love our <Box as="span" color="blue.400" fontWeight="semibold">transparent pricing</Box>
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} position="relative" zIndex={1}>
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
                  borderColor="rgba(59,130,246,0.2)"
                  _hover={{
                    borderColor: 'blue.400',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(59,130,246,0.2)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  <Card bg="transparent" border="none" boxShadow="none">
                    <CardBody p={8} bg="transparent">
                    <VStack spacing={5} align="start">
                      <HStack spacing={3} justify="space-between" w="full">
                        <HStack spacing={1}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Icon key={i} as={FiStar} color="yellow.400" fill="yellow.400" boxSize={5} />
                          ))}
                        </HStack>
                        <Badge
                          colorScheme="blue"
                          variant="subtle"
                          fontSize="xs"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          {testimonial.service}
                        </Badge>
                      </HStack>
                      <Box
                        p={4}
                        bg="rgba(59,130,246,0.05)"
                        borderRadius="lg"
                        borderLeft="4px solid"
                        borderColor="blue.400"
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
                          bg="blue.500"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="white"
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
                            <FiMapPin size={14} color="rgba(0,255,157,1)" />
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
            bgGradient="linear(to-br, rgba(0,255,157,0.15), rgba(59,130,246,0.15))"
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
                <FiDollarSign size={40} color="rgba(0,255,157,1)" />
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
                  Free Quote • No Obligation
                </Badge>
                <Heading 
                  size="3xl" 
                  bgGradient="linear(to-r, white, neon.400, green.300)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  Get Your Free Quote Today
                </Heading>
                <Text 
                  fontSize="xl" 
                  maxW="3xl" 
                  color="gray.200"
                  lineHeight="tall"
                >
                  <Box as="span" color="red.400" fontWeight="bold">No obligation</Box>, <Box as="span" color="red.400" fontWeight="bold">no hidden fees</Box>. Get an instant quote for your move 
                  and see <Box as="span" color="neon.400" fontWeight="semibold">exactly what you'll pay</Box> before you book.
                </Text>
              </VStack>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <HeaderButton
                  variant="glass"
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
                >
                  Get Free Quote
                </HeaderButton>
                <HeaderButton
                  variant="outline"
                  size="lg"
                  onClick={() => window.open('tel:+441202129746')}
                  borderColor="neon.400"
                  color="white"
                  borderWidth="2px"
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
                >
                  Call Now
                </HeaderButton>
              </HStack>
              <HStack 
                spacing={3}
                p={4}
                bg="rgba(0,255,157,0.1)"
                borderRadius="xl"
                border="1px solid rgba(0,255,157,0.3)"
              >
                <FiShield size={24} color="rgba(0,255,157,1)" />
                <Text fontSize="md" color="white" fontWeight="semibold">
                  💡 All quotes include insurance and professional service
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
    <CallMeBackFloating />
    <WhatsAppFloatingButton context="pricing_page" />
    </>
  );
}
