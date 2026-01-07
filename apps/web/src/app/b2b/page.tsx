'use client';

import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  Icon,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { 
  FaBuilding, 
  FaKey, 
  FaShieldAlt, 
  FaPhone, 
  FaEnvelope, 
  FaArrowRight, 
  FaCheckCircle, 
  FaCreditCard, 
  FaTruck, 
  FaChartBar,
  FaUsers,
} from 'react-icons/fa';
import Link from 'next/link';

const SUPPORT_PHONE = '01202 129746';
const SUPPORT_EMAIL = 'support@speedy-van.co.uk';

const benefits = [
  {
    icon: FaCreditCard,
    title: 'Credit Terms',
    description: 'Net 30 payment terms with approved credit limits tailored to your business needs.',
    color: 'purple.400',
  },
  {
    icon: FaKey,
    title: 'API Integration',
    description: 'RESTful API access for programmatic bookings, quotes, and real-time tracking.',
    color: 'cyan.400',
  },
  {
    icon: FaShieldAlt,
    title: 'Dedicated Support',
    description: 'Priority support with a dedicated account manager for your business.',
    color: 'green.400',
  },
  {
    icon: FaTruck,
    title: 'Volume Discounts',
    description: 'Competitive rates based on your monthly booking volume.',
    color: 'orange.400',
  },
  {
    icon: FaChartBar,
    title: 'Analytics Dashboard',
    description: 'Comprehensive reporting and insights on your delivery operations.',
    color: 'blue.400',
  },
  {
    icon: FaUsers,
    title: 'Team Management',
    description: 'Role-based access for your team with full audit logging.',
    color: 'pink.400',
  },
];

const steps = [
  {
    step: 1,
    title: 'Apply Online',
    description: 'Fill out our simple application form with your company details.',
  },
  {
    step: 2,
    title: 'Verification',
    description: 'Our team reviews your application within 1-2 business days.',
  },
  {
    step: 3,
    title: 'Onboarding',
    description: 'Get your account set up with credit terms and API access.',
  },
  {
    step: 4,
    title: 'Start Shipping',
    description: 'Begin booking deliveries with your new B2B account.',
  },
];

