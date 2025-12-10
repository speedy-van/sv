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
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiHome,
  FiSettings,
  FiTruck,
  FiBookOpen,
  FiShield,
  FiClock,
  FiStar,
  FiCheckCircle,
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
    title: 'House Moving',
    description: 'Complete residential relocation services for homes and apartments',
    icon: FiHome,
    color: 'blue',
    features: [
      'Full packing service',
      'Furniture disassembly/assembly',
      'Fragile item protection',
      'Storage solutions',
      'Insurance coverage'
    ],
    price: 'From £150',
    href: '/services/house-moving'
  },
  {
    title: 'Office Relocation',
    description: 'Professional business moving services with minimal downtime',
    icon: FiSettings,
    color: 'purple',
    features: [
      'IT equipment handling',
      'Document security',
      'After-hours service',
      'Project management',
      'Minimal business disruption'
    ],
    price: 'From £300',
    href: '/services/office'
  },
  {
    title: 'Furniture Delivery',
    description: 'Safe transport and delivery of furniture and large items',
    icon: FiTruck,
    color: 'green',
    features: [
      'White glove service',
      'Assembly included',
      'Damage protection',
      'Scheduled delivery',
      'Two-person team'
    ],
    price: 'From £80',
    href: '/services/furniture'
  },
  {
    title: 'Student Moving',
    description: 'Affordable moving solutions for students and young professionals',
    icon: FiBookOpen,
    color: 'orange',
    features: [
      'Student discounts',
      'Flexible scheduling',
      'Small load specialists',
      'University partnerships',
      'Budget-friendly rates'
    ],
    price: 'From £60',
    href: '/services/student'
  }
];

const trustFeatures = [
  {
    icon: FiShield,
    title: 'Fully Insured',
    description: 'Complete protection for your belongings'
  },
  {
    icon: FiClock,
    title: '24/7 Support',
    description: 'Round-the-clock customer service'
  },
  {
    icon: FiStar,
    title: '5-Star Rated',
    description: 'Trusted by thousands of customers'
  }
];

export default function ServicesPage() {
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <Box bg={bgColor} minH="100vh" pt={20}>
      <Container maxW="container.xl" py={{ base: 8, md: 16 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 10, md: 16 }}>
          {/* Header Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="4xl"
          >
            <Heading
              size={{ base: "xl", md: "2xl" }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, neon.400, green.400)"
              bgClip="text"
            >
              Professional Moving Services
            </Heading>
            <Text fontSize={{ base: "md", md: "xl" }} color="text.secondary" lineHeight="tall">
              From residential moves to commercial relocations, we provide comprehensive 
              moving solutions tailored to your specific needs. All services include 
              full insurance coverage and professional handling.
            </Text>
          </MotionBox>

          {/* Trust Indicators */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }} w="full">
            {trustFeatures.map((feature, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
              >
                <HStack
                  p={{ base: 4, md: 6 }}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  spacing={{ base: 3, md: 4 }}
                  align="start"
                >
                  <Box
                    p={{ base: 2, md: 3 }}
                    bg="neon.400"
                    borderRadius="lg"
                    color="white"
                    flexShrink={0}
                  >
                    <Icon as={feature.icon} boxSize={{ base: 5, md: 6 }} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="text.primary" fontSize={{ base: "sm", md: "md" }}>
                      {feature.title}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="text.secondary">
                      {feature.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </SimpleGrid>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 6, lg: 8 }} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.6s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="xl"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                }}
                cursor="pointer"
                onClick={() => window.location.href = service.href}
              >
                <Card bg="transparent" border="none" boxShadow="none">
                  <CardBody p={{ base: 5, md: 8 }} bg="transparent">
                  <VStack align="start" spacing={{ base: 4, md: 6 }}>
                    {/* Service Header */}
                    <HStack justify="space-between" w="full" flexWrap={{ base: "wrap", md: "nowrap" }} spacing={{ base: 2, md: 4 }}>
                      <HStack spacing={{ base: 3, md: 4 }} flexWrap="wrap">
                        <Box
                          p={{ base: 2, md: 3 }}
                          bg={`rgba(59, 130, 246, 0.2)`}
                          color={`${service.color}.400`}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={`rgba(59, 130, 246, 0.3)`}
                        >
                          <Icon as={service.icon} boxSize={{ base: 6, md: 8 }} />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Heading size={{ base: "md", md: "lg" }} color="text.primary">
                            {service.title}
                          </Heading>
                          <Badge
                            colorScheme={service.color}
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            {service.price}
                          </Badge>
                        </VStack>
                      </HStack>
                    </HStack>

                    {/* Description */}
                    <Text color="text.secondary" lineHeight="tall" fontSize={{ base: "sm", md: "md" }}>
                      {service.description}
                    </Text>

                    {/* Features */}
                    <VStack align="start" spacing={{ base: 2, md: 3 }} w="full">
                      {service.features.map((feature, idx) => (
                        <HStack key={idx} spacing={{ base: 2, md: 3 }}>
                          <Icon
                            as={FiCheckCircle}
                            color="green.500"
                            boxSize={{ base: 3.5, md: 4 }}
                            flexShrink={0}
                          />
                          <Text fontSize={{ base: "xs", md: "sm" }} color="text.secondary">
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    {/* CTA Button */}
                    <Button
                      variant="outline"
                      colorScheme={service.color}
                      rightIcon={<FiArrowRight />}
                      size={{ base: "md", md: "lg" }}
                      w="full"
                      mt={4}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = service.href;
                      }}
                    >
                      Learn More
                    </Button>
                  </VStack>
                </CardBody>
                </Card>
              </MotionCard>
            ))}
          </SimpleGrid>

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
              <Heading size="xl">Ready to Get Started?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Get a free instant quote for your move. Our team is standing by 
                to help you plan your relocation with confidence.
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
