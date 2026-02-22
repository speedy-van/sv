'use client';

import React from 'react';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FaArrowRight, FaPhone } from 'react-icons/fa';
import Header from '@/components/site/Header';
import AppCard from '@/components/shared/AppCard';
import HomeFooter from '@/components/site/HomeFooter';
import TrustpilotWidget from '@/components/site/TrustpilotWidget';
import StickyCTA from '@/components/StickyCTA';
import SpeedyAIBotWrapper from '@/components/site/SpeedyAIBotWrapper';

const valueCards = [
  { title: 'Instant pricing', text: 'See clear rates before checkout with no hidden extras.' },
  { title: 'Verified drivers', text: 'Professional teams with insurance and tracked jobs.' },
  { title: 'Live support', text: 'Reach us fast on 01202 129746 or support@speedy-van.co.uk.' },
];

const serviceCards = [
  { title: 'House Removals', href: '/house-removals' },
  { title: 'Office Moves', href: '/office-removals' },
  { title: 'Furniture Delivery', href: '/furniture-removal' },
  { title: 'Single Item Delivery', href: '/single-item-delivery' },
  { title: 'Student Moves', href: '/student-moves' },
  { title: 'Same Day Delivery', href: '/same-day-delivery' },
];

export default function HomePageContent() {
  return (
    <Box as="main" id="main-content" bg="bg.canvas" color="text.primary" minH="100vh">
      <Header />

      <Box pt={{ base: '92px', md: '116px' }} pb={{ base: 12, md: 16 }}>
        <Container maxW="container.xl">
          <Grid templateColumns={{ base: '1fr', lg: '1.1fr 0.9fr' }} gap={{ base: 8, lg: 10 }}>
            <GridItem>
              <VStack align="start" spacing={6}>
                <Text fontSize="sm" letterSpacing="0.12em" textTransform="uppercase" color="interactive.secondary">
                  Speedy Van
                </Text>

                <Heading size="2xl" lineHeight="1.05">
                  Move faster with a modern booking experience.
                </Heading>

                <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }} maxW="2xl">
                  Premium reliability across the UK with transparent pricing, clear status updates,
                  and a cleaner moving workflow from quote to completion.
                </Text>

                <HStack spacing={3} flexWrap="wrap">
                  <Button
                    as={NextLink}
                    href="/booking-luxury"
                    colorScheme="blue"
                    rightIcon={<FaArrowRight />}
                    size="lg"
                  >
                    Start Booking
                  </Button>
                  <Button
                    as="a"
                    href="tel:01202129746"
                    variant="outline"
                    borderColor="border.neon"
                    leftIcon={<FaPhone />}
                    size="lg"
                  >
                    01202 129746
                  </Button>
                </HStack>
              </VStack>
            </GridItem>

            <GridItem>
              <AppCard variantStyle="elevated" h="full">
                <VStack align="start" spacing={4} p={{ base: 5, md: 6 }}>
                  <Text color="text.tertiary" fontSize="sm" textTransform="uppercase" letterSpacing="0.08em">
                    Why teams choose us
                  </Text>
                  <SimpleGrid columns={1} spacing={4} w="full">
                    {valueCards.map((item) => (
                      <Box key={item.title} p={4} bg="bg.surface" border="1px solid" borderColor="border.secondary" borderRadius="lg">
                        <Text fontWeight="700" mb={1}>
                          {item.title}
                        </Text>
                        <Text color="text.secondary" fontSize="sm">
                          {item.text}
                        </Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              </AppCard>
            </GridItem>
          </Grid>

          <VStack align="stretch" spacing={6} mt={{ base: 10, md: 14 }}>
            <HStack justify="space-between" align="end" flexWrap="wrap">
              <Heading size="lg">Core Services</Heading>
              <Link as={NextLink} href="/services" color="interactive.secondary">
                View all services
              </Link>
            </HStack>

            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
              {serviceCards.map((item) => (
                <AppCard key={item.title} variantStyle="interactive">
                  <VStack align="start" spacing={2} p={5}>
                    <Text fontWeight="700">{item.title}</Text>
                    <Text color="text.secondary" fontSize="sm">
                      Trusted service, professional handling, and on-time delivery.
                    </Text>
                    <Link as={NextLink} href={item.href} color="interactive.secondary" fontSize="sm">
                      Learn more
                    </Link>
                  </VStack>
                </AppCard>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      <TrustpilotWidget />
      <HomeFooter />
      <SpeedyAIBotWrapper />
      <StickyCTA />
    </Box>
  );
}

