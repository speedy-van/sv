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
  Progress,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiBriefcase,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiTruck,
  FiUsers,
  FiStar,
  FiPhone,
  FiHome,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiMonitor,
  FiArchive,
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
    title: 'Office Relocation',
    description: 'Complete office moves with minimal downtime',
    icon: FiBriefcase,
    features: ['Project management', 'Phased moves', 'Minimal disruption']
  },
  {
    title: 'Furniture Moving',
    description: 'Safe transport of office furniture and equipment',
    icon: FiArchive,
    features: ['Professional handling', 'Assembly/disassembly', 'Protection wrapping']
  },
  {
    title: 'IT Equipment Transport',
    description: 'Secure transport of computers and electronics',
    icon: FiMonitor,
    features: ['Anti-static protection', 'Data security', 'Quick setup']
  },
  {
    title: 'Document Management',
    description: 'Secure handling of confidential documents',
    icon: FiShield,
    features: ['Secure packaging', 'Chain of custody', 'Confidential disposal']
  }
];

const movingScenarios = [
  {
    title: 'Small Office',
    description: 'Moves for offices with 1-10 employees',
    icon: FiHome,
    color: 'blue',
    timeframe: '2-4 hours',
    price: '£200-400'
  },
  {
    title: 'Medium Office',
    description: 'Moves for offices with 10-50 employees',
    icon: FiTruck,
    color: 'green',
    timeframe: '4-8 hours',
    price: '£600-1200'
  },
  {
    title: 'Large Corporate',
    description: 'Moves for offices with 50+ employees',
    icon: FiUsers,
    color: 'purple',
    timeframe: '1-3 days',
    price: '£2000-5000'
  },
  {
    title: 'Branch Office',
    description: 'Regional office relocations',
    icon: FiBriefcase,
    color: 'orange',
    timeframe: '4-12 hours',
    price: '£800-2000'
  }
];

const pricingTiers = [
  {
    name: 'Basic Office',
    price: '£200-400',
    description: 'Perfect for small office moves',
    discount: '10% OFF',
    features: [
      'Up to 20 items',
      'Basic furniture',
      'Local moves only',
      'Insurance included',
      'Basic IT transport'
    ]
  },
  {
    name: 'Standard Office',
    price: '£600-1200',
    description: 'Ideal for medium-sized offices',
    discount: '15% OFF',
    features: [
      'Up to 100 items',
      'Office furniture',
      'Regional moves',
      'IT equipment handling',
      'Document management'
    ]
  },
  {
    name: 'Enterprise Office',
    price: '£2000-5000',
    description: 'Complete corporate relocations',
    discount: '20% OFF',
    features: [
      'Unlimited items',
      'Full office setup',
      'National moves',
      'Project management',
      'After-hours service'
    ]
  }
];

const companies = [
  'TechCorp Solutions',
  'Finance First Ltd',
  'Global Marketing Inc',
  'Legal Partners LLP',
  'Healthcare Systems',
  'Education Group',
  'Retail Chain HQ',
  'Manufacturing Corp'
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    position: 'Office Manager',
    rating: 5,
    text: 'Excellent service for our office relocation. The team handled our IT equipment with care and completed the move during off-hours to minimize disruption.'
  },
  {
    name: 'Michael Chen',
    company: 'Finance First Ltd',
    position: 'Operations Director',
    rating: 5,
    text: 'Professional and efficient. They managed our document transfer securely and ensured everything was in place for our first day in the new office.'
  }
];

export default function OfficePage() {
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
                <Icon as={FiBriefcase} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
            >
              Office Moving Services
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              Professional office relocation services designed for businesses.
              From small offices to large corporate moves, we ensure minimal downtime and maximum efficiency.
            </Text>
          </MotionBox>

          {/* Business Discount Alert */}
          <Alert status="info" borderRadius="xl" maxW="3xl">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">🏢 Business Moving Specialists</Text>
              <Text fontSize="sm">Dedicated project management for office relocations. Flexible scheduling to minimize business disruption.</Text>
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
                            <ListIcon as={FiCheckCircle} color="blue.500" />
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

          {/* Moving Scenarios */}
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
                Office Move Types
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                We handle all sizes of office relocations with specialized expertise.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {movingScenarios.map((scenario, index) => (
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
                  borderColor={`${scenario.color}.200`}
                >
                  <Card>
                    <CardBody p={6} textAlign="center">
                      <VStack spacing={4}>
                        <Box
                          p={3}
                          bg={`${scenario.color}.100`}
                          color={`${scenario.color}.600`}
                          borderRadius="lg"
                        >
                          <Icon as={scenario.icon} boxSize={6} />
                        </Box>
                        <Heading size="md" color="text.primary">
                          {scenario.title}
                        </Heading>
                        <Text fontSize="sm" color="text.secondary" textAlign="center">
                          {scenario.description}
                        </Text>
                        <VStack spacing={2}>
                          <HStack>
                            <Icon as={FiClock} color="gray.500" boxSize={4} />
                            <Text fontSize="sm" color="text.secondary">
                              {scenario.timeframe}
                            </Text>
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color={`${scenario.color}.500`}>
                            {scenario.price}
                          </Text>
                        </VStack>
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
                Office Moving Pricing
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                Transparent pricing for business relocations. No hidden fees, no surprises.
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
                          <HStack>
                            <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                              {tier.price}
                            </Text>
                            <Badge colorScheme="green" borderRadius="full">
                              {tier.discount}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="text.secondary">
                            {tier.description}
                          </Text>
                        </VStack>

                        <Divider />

                        <List spacing={2} w="full">
                          {tier.features.map((feature, idx) => (
                            <ListItem key={idx} fontSize="sm">
                              <ListIcon as={FiCheckCircle} color="blue.500" />
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

          {/* Company Partners */}
          <Box w="full">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={8}
            >
              <Heading size="xl" mb={4} color="text.primary">
                Trusted by Businesses
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                We work with companies across various industries.
              </Text>
            </MotionBox>

            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              bg={cardBg}
              borderRadius="xl"
              boxShadow="lg"
              p={8}
            >
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {companies.map((company, index) => (
                  <VStack key={index} spacing={2}>
                    <Icon as={FiBriefcase} color="blue.500" boxSize={5} />
                    <Text fontSize="sm" color="text.secondary" textAlign="center">
                      {company}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </MotionCard>
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
                Business Reviews
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
                            {testimonial.position} - {testimonial.company}
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
            bg="linear-gradient(135deg, blue.400, blue.600)"
            borderRadius="2xl"
            color="white"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Ready to Relocate Your Office?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Book your office move today with our experienced team.
                We handle everything from planning to execution with minimal business disruption.
              </Text>
              <HStack spacing={4}>
                <HeaderButton
                  variant="glass"
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                >
                  Get Office Quote
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
                🏢 Professional office moving services with project management
              </Text>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}