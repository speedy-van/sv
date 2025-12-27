'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Grid,
  VStack,
  HStack,
  Icon,
  Badge,
  Flex,
  Button,
} from '@chakra-ui/react';
import {
  MapPin,
  Truck,
  Clock,
  Star,
  Phone,
  MessageCircle,
  Calculator,
  Users,
  Package,
  Home,
  Shield,
  CheckCircle,
  ArrowRight,
  Building2,
  Route,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import LocalBusinessSchema from '@/components/Schema/LocalBusinessSchema';
import ContactPointSchema from '@/components/Schema/ContactPointSchema';
import FAQSchema from '@/components/Schema/FAQSchema';
import ReviewSchema from '@/components/Schema/ReviewSchema';
import ServiceSchema from '@/components/Schema/ServiceSchema';
import { ROUTES } from '@/lib/routing';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

const MotionBox = motion.create(Box);

const londonServices = [
  {
    icon: Truck,
    title: 'Man and Van London',
    price: 'From £25/hour',
    description: 'Professional man and van service across all London boroughs',
    href: ROUTES.SHARED.BOOKING_LUXURY,
    gradient: 'linear-gradient(135deg, #00C2FF 0%, #0080FF 100%)',
  },
  {
    icon: Home,
    title: 'House Removals London',
    price: 'From £150',
    description: 'Complete house removal service for London homes',
    href: ROUTES.SHARED.BOOKING_LUXURY,
    gradient: 'linear-gradient(135deg, #00D18F 0%, #00A86B 100%)',
  },
  {
    icon: Package,
    title: 'Furniture Delivery London',
    price: 'From £35/hour',
    description: 'Safe furniture delivery and assembly across London',
    href: ROUTES.SHARED.BOOKING_LUXURY,
    gradient: 'linear-gradient(135deg, #FF6B6B 0%, #EE5A5A 100%)',
  },
  {
    icon: Building2,
    title: 'Office Removals London',
    price: 'From £200',
    description: 'Professional office relocation services in London',
    href: ROUTES.SHARED.BOOKING_LUXURY,
    gradient: 'linear-gradient(135deg, #A855F7 0%, #9333EA 100%)',
  },
];

const londonBoroughs = [
  'Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets',
  'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth',
  'Hammersmith', 'Kensington', 'Brent', 'Ealing', 'Hounslow',
  'Richmond', 'Kingston', 'Merton', 'Sutton', 'Croydon',
  'Bromley', 'Bexley', 'Havering', 'Barking', 'Redbridge',
  'Newham', 'Waltham Forest', 'Haringey', 'Enfield', 'Barnet',
  'Harrow', 'Hillingdon',
];

const whyChooseLondon = [
  {
    icon: MapPin,
    title: 'Local Knowledge',
    description: 'Expert knowledge of London streets, parking, and access restrictions',
  },
  {
    icon: Zap,
    title: 'Same Day Service',
    description: 'Available for urgent moves across London with 2-hour response time',
  },
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'Comprehensive insurance and congestion charge included in all quotes',
  },
  {
    icon: Star,
    title: '500+ London Moves',
    description: 'Completed over 500 successful moves across London boroughs',
  },
];

const popularRoutes = [
  { from: 'Central London', to: 'South London', time: '45 mins', price: '£45' },
  { from: 'North London', to: 'East London', time: '35 mins', price: '£40' },
  { from: 'West London', to: 'Central London', time: '30 mins', price: '£35' },
  { from: 'London', to: 'Surrey', time: '60 mins', price: '£65' },
  { from: 'London', to: 'Essex', time: '50 mins', price: '£55' },
  { from: 'London', to: 'Kent', time: '55 mins', price: '£60' },
];

const trustBadges = [
  { icon: Shield, label: 'Fully Insured' },
  { icon: Star, label: '4.8★ Rating' },
  { icon: Clock, label: '24/7 Support' },
  { icon: CheckCircle, label: 'No Hidden Fees' },
];