export default function B2BLandingPage() {
  return (
    <Box minH="100vh" bg="gray.900">
      {/* Hero Section */}
      <Box 
        bgGradient="linear(to-br, gray.900, blue.900, purple.900)"
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgGradient="radial(circle at 30% 50%, rgba(0, 194, 255, 0.1), transparent 50%)"
        />
        <Container maxW="6xl" py={{ base: 12, md: 20 }} position="relative">
          <VStack spacing={6} textAlign="center">
            <Flex
              w={16}
              h={16}
              align="center"
              justify="center"
              rounded="2xl"
              bgGradient="linear(to-br, blue.400, purple.500)"
              shadow="lg"
              boxShadow="0 0 30px rgba(0, 194, 255, 0.3)"
            >
              <Icon as={FaBuilding} boxSize={8} color="white" />
            </Flex>
            <Heading 
              as="h1" 
              size={{ base: 'xl', md: '2xl' }} 
              color="white"
              fontWeight="bold"
            >
              Business Delivery Solutions
            </Heading>
            <Text 
              fontSize={{ base: 'md', md: 'xl' }} 
              color="gray.300"
              maxW="2xl"
            >
              Streamline your logistics with dedicated pricing, credit terms, API access, 
              and a dedicated account manager. Mainland UK coverage with billing in GBP.
            </Text>
            <HStack spacing={4} pt={4} flexWrap="wrap" justify="center">
              <Button
                as={Link}
                href="/b2b/register"
                size="lg"
                bgGradient="linear(to-r, blue.500, purple.500)"
                color="white"
                _hover={{
                  bgGradient: 'linear(to-r, blue.600, purple.600)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 0 30px rgba(0, 194, 255, 0.4)',
                }}
                rightIcon={<FaArrowRight />}
                px={8}
              >
                Apply Now
              </Button>
              <Button
                as="a"
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                size="lg"
                variant="outline"
                borderColor="cyan.400"
                color="cyan.400"
                _hover={{
                  bg: 'cyan.400',
                  color: 'gray.900',
                }}
                leftIcon={<FaPhone />}
                px={8}
              >
                Talk to Sales
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Container maxW="6xl" py={16}>
        <VStack spacing={10}>
          <VStack spacing={3} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Why Partner With Us?
            </Heading>
            <Text color="gray.400">
              Everything you need to manage your business deliveries efficiently
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="full">
            {benefits.map((benefit, i) => (
              <Card
                key={i}
                bg="gray.800"
                borderWidth="1px"
                borderColor="gray.700"
                _hover={{
                  borderColor: benefit.color,
                  transform: 'translateY(-4px)',
                  boxShadow: `0 0 20px ${benefit.color}40`,
                }}
                transition="all 0.3s"
              >
                <CardHeader pb={2}>
                  <Flex
                    w={12}
                    h={12}
                    align="center"
                    justify="center"
                    rounded="xl"
                    bg={`${benefit.color.split('.')[0]}.900`}
                    mb={3}
                  >
                    <Icon as={benefit.icon} boxSize={6} color={benefit.color} />
                  </Flex>
                  <Heading size="md" color="white">
                    {benefit.title}
                  </Heading>
                </CardHeader>
                <CardBody pt={0}>
                  <Text color="gray.400">{benefit.description}</Text>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      {/* How to Join Section */}
      <Box bg="gray.800" py={16}>
        <Container maxW="6xl">
          <VStack spacing={10}>
            <VStack spacing={3} textAlign="center">
              <Heading as="h2" size="xl" color="white">
                How to Join
              </Heading>
              <Text color="gray.400">
                Get started in four simple steps
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} w="full">
              {steps.map((item, i) => (
                <VStack key={i} spacing={4} position="relative">
                  <Flex
                    w={12}
                    h={12}
                    align="center"
                    justify="center"
                    rounded="full"
                    bgGradient="linear(to-br, blue.500, purple.500)"
                    color="white"
                    fontWeight="bold"
                    fontSize="xl"
                    boxShadow="0 0 20px rgba(0, 194, 255, 0.3)"
                  >
                    {item.step}
                  </Flex>
                  {i < steps.length - 1 && (
                    <Box
                      display={{ base: 'none', md: 'block' }}
                      position="absolute"
                      top="24px"
                      left="60%"
                      w="80%"
                      h="2px"
                      bgGradient="linear(to-r, blue.500, transparent)"
                    />
                  )}
                  <VStack spacing={1} textAlign="center">
                    <Text fontWeight="semibold" color="white">
                      {item.title}
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      {item.description}
                    </Text>
                  </VStack>
                </VStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxW="6xl" py={16}>
        <Card
          bgGradient="linear(to-br, blue.600, purple.700)"
          borderWidth="0"
          overflow="hidden"
          position="relative"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bgGradient="radial(circle at 80% 20%, rgba(255, 255, 255, 0.1), transparent 50%)"
          />
          <CardBody py={12} px={8} position="relative">
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align="center"
              justify="space-between"
              gap={6}
            >
              <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
                <Heading size="lg" color="white">
                  Ready to Get Started?
                </Heading>
                <Text color="blue.100" fontSize="lg">
                  Join hundreds of businesses already using our platform.
                </Text>
                <HStack spacing={4} pt={2} flexWrap="wrap">
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.300" />
                    <Text color="blue.100">Free to apply</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.300" />
                    <Text color="blue.100">1-2 day approval</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaCheckCircle} color="green.300" />
                    <Text color="blue.100">No commitment</Text>
                  </HStack>
                </HStack>
              </VStack>
              <Button
                as={Link}
                href="/b2b/register"
                size="lg"
                bg="white"
                color="blue.600"
                _hover={{
                  bg: 'gray.100',
                  transform: 'translateY(-2px)',
                }}
                rightIcon={<FaArrowRight />}
                px={8}
                fontWeight="semibold"
              >
                Apply Now
              </Button>
            </Flex>
          </CardBody>
        </Card>
      </Container>

      {/* Contact Section */}
      <Box bg="gray.800" py={16}>
        <Container maxW="6xl">
          <VStack spacing={6} textAlign="center">
            <Heading size="lg" color="white">
              Have Questions?
            </Heading>
            <Text color="gray.400">
              Our sales team is ready to help you find the right solution for your business.
            </Text>
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button
                as="a"
                href={`tel:${SUPPORT_PHONE.replace(/\s/g, '')}`}
                variant="outline"
                borderColor="cyan.400"
                color="cyan.400"
                _hover={{
                  bg: 'cyan.400',
                  color: 'gray.900',
                }}
                leftIcon={<FaPhone />}
                size="lg"
              >
                {SUPPORT_PHONE}
              </Button>
              <Button
                as="a"
                href={`mailto:${SUPPORT_EMAIL}?subject=B2B%20Inquiry`}
                variant="outline"
                borderColor="purple.400"
                color="purple.400"
                _hover={{
                  bg: 'purple.400',
                  color: 'white',
                }}
                leftIcon={<FaEnvelope />}
                size="lg"
              >
                {SUPPORT_EMAIL}
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}

