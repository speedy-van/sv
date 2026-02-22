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
  FiPhone,
  FiBox,
  FiArchive,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';

export default function StorageServicesPage() {
  return (
    <>
      <Header />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero */}
      <Box bgGradient="linear(to-br, amber.900, orange.900, gray.900)" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge colorScheme="orange" fontSize="md" px={4} py={2} borderRadius="full">
              <HStack spacing={2}>
                <Icon as={FiArchive} />
                <Text>Storage Transport</Text>
              </HStack>
            </Badge>

            <Heading as="h1" size={{ base: 'xl', md: '3xl' }} color="white" maxW="900px" lineHeight="shorter">
              Storage Pickup & Delivery
              <Text as="span" display="block" color="orange.300">
                To and From Any Storage Facility
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Need to move items to storage? Retrieving from your unit? We handle transport 
              to and from any self-storage facility. Pack, load, and deliver - we do it all.
            </Text>

            <HStack spacing={4} pt={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=storage"
                size="lg"
                colorScheme="orange"
                rightIcon={<FiTruck />}
              >
                Get Storage Quote
              </Button>
              <Button
                as="a"
                href="tel:01202129746"
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
          </VStack>
        </Container>
      </Box>

      {/* Services */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            Our Storage Services
          </Heading>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            {[
              {
                title: 'To Storage',
                price: 'from £79',
                desc: 'We collect from your home and deliver to your storage unit.',
                features: ['Loading help', 'Any UK storage facility', 'Inventory list'],
              },
              {
                title: 'From Storage',
                price: 'from £79',
                desc: 'Retrieve items from storage and deliver to any address.',
                features: ['Unit access help', 'Careful handling', 'Room placement'],
              },
              {
                title: 'Storage Swap',
                price: 'from £129',
                desc: 'Moving between storage facilities? We handle the transfer.',
                features: ['Facility to facility', 'Same day if needed', 'Insurance included'],
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
                      <Icon as={FiBox} boxSize={10} color="orange.400" />
                      <Heading size="lg" color="white">{service.title}</Heading>
                      <Text fontSize="2xl" fontWeight="bold" color="orange.400">{service.price}</Text>
                      <Text color="gray.400" textAlign="center">{service.desc}</Text>
                      <List spacing={2} color="gray.300">
                        {service.features.map((f) => (
                          <ListItem key={f}>
                            <ListIcon as={FiCheckCircle} color="green.400" />
                            {f}
                          </ListItem>
                        ))}
                      </List>
                      <Button as={Link} href="/booking-luxury?service=storage" colorScheme="orange" w="full">
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

      {/* Popular Facilities */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Heading as="h2" size="xl" color="white" textAlign="center">
            We Deliver to All Major Storage Providers
          </Heading>
          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {['Big Yellow', 'Safestore', 'Access Self Storage', 'Shurgard', 'Storage King', 'Lok\'nStore', 'Ready Steady Store', 'Any Local Facility'].map((name) => (
              <Box
                key={name}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={3}
                flex={{ base: '1 1 calc(50% - 6px)', md: '1 1 calc(25% - 9px)' }}
                minW={{ base: '140px', md: '180px' }}
                maxW={{ base: 'calc(50% - 6px)', md: '220px' }}
              >
                <Text color="white" textAlign="center" fontWeight="medium" fontSize="sm">{name}</Text>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      {/* CTA */}
      <Box bg="orange.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">Need Storage Transport?</Heading>
            <Text fontSize="lg" color="whiteAlpha.900">
              Get a quote for pickup or delivery to any storage facility.
            </Text>
            <Button
              as={Link}
              href="/booking-luxury?service=storage"
              size="lg"
              colorScheme="yellow"
              rightIcon={<FiTruck />}
            >
              Get Storage Quote
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
