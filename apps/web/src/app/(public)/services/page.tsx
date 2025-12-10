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
      <Container maxW="container.xl" py={16}>
        <VStack spacing={16}>
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
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, neon.400, green.400)"
              bgClip="text"
            >
              Professional Moving Services
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              From residential moves to commercial relocations, we provide comprehensive 
              moving solutions tailored to your specific needs. All services include 
              full insurance coverage and professional handling.
            </Text>
          </MotionBox>

          {/* Trust Indicators */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {trustFeatures.map((feature, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
              >
                <HStack
                  p={6}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  spacing={4}
                >
                  <Box
                    p={3}
                    bg="neon.400"
                    borderRadius="lg"
                    color="white"
                  >
                    <Icon as={feature.icon} boxSize={6} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="text.primary">
                      {feature.title}
                    </Text>
                    <Text fontSize="sm" color="text.secondary">
                      {feature.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </SimpleGrid>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
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
                  <CardBody p={8} bg="transparent">
                  <VStack align="start" spacing={6}>
                    {/* Service Header */}
                    <HStack justify="space-between" w="full">
                      <HStack spacing={4}>
                        <Box
                          p={3}
                          bg={`rgba(59, 130, 246, 0.2)`}
                          color={`${service.color}.400`}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={`rgba(59, 130, 246, 0.3)`}
                        >
                          <Icon as={service.icon} boxSize={8} />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Heading size="lg" color="text.primary">
                            {service.title}
                          </Heading>
                          <Badge
                            colorScheme={service.color}
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            py={1}
                          >
                            {service.price}
                          </Badge>
                        </VStack>
                      </HStack>
                    </HStack>

                    {/* Description */}
                    <Text color="text.secondary" lineHeight="tall">
                      {service.description}
                    </Text>

                    {/* Features */}
                    <VStack align="start" spacing={3} w="full">
                      {service.features.map((feature, idx) => (
                        <HStack key={idx} spacing={3}>
                          <Icon
                            as={FiCheckCircle}
                            color="green.500"
                            boxSize={4}
                          />
                          <Text fontSize="sm" color="text.secondary">
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
