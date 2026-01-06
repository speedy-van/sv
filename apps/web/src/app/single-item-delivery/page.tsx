'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  List,
  ListItem,
  ListIcon,
  Button,
  Divider,
  Badge,
  Flex,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
  FiPhone,
  FiBox,
} from 'react-icons/fi';
import { FaCouch, FaBed, FaDesktop } from 'react-icons/fa';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function SingleItemDeliveryPage() {
  return (
    <>
      <Header />
      <MobileHeader />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, teal.900, cyan.900, gray.900)"
        py={{ base: 16, md: 24 }}
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="teal" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiBox} />
                <Text>Single Item Delivery</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Single Item Delivery Service
              <Text as="span" display="block" color="teal.300">
                One Item? No Problem.
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Need just one item moved? Whether it&apos;s a sofa from eBay, a fridge from a 
              store, or furniture from a friend - we deliver single items with the same 
              care as a full house move.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=single-item"
                size="lg"
                colorScheme="teal"
                rightIcon={<FiTruck />}
              >
                Get Instant Quote
              </Button>
              <Button
                as="a"
                href="tel:+441202129746"
                size="lg"
                variant="outline"
                color="white"
                borderColor="white"
                leftIcon={<FiPhone />}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                01202 129746
              </Button>
            </HStack>

            <HStack spacing={8} pt={6} flexWrap="wrap" justify="center">
              {[
                { icon: FiShield, text: 'Fully Insured' },
                { icon: FiStar, text: 'From £49' },
                { icon: FiClock, text: 'Same Day Available' },
              ].map((badge) => (
                <HStack key={badge.text} color="whiteAlpha.800">
                  <Icon as={badge.icon} />
                  <Text fontWeight="medium">{badge.text}</Text>
                </HStack>
              ))}
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Popular Single Items */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Popular Single Item Deliveries
            </Heading>
            <Text fontSize="lg" color="gray.400">
              We transport all types of single items - here are the most common
            </Text>
          </Box>

          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {[
              { icon: FaCouch, name: 'Sofas', price: 'from £79' },
              { icon: FaBed, name: 'Beds & Mattresses', price: 'from £69' },
              { icon: FiBox, name: 'Appliances', price: 'from £59' },
              { icon: FaDesktop, name: 'TVs & Electronics', price: 'from £49' },
              { icon: FiBox, name: 'Wardrobes', price: 'from £89' },
              { icon: FiBox, name: 'Dining Tables', price: 'from £79' },
              { icon: FiBox, name: 'Exercise Equipment', price: 'from £69' },
              { icon: FiBox, name: 'Piano', price: 'from £149' },
            ].map((item) => (
              <Box
                key={item.name}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={3}
                flex={{ base: '1 1 calc(50% - 6px)', md: '1 1 calc(25% - 9px)' }}
                minW={{ base: '140px', md: '180px' }}
                maxW={{ base: 'calc(50% - 6px)', md: '220px' }}
              >
                <VStack spacing={2}>
                  <Icon as={item.icon} boxSize={6} color="teal.400" />
                  <Text fontWeight="bold" color="white" fontSize="sm" textAlign="center">{item.name}</Text>
                  <Text fontSize="xs" color="teal.300">{item.price}</Text>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* How It Works */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              How Single Item Delivery Works
            </Heading>
          </Box>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              { step: '1', title: 'Get a Quote', desc: 'Enter item details, pickup and delivery addresses. Get an instant price.' },
              { step: '2', title: 'Book & Pay', desc: 'Choose your date and time. Secure online payment.' },
              { step: '3', title: 'We Deliver', desc: 'Our team collects and delivers your item with care.' },
            ].map((item) => (
              <Box
                key={item.step}
                flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
                maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
                minW={{ base: '280px', md: '280px' }}
              >
                <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                  <CardBody>
                    <VStack spacing={4} textAlign="center">
                      <Box
                        w={16}
                        h={16}
                        borderRadius="full"
                        bg="teal.500"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="2xl"
                        fontWeight="bold"
                        color="white"
                      >
                        {item.step}
                      </Box>
                      <Heading size="md" color="white">{item.title}</Heading>
                      <Text color="gray.400">{item.desc}</Text>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Why Choose Us */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Why Choose Us for Single Item Delivery?
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              { title: 'No Minimum Order', desc: 'We happily deliver just one item - no need to fill a van.' },
              { title: '2-Man Team Standard', desc: 'Heavy items? We send two people as standard for sofas, beds, and appliances.' },
              { title: 'Stairs Included', desc: 'Ground and first floor are included. Additional floors at small extra cost.' },
              { title: 'Flexible Scheduling', desc: 'Morning, afternoon, or evening slots. Weekend delivery available.' },
            ].map((item) => (
              <Box
                key={item.title}
                flex={{ base: '1 1 100%', md: '1 1 calc(50% - 12px)' }}
                maxW={{ base: '100%', md: 'calc(50% - 12px)' }}
                minW={{ base: '280px', md: '280px' }}
              >
                <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                  <CardBody>
                    <HStack spacing={4} align="start">
                      <Icon as={FiCheckCircle} boxSize={6} color="teal.400" mt={1} />
                      <Box>
                        <Heading size="md" color="white" mb={2}>{item.title}</Heading>
                        <Text color="gray.400">{item.desc}</Text>
                      </Box>
                    </HStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      {/* CTA */}
      <Box bg="teal.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Deliver Your Item?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote. Enter your item and addresses to see exactly what you&apos;ll pay.
            </Text>
            <Button
              as={Link}
              href="/booking-luxury?service=single-item"
              size="lg"
              colorScheme="cyan"
              rightIcon={<FiTruck />}
            >
              Get Instant Quote
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
