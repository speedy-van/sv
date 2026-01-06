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
  FiShield,
  FiTruck,
  FiClock,
  FiPhone,
  FiBookOpen,
  FiDollarSign,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function StudentMovesPage() {
  return (
    <>
      <Header />
      <MobileHeader />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero */}
      <Box bgGradient="linear(to-br, purple.900, pink.900, gray.900)" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="purple" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiBookOpen} />
                <Text>Student Friendly</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Student Moving Service
              <Text as="span" display="block" color="purple.300">
                Affordable Moves for Students
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Moving to uni? Changing halls? End of term storage run? We offer budget-friendly 
              moving services designed specifically for students.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=student-move"
                size="lg"
                colorScheme="purple"
                rightIcon={<FiTruck />}
              >
                Get Student Quote
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
                { icon: FiDollarSign, text: 'Student Discounts' },
                { icon: FiClock, text: 'Flexible Scheduling' },
                { icon: FiShield, text: 'Fully Insured' },
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

      {/* Services */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Student Moving Services
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              {
                title: 'Uni Move-In',
                price: 'from £79',
                features: ['Home to halls/house', 'Boxes and bags', 'Room setup help'],
              },
              {
                title: 'Between Terms',
                price: 'from £59',
                features: ['Halls to storage', 'Storage to new place', 'Quick turnaround'],
              },
              {
                title: 'End of Year',
                price: 'from £99',
                features: ['Full room clearout', 'Home delivery', 'Multi-stop available'],
              },
            ].map((service) => (
              <Box
                key={service.title}
                flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
                maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
                minW={{ base: '280px', md: '280px' }}
              >
                <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                  <CardBody>
                    <VStack spacing={4}>
                      <Heading size="lg" color="white">{service.title}</Heading>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.400">{service.price}</Text>
                      <List spacing={2} color="gray.300">
                        {service.features.map((f) => (
                          <ListItem key={f}>
                            <ListIcon as={FiCheckCircle} color="green.400" />
                            {f}
                          </ListItem>
                        ))}
                      </List>
                      <Button as={Link} href="/booking-luxury?service=student-move" colorScheme="purple" w="full">
                        Book Now
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Why Students Choose Us */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Why Students Choose Speedy Van
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              { title: 'Student Discount', desc: 'Show your student ID for 10% off any booking.' },
              { title: 'No Hidden Fees', desc: 'The price you see is the price you pay. Period.' },
              { title: 'Flexible Dates', desc: 'We know uni schedules are hectic. Weekend and evening slots available.' },
              { title: 'Share a Van', desc: 'Moving with flatmates? Split the cost and share a van.' },
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
                      <Icon as={FiCheckCircle} boxSize={6} color="purple.400" mt={1} flexShrink={0} />
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
      <Box bg="purple.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">Ready to Move?</Heading>
            <Text fontSize="lg" color="whiteAlpha.900">
              Get your student-friendly quote in seconds.
            </Text>
            <Button
              as={Link}
              href="/booking-luxury?service=student-move"
              size="lg"
              colorScheme="pink"
              rightIcon={<FiTruck />}
            >
              Get Student Quote
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
