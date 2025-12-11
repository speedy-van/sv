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

export default function FurnitureRemovalPage() {
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
                <Icon as={FiTruck} boxSize={14} color="neon.400" />
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
              📦 Professional & Reliable
            </Badge>
            <Heading
              size={{ base: '2xl', md: '3xl' }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, white, neon.400, green.300)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Furniture Removal Services
            </Heading>
            <Text 
              fontSize={{ base: 'md', md: 'xl' }} 
              color="gray.300" 
              lineHeight="tall"
              maxW="3xl"
              mx="auto"
            >
              Professional <Box as="span" color="neon.400" fontWeight="semibold">furniture delivery and assembly service</Box>. From single items to complete room setups, we handle your furniture with{' '}
              <Box as="span" color="green.400" fontWeight="semibold">expert care</Box>.
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
                <FiSettings size={16} />
                Expert Assembly
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
                Flexible Timing
              </Badge>
            </HStack>
          </MotionBox>

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
                        <Icon as={type.icon} boxSize={6} color="neon.400" />
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

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }}>
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
                  borderColor={index === 1 ? "green.400" : "gray.200"}
                  position="relative"
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
                >
                  <Card>
                    <CardBody p={{ base: 5, md: 8 }} textAlign="center">
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

                      <Text fontSize="sm" color="green.400" fontWeight="medium" textAlign="center">
                        Click to Book <Icon as={FiArrowRight} ml={1} />
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
                Happy Customers
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
                <FiTruck size={40} color="rgba(0,255,157,1)" />
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
                  🚀 Book Your Delivery
                </Badge>
                <Heading 
                  size="3xl" 
                  bgGradient="linear(to-r, white, neon.400, green.300)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  Ready for Delivery?
                </Heading>
                <Text 
                  fontSize="xl" 
                  maxW="3xl" 
                  color="gray.200"
                  lineHeight="tall"
                >
                  Get your furniture <Box as="span" color="neon.400" fontWeight="semibold">delivered and assembled</Box> by professionals. Book now for{' '}
                  <Box as="span" color="green.400" fontWeight="semibold">same-day or next-day delivery</Box> slots.
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
                  Book Delivery
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
                  📦 White Glove Service • 🔧 Expert Assembly • ⏰ Flexible Timing
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