export default function LondonPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <LocalBusinessSchema />
      <ContactPointSchema contactType="customer service" />

      <Box
        minH="100vh"
        bg="linear-gradient(180deg, #0A0E17 0%, #0D1321 50%, #0A0E17 100%)"
        pt={{ base: 20, md: 24 }}
      >
        <Container maxW="7xl" py={{ base: 8, md: 16 }}>
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 } as const}
          >
            <VStack
              spacing={6}
              textAlign="center"
              mb={16}
              position="relative"
            >
              {/* Decorative Glow */}
              <Box
                position="absolute"
                top="-100px"
                left="50%"
                transform="translateX(-50%)"
                w="600px"
                h="400px"
                bg="radial-gradient(circle, rgba(0,194,255,0.15) 0%, transparent 70%)"
                pointerEvents="none"
              />
              
              {/* Trust Badges */}
              <HStack spacing={4} flexWrap="wrap" justify="center" mb={4}>
                {trustBadges.map((badge, i) => (
                  <Badge
                    key={i}
                    bg="rgba(0,194,255,0.1)"
                    color="cyan.300"
                    border="1px solid rgba(0,194,255,0.3)"
                    borderRadius="full"
                    px={4}
                    py={2}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontSize="sm"
                  >
                    <Icon as={badge.icon} boxSize={4} />
                    {badge.label}
                  </Badge>
                ))}
              </HStack>

              <Badge
                bg="linear-gradient(135deg, #DC2626, #B91C1C)"
                color="white"
                borderRadius="full"
                px={6}
                py={2}
                fontSize="sm"
                fontWeight="bold"
                boxShadow="0 0 30px rgba(220,38,38,0.4)"
              >
                🏆 London&apos;s #1 Moving Service
              </Badge>
              
              <Heading
                as="h1"
                fontSize={{ base: '2.5rem', md: '4rem', lg: '5rem' }}
                fontWeight="800"
                lineHeight="1.1"
                bgGradient="linear(to-r, white, cyan.200, white)"
                bgClip="text"
                letterSpacing="-0.02em"
              >
                Professional Man & Van
                <br />
                <Text as="span" bgGradient="linear(to-r, cyan.400, green.400)" bgClip="text">
                  Service in London
                </Text>
              </Heading>
              
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                color="whiteAlpha.800"
                maxW="3xl"
                lineHeight="1.8"
              >
                Reliable moving services across all 32 London boroughs. From single item delivery 
                to complete house removals — professional, insured, and affordable solutions.
              </Text>

              {/* Stats Row */}
              <Flex
                flexWrap="wrap"
                justify="center"
                gap={{ base: 3, md: 6 }}
                mt={6}
                w="full"
                maxW="3xl"
              >
                {[
                  { value: '£25', label: 'Per Hour', suffix: '/hr' },
                  { value: '32', label: 'Boroughs', suffix: '' },
                  { value: '2', label: 'Hour Response', suffix: 'hrs' },
                  { value: '4.8', label: 'Star Rating', suffix: '★' },
                ].map((stat, i) => (
                  <VStack
                    key={i}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="xl"
                    p={{ base: 3, md: 4 }}
                    minW={{ base: '140px', md: '150px' }}
                    flex="1 1 auto"
                    maxW={{ base: '45%', md: '180px' }}
                    transition="all 0.3s"
                    _hover={{ bg: 'rgba(0,194,255,0.08)', borderColor: 'rgba(0,194,255,0.3)' }}
                  >
                    <Text fontSize={{ base: 'xl', md: '3xl' }} fontWeight="800" color="white">
                      {stat.value}<Text as="span" fontSize={{ base: 'sm', md: 'lg' }} color="cyan.300">{stat.suffix}</Text>
                    </Text>
                    <Text fontSize={{ base: 'xs', md: 'sm' }} color="whiteAlpha.600">{stat.label}</Text>
                  </VStack>
                ))}
              </Flex>

              {/* CTA Buttons */}
              <HStack spacing={4} mt={8} flexWrap="wrap" justify="center">
                <Button
                  as={Link}
                  href={ROUTES.SHARED.BOOKING_LUXURY}
                  size="lg"
                  bg="linear-gradient(135deg, #00C2FF, #0080FF)"
                  color="white"
                  px={8}
                  py={7}
                  borderRadius="full"
                  fontWeight="bold"
                  fontSize="lg"
                  leftIcon={<Calculator size={20} />}
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: '0 20px 40px rgba(0,194,255,0.4)',
                  }}
                  transition="all 0.3s"
                  boxShadow="0 10px 30px rgba(0,194,255,0.3)"
                >
                  Get Instant Quote
                </Button>
                <Button
                  as={Link}
                  href="tel:+441202129746"
                  size="lg"
                  bg="transparent"
                  color="white"
                  px={8}
                  py={7}
                  borderRadius="full"
                  fontWeight="bold"
                  fontSize="lg"
                  border="2px solid rgba(255,255,255,0.3)"
                  leftIcon={<Phone size={20} />}
                  _hover={{
                    bg: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.5)',
                    transform: 'translateY(-3px)',
                  }}
                  transition="all 0.3s"
                >
                  Call 01202 129746
                </Button>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Services Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 } as const}
          >
            <VStack spacing={12} align="stretch" mb={20}>
              <VStack spacing={4} textAlign="center">
                <Badge bg="rgba(0,194,255,0.1)" color="cyan.300" px={4} py={1} borderRadius="full">
                  Our Services
                </Badge>
                <Heading as="h2" size="xl" color="white">
                  London Moving Services
                </Heading>
                <Text color="whiteAlpha.700" maxW="2xl">
                  Professional moving solutions tailored for London&apos;s unique challenges
                </Text>
              </VStack>

              <Grid templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={{ base: 3, md: 6 }}>
                {londonServices.map((service, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 * index } as const}
                  >
                    <Box
                      as={Link}
                      href={service.href}
                      display="block"
                      bg="rgba(255,255,255,0.03)"
                      p={{ base: 4, md: 6 }}
                      borderRadius="2xl"
                      border="1px solid rgba(255,255,255,0.08)"
                      transition="all 0.3s"
                      position="relative"
                      overflow="hidden"
                      _hover={{
                        transform: 'translateY(-8px)',
                        borderColor: 'rgba(0,194,255,0.4)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                        '& .service-icon': {
                          transform: 'scale(1.1)',
                        },
                        '& .service-arrow': {
                          opacity: 1,
                          transform: 'translateX(0)',
                        },
                      }}
                    >
                      <VStack spacing={{ base: 2, md: 4 }} align="start">
                        <Box
                          className="service-icon"
                          w={{ base: 10, md: 14 }}
                          h={{ base: 10, md: 14 }}
                          borderRadius="xl"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bg={service.gradient}
                          transition="transform 0.3s"
                          boxShadow={`0 10px 25px ${service.gradient.includes('#00C2FF') ? 'rgba(0,194,255,0.3)' : service.gradient.includes('#00D18F') ? 'rgba(0,209,143,0.3)' : service.gradient.includes('#FF6B6B') ? 'rgba(255,107,107,0.3)' : 'rgba(168,85,247,0.3)'}`}
                        >
                          <Icon as={service.icon} boxSize={{ base: 5, md: 7 }} color="white" />
                        </Box>
                        <VStack spacing={1} align="start">
                          <Heading as="h3" fontSize={{ base: 'sm', md: 'md' }} color="white">
                            {service.title}
                          </Heading>
                          <Text fontSize={{ base: 'md', md: 'xl' }} fontWeight="bold" color="cyan.300">
                            {service.price}
                          </Text>
                        </VStack>
                        <Text color="whiteAlpha.700" fontSize={{ base: 'xs', md: 'sm' }} lineHeight="1.6" display={{ base: 'none', md: 'block' }}>
                          {service.description}
                        </Text>
                        <HStack
                          className="service-arrow"
                          color="cyan.400"
                          opacity={0}
                          transform="translateX(-10px)"
                          transition="all 0.3s"
                          display={{ base: 'none', md: 'flex' }}
                        >
                          <Text fontSize="sm" fontWeight="semibold">Book Now</Text>
                          <ArrowRight size={16} />
                        </HStack>
                      </VStack>
                    </Box>
                  </MotionBox>
                ))}
              </Grid>
            </VStack>
          </MotionBox>

          {/* Why Choose Us */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 } as const}
          >
            <Box
              bg="rgba(0,194,255,0.05)"
              border="1px solid rgba(0,194,255,0.1)"
              borderRadius="3xl"
              p={{ base: 8, md: 12 }}
              mb={20}
            >
              <VStack spacing={10}>
                <VStack spacing={4} textAlign="center">
                  <Heading as="h2" size="xl" color="white">
                    Why Choose Speedy Van for London?
                  </Heading>
                  <Text color="whiteAlpha.700" maxW="2xl">
                    We understand London&apos;s unique moving challenges
                  </Text>
                </VStack>

                <Grid
                  templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
                  gap={{ base: 3, md: 6 }}
                  w="full"
                >
                  {whyChooseLondon.map((item, index) => (
                    <VStack
                      key={index}
                      spacing={{ base: 2, md: 4 }}
                      textAlign="center"
                      p={{ base: 3, md: 6 }}
                      bg="rgba(255,255,255,0.03)"
                      borderRadius="2xl"
                      border="1px solid rgba(255,255,255,0.05)"
                      transition="all 0.3s"
                      _hover={{
                        bg: 'rgba(255,255,255,0.06)',
                        transform: 'translateY(-4px)',
                      }}
                    >
                      <Box
                        w={{ base: 10, md: 16 }}
                        h={{ base: 10, md: 16 }}
                        borderRadius="2xl"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        bg="linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))"
                        border="1px solid rgba(0,194,255,0.3)"
                      >
                        <Icon as={item.icon} boxSize={{ base: 5, md: 8 }} color="cyan.300" />
                      </Box>
                      <Heading as="h3" fontSize={{ base: 'xs', md: 'md' }} color="white">
                        {item.title}
                      </Heading>
                      <Text color="whiteAlpha.700" fontSize={{ base: 'xs', md: 'sm' }} display={{ base: 'none', md: 'block' }}>
                        {item.description}
                      </Text>
                    </VStack>
                  ))}
                </Grid>
              </VStack>
            </Box>
          </MotionBox>

          {/* London Boroughs */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 } as const}
          >
            <VStack spacing={8} mb={20}>
              <VStack spacing={4} textAlign="center">
                <Badge bg="rgba(0,209,143,0.1)" color="green.300" px={4} py={1} borderRadius="full">
                  Full Coverage
                </Badge>
                <Heading as="h2" size="xl" color="white">
                  All 32 London Boroughs Covered
                </Heading>
                <Text color="whiteAlpha.700" maxW="2xl">
                  Same day service available across Greater London
                </Text>
              </VStack>

              <Flex flexWrap="wrap" justify="center" gap={3} maxW="5xl">
                {londonBoroughs.map((borough, index) => (
                  <Badge
                    key={index}
                    as={Link}
                    href={ROUTES.SHARED.BOOKING_LUXURY}
                    bg="rgba(255,255,255,0.05)"
                    color="whiteAlpha.800"
                    border="1px solid rgba(255,255,255,0.1)"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    transition="all 0.2s"
                    cursor="pointer"
                    _hover={{
                      bg: 'rgba(0,194,255,0.15)',
                      borderColor: 'rgba(0,194,255,0.4)',
                      color: 'cyan.200',
                      transform: 'translateY(-2px)',
                    }}
                  >
                    {borough}
                  </Badge>
                ))}
              </Flex>
            </VStack>
          </MotionBox>

          {/* Popular Routes */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 } as const}
          >
            <VStack spacing={8} mb={20}>
              <VStack spacing={4} textAlign="center">
                <Badge bg="rgba(168,85,247,0.1)" color="purple.300" px={4} py={1} borderRadius="full">
                  <HStack spacing={1}>
                    <Route size={14} />
                    <Text>Popular Routes</Text>
                  </HStack>
                </Badge>
                <Heading as="h2" size="xl" color="white">
                  Popular London Moving Routes
                </Heading>
              </VStack>

              <Grid
                templateColumns={{ base: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
                gap={{ base: 2, md: 6 }}
                w="full"
                maxW="5xl"
              >
                {popularRoutes.map((route, index) => (
                  <Box
                    key={index}
                    as={Link}
                    href={ROUTES.SHARED.BOOKING_LUXURY}
                    bg="rgba(255,255,255,0.03)"
                    p={{ base: 2, md: 6 }}
                    borderRadius={{ base: 'xl', md: '2xl' }}
                    border="1px solid rgba(255,255,255,0.08)"
                    transition="all 0.3s"
                    _hover={{
                      bg: 'rgba(255,255,255,0.06)',
                      borderColor: 'rgba(168,85,247,0.4)',
                      transform: 'translateY(-4px)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                    }}
                  >
                    <VStack spacing={{ base: 1, md: 4 }} align="stretch">
                      <HStack justify="center" spacing={{ base: 1, md: 2 }} flexWrap="nowrap">
                        <Text color="white" fontWeight="bold" fontSize={{ base: '2xs', md: 'sm' }} noOfLines={1}>{route.from}</Text>
                        <Icon as={ArrowRight} color="cyan.400" boxSize={{ base: 3, md: 4 }} flexShrink={0} />
                        <Text color="white" fontWeight="bold" fontSize={{ base: '2xs', md: 'sm' }} noOfLines={1}>{route.to}</Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Badge bg="rgba(0,209,143,0.1)" color="green.300" borderRadius="full" px={{ base: 1, md: 3 }} fontSize={{ base: '2xs', md: 'sm' }}>
                          {route.time}
                        </Badge>
                        <Text color="cyan.300" fontWeight="bold" fontSize={{ base: 'xs', md: 'md' }}>{route.price}</Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </MotionBox>

          {/* London Info Cards */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 } as const}
          >
            <Grid
              templateColumns="repeat(2, 1fr)"
              gap={{ base: 3, md: 6 }}
              mb={20}
              maxW="4xl"
              mx="auto"
            >
              {[
                { title: 'Congestion Charge Included', desc: 'All London services include congestion charge. No hidden fees for central London moves.', color: 'cyan' },
                { title: 'Parking Permits Handled', desc: 'We handle parking permits across London boroughs with expert access route knowledge.', color: 'green' },
                { title: 'Evening & Weekend Service', desc: 'Flexible scheduling around London\'s busy lifestyle and traffic patterns.', color: 'purple' },
                { title: 'Storage Solutions', desc: 'Temporary storage available for chain moves and property renovations.', color: 'orange' },
              ].map((item, i) => (
                <Box
                  key={i}
                  bg={`rgba(${item.color === 'cyan' ? '0,194,255' : item.color === 'green' ? '0,209,143' : item.color === 'purple' ? '168,85,247' : '251,146,60'},0.08)`}
                  border={`1px solid rgba(${item.color === 'cyan' ? '0,194,255' : item.color === 'green' ? '0,209,143' : item.color === 'purple' ? '168,85,247' : '251,146,60'},0.2)`}
                  p={{ base: 3, md: 6 }}
                  borderRadius="2xl"
                >
                  <VStack spacing={{ base: 1, md: 3 }} align="start">
                    <Heading as="h3" fontSize={{ base: 'xs', md: 'md' }} color={`${item.color}.300`}>
                      {item.title}
                    </Heading>
                    <Text color="whiteAlpha.800" fontSize={{ base: 'xs', md: 'md' }} display={{ base: 'none', md: 'block' }}>{item.desc}</Text>
                  </VStack>
                </Box>
              ))}
            </Grid>
          </MotionBox>

          {/* Customer Reviews */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 } as const}
          >
            <VStack spacing={8} mb={20}>
              <VStack spacing={4} textAlign="center">
                <Badge bg="rgba(251,191,36,0.1)" color="yellow.300" px={4} py={1} borderRadius="full">
                  ⭐ Customer Reviews
                </Badge>
                <Heading as="h2" size="xl" color="white">
                  What London Customers Say
                </Heading>
              </VStack>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }} maxW="4xl">
                {[
                  { review: '"Excellent service for our move from Camden to Greenwich. The team knew London well and avoided all the traffic. Professional and efficient!"', author: 'Sarah M.', location: 'Greenwich' },
                  { review: '"Perfect for our Central London office move. They handled the congestion charge and parking permits. Made our move stress-free!"', author: 'James T.', location: 'Westminster' },
                ].map((item, i) => (
                  <Box
                    key={i}
                    bg="rgba(255,255,255,0.03)"
                    p={{ base: 4, md: 6 }}
                    borderRadius="2xl"
                    border="1px solid rgba(255,255,255,0.08)"
                  >
                    <VStack spacing={{ base: 3, md: 4 }} align="start">
                      <HStack spacing={1}>
                        {[1, 2, 3, 4, 5].map(star => (
                          <Icon key={star} as={Star} color="yellow.400" fill="currentColor" boxSize={{ base: 4, md: 5 }} />
                        ))}
                      </HStack>
                      <Text color="whiteAlpha.800" fontStyle="italic" fontSize={{ base: 'sm', md: 'md' }}>{item.review}</Text>
                      <Text fontWeight="bold" color="white" fontSize={{ base: 'sm', md: 'md' }}>
                        {item.author} <Text as="span" color="whiteAlpha.600" fontWeight="normal">• {item.location}</Text>
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </MotionBox>

          {/* Final CTA */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 } as const}
          >
            <Box
              textAlign="center"
              bg="linear-gradient(135deg, rgba(0,194,255,0.15) 0%, rgba(0,209,143,0.1) 100%)"
              border="1px solid rgba(0,194,255,0.2)"
              p={{ base: 6, md: 16 }}
              borderRadius="3xl"
              mb={20}
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                right="0"
                w="300px"
                h="300px"
                bg="radial-gradient(circle, rgba(0,209,143,0.2) 0%, transparent 70%)"
                pointerEvents="none"
              />
              <VStack spacing={{ base: 4, md: 6 }} position="relative">
                <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="white">
                  Ready to Move in London?
                </Heading>
                <Text fontSize={{ base: 'sm', md: 'lg' }} color="whiteAlpha.800" maxW="2xl">
                  Join hundreds of satisfied London customers. Professional service across 
                  all 32 boroughs with same day availability.
                </Text>
                <Flex flexWrap="wrap" justify="center" gap={{ base: 2, md: 4 }}>
                  <Button
                    as={Link}
                    href={ROUTES.SHARED.BOOKING_LUXURY}
                    size={{ base: 'md', md: 'lg' }}
                    bg="linear-gradient(135deg, #00C2FF, #0080FF)"
                    color="white"
                    px={{ base: 4, md: 10 }}
                    py={{ base: 5, md: 7 }}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize={{ base: 'sm', md: 'lg' }}
                    _hover={{
                      transform: 'translateY(-3px)',
                      boxShadow: '0 20px 40px rgba(0,194,255,0.4)',
                    }}
                    transition="all 0.3s"
                    boxShadow="0 10px 30px rgba(0,194,255,0.3)"
                  >
                    Book London Move
                  </Button>
                  <Button
                    as={Link}
                    href="https://wa.me/message/K57JWNNC2K3TA1"
                    size={{ base: 'md', md: 'lg' }}
                    bg="linear-gradient(135deg, #25D366, #128C7E)"
                    color="white"
                    px={{ base: 4, md: 8 }}
                    py={{ base: 5, md: 7 }}
                    borderRadius="full"
                    fontWeight="bold"
                    fontSize={{ base: 'sm', md: 'lg' }}
                    leftIcon={<MessageCircle size={18} />}
                    _hover={{
                      transform: 'translateY(-3px)',
                      boxShadow: '0 20px 40px rgba(37,211,102,0.4)',
                    }}
                    transition="all 0.3s"
                    boxShadow="0 10px 30px rgba(37,211,102,0.3)"
                  >
                    WhatsApp
                  </Button>
                </Flex>
              </VStack>
            </Box>
          </MotionBox>

          {/* FAQ Section */}
          <Box py={8}>
            <VStack spacing={8} align="stretch">
              <VStack spacing={4} textAlign="center">
                <Badge bg="rgba(255,255,255,0.05)" color="whiteAlpha.800" px={4} py={1} borderRadius="full">
                  FAQ
                </Badge>
                <Heading as="h2" size="xl" color="white">
                  Frequently Asked Questions
                </Heading>
                <Text color="whiteAlpha.700">
                  Everything you need to know about our London moving services
                </Text>
              </VStack>

              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={{ base: 4, md: 6 }} maxW="4xl" mx="auto">
                {[
                  { q: 'How much does a man and van cost in London?', a: 'Our man and van service starts from £25/hour in London. The total cost depends on distance, items, and time required. We provide transparent pricing with no hidden fees.' },
                  { q: 'Do you provide same-day service?', a: 'Yes! We offer same-day man and van service across all London boroughs. Book by 2pm for same-day service, subject to availability.' },
                  { q: 'Are your drivers insured and experienced?', a: 'All our drivers are fully insured, experienced professionals with extensive knowledge of London\'s roads and parking regulations.' },
                  { q: 'Is the congestion charge included?', a: 'Yes, all congestion charges are included in our London quotes. No hidden fees or surprise charges for central London moves.' },
                ].map((faq, i) => (
                  <Box
                    key={i}
                    p={{ base: 4, md: 6 }}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.08)"
                    borderRadius="2xl"
                  >
                    <Heading as="h3" fontSize={{ base: 'sm', md: 'md' }} mb={3} color="cyan.300">
                      {faq.q}
                    </Heading>
                    <Text color="whiteAlpha.700" fontSize={{ base: 'xs', md: 'sm' }}>
                      {faq.a}
                    </Text>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </Box>

          {/* Schema Markup */}
          <FAQSchema faqs={[
            { question: "How much does a man and van cost in London?", answer: "Our man and van service starts from £25/hour in London. The total cost depends on distance, items, and time required. We provide transparent pricing with no hidden fees." },
            { question: "Do you provide same-day service?", answer: "Yes! We offer same-day man and van service across all London boroughs. Book by 2pm for same-day service, subject to availability." },
            { question: "Are your drivers insured and experienced?", answer: "All our drivers are fully insured, experienced professionals with extensive knowledge of London's roads and parking regulations." },
            { question: "Is the congestion charge included?", answer: "Yes, all congestion charges are included in our London quotes. No hidden fees or surprise charges for central London moves." }
          ]} />

          <ReviewSchema reviews={[
            { author: "Sarah M.", rating: 5, reviewBody: "Excellent service for our move from Camden to Greenwich. Professional and efficient!", datePublished: "2025-01-15" },
            { author: "James T.", rating: 5, reviewBody: "Perfect for our Central London office move. Made our move stress-free!", datePublished: "2025-01-10" },
          ]} />

          <ServiceSchema services={[
            { name: "Man and Van London", description: "Professional man and van service across all London boroughs", price: "From £25/hour", areaServed: ["London", "Greater London"] },
            { name: "House Removals London", description: "Complete house removal service for London homes", price: "From £150", areaServed: ["London", "Greater London"] },
            { name: "Furniture Delivery London", description: "Safe furniture delivery and assembly across London", price: "From £35/hour", areaServed: ["London", "Greater London"] },
          ]} />
        </Container>
      </Box>
    </>
  );
}
