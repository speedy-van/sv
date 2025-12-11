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

export default function OfficeRelocationPage() {
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <Box bg={bgColor} minH="100vh">
      <Header />
      <Container maxW="container.xl" py={{ base: 6, md: 16 }} px={{ base: 4, md: 6 }} pt={{ base: 24, md: 32 }}>
        <VStack spacing={{ base: 8, md: 16 }}>
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="4xl"
          >
            <HStack justify="center" mb={4}>
              <Box
                p={4}
                bg="rgba(0,255,157,0.15)"
                borderRadius="full"
                border="2px solid"
                borderColor="neon.400"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: 'full',
                  bg: 'radial-gradient(circle, rgba(0,255,157,0.3), transparent 70%)',
                  filter: 'blur(20px)',
                  zIndex: -1,
                }}
              >
                <Icon as={FiBriefcase} boxSize={14} color="neon.400" />
              </Box>
            </HStack>
            <Badge
              colorScheme="green"
              variant="solid"
              fontSize="sm"
              px={4}
              py={2}
              borderRadius="full"
              mb={4}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              🏢 Professional & Efficient
            </Badge>
            <Heading
              size={{ base: '2xl', md: '3xl' }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, white, neon.400, green.300)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Office Relocation Services
            </Heading>
            <Text 
              fontSize={{ base: 'md', md: 'xl' }} 
              color="gray.300" 
              lineHeight="tall"
              maxW="3xl"
              mx="auto"
            >
              Professional office relocation services designed for{' '}
              <Box as="span" color="neon.400" fontWeight="semibold">businesses</Box>. From small offices to large corporate moves, we ensure{' '}
              <Box as="span" color="green.400" fontWeight="semibold">minimal downtime</Box> and{' '}
              <Box as="span" color="blue.400" fontWeight="semibold">maximum efficiency</Box>.
            </Text>
            <HStack
              mt={8}
              spacing={4}
              justify="center"
              flexWrap="wrap"
            >
              <Badge
                colorScheme="green"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiShield size={16} />
                Fully Insured
              </Badge>
              <Divider orientation="vertical" h="20px" borderColor="gray.600" />
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiUsers size={16} />
                Expert Team
              </Badge>
              <Divider orientation="vertical" h="20px" borderColor="gray.600" />
              <Badge
                colorScheme="purple"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiClock size={16} />
                Minimal Downtime
              </Badge>
            </HStack>
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
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 4, md: 6 }} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                cursor="pointer"
                onClick={() => window.location.href = '/booking-luxury'}
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
                    <VStack spacing={4}>
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
              left: 0,
              width: '50%',
              height: '100%',
              bgGradient: 'radial(circle at 20% 50%, rgba(0,255,157,0.1), transparent 60%)',
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
                  bg="rgba(0,255,157,0.15)"
                  borderRadius="full"
                  border="1px solid rgba(0,255,157,0.3)"
                >
                  <FiBriefcase size={28} color="rgba(0,255,157,1)" />
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
                Flexible Solutions
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, neon.400, green.300)"
                bgClip="text"
                fontWeight="bold"
              >
                Office Move Types
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                We handle <Box as="span" color="neon.400" fontWeight="semibold">all sizes of office relocations</Box> with{' '}
                <Box as="span" color="green.400" fontWeight="semibold">specialized expertise</Box>.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={{ base: 4, md: 6 }} position="relative" zIndex={1}>
              {movingScenarios.map((scenario, index) => (
                <MotionCard
                  key={index}
                  cursor="pointer"
                  onClick={() => window.location.href = '/booking-luxury'}
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
                      <VStack spacing={4}>
                        <Box
                          p={3}
                          bg="rgba(0, 255, 157, 0.1)"
                          border="1px solid"
                          borderColor="neon.400"
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
              bgGradient: 'radial(circle at 80% 50%, rgba(0,255,157,0.1), transparent 60%)',
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
                  bg="rgba(0,255,157,0.15)"
                  borderRadius="full"
                  border="1px solid rgba(0,255,157,0.3)"
                >
                  <FiDollarSign size={28} color="rgba(0,255,157,1)" />
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
                Office Moving Pricing
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                <Box as="span" color="neon.400" fontWeight="semibold">Transparent pricing</Box> for business relocations.{' '}
                <Box as="span" color="green.400" fontWeight="semibold">No hidden fees</Box>, no surprises.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }} position="relative" zIndex={1}>
              {pricingTiers.map((tier, index) => (
                <MotionCard
                  key={index}
                  cursor="pointer"
                  onClick={() => window.location.href = '/booking-luxury'}
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
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
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
                    <CardBody p={{ base: 5, md: 8 }} textAlign="center">
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

                        <Text fontSize="sm" color="blue.400" fontWeight="medium" textAlign="center">
                          Click to Book <Icon as={FiArrowRight} ml={1} />
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* Company Partners */}
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
              left: 0,
              width: '50%',
              height: '100%',
              bgGradient: 'radial(circle at 20% 50%, rgba(59,130,246,0.1), transparent 60%)',
              pointerEvents: 'none',
            }}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={8}
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
                  <FiBriefcase size={28} color="rgba(59,130,246,1)" />
                </Box>
              </HStack>
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Industry Leaders
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, blue.300, cyan.400)"
                bgClip="text"
                fontWeight="bold"
              >
                Trusted by Businesses
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                We work with <Box as="span" color="blue.400" fontWeight="semibold">companies across various industries</Box>.
              </Text>
            </MotionBox>

            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              bg="rgba(26,26,26,0.9)"
              borderRadius="xl"
              boxShadow="lg"
              border="1px solid rgba(59,130,246,0.2)"
              p={8}
              position="relative"
              zIndex={1}
              _hover={{
                borderColor: 'blue.400',
                shadow: '0 12px 40px rgba(59,130,246,0.2)',
              }}
              sx={{ transition: 'all 0.3s' }}
            >
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6}>
                {companies.map((company, index) => (
                  <VStack key={index} spacing={3}>
                    <Box
                      p={3}
                      bg="rgba(59,130,246,0.1)"
                      borderRadius="lg"
                      border="1px solid rgba(59,130,246,0.2)"
                    >
                      <Icon as={FiBriefcase} color="blue.400" boxSize={6} />
                    </Box>
                    <Text fontSize="sm" color="gray.300" textAlign="center" fontWeight="medium">
                      {company}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </MotionCard>
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
                Business Reviews
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, yellow.300, orange.400)"
                bgClip="text"
                fontWeight="bold"
              >
                What Our Clients Say
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                Real feedback from <Box as="span" color="yellow.400" fontWeight="semibold">satisfied business clients</Box>
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
                              <FiBriefcase size={14} color="rgba(251,191,36,1)" />
                              <Text fontSize="sm" color="gray.400">
                                {testimonial.position}
                              </Text>
                            </HStack>
                            <Text fontSize="xs" color="gray.500">
                              {testimonial.company}
                            </Text>
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
                <FiBriefcase size={40} color="rgba(0,255,157,1)" />
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
                  🚀 Start Your Office Move
                </Badge>
                <Heading 
                  size="3xl" 
                  bgGradient="linear(to-r, white, neon.400, green.300)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  Ready to Relocate Your Office?
                </Heading>
                <Text 
                  fontSize="xl" 
                  maxW="3xl" 
                  color="gray.200"
                  lineHeight="tall"
                >
                  Book your <Box as="span" color="neon.400" fontWeight="semibold">office move today</Box> with our experienced team. We handle{' '}
                  <Box as="span" color="green.400" fontWeight="semibold">everything from planning to execution</Box> with{' '}
                  <Box as="span" color="blue.400" fontWeight="semibold">minimal business disruption</Box>.
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
                  Get Office Quote
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
                  🏢 Project Management • 📦 Equipment Care • ⚡ Quick Setup
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
