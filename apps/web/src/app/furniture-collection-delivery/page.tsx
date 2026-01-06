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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Flex,
  Image,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
  FiPhone,
  FiHome,
  FiPackage,
} from 'react-icons/fi';
import { FaCouch, FaBed, FaBox, FaTools, FaHandsHelping } from 'react-icons/fa';
import Link from 'next/link';
import MarketplaceServiceSchema from '@/components/Schema/MarketplaceServiceSchema';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

const faqData = [
  {
    question: 'Do you collect furniture from private addresses?',
    answer: 'Absolutely! We specialise in collecting furniture from private homes, whether you\'re buying from a friend, family member, or found a great deal on a classified ad. Full door-to-door service.'
  },
  {
    question: 'Can you disassemble and reassemble furniture?',
    answer: 'Yes! Our teams carry basic tools and can handle most standard furniture assembly. For complex items, let us know in advance and we\'ll ensure the right crew is sent.'
  },
  {
    question: 'How much does furniture collection cost?',
    answer: 'Pricing depends on item size, distance, and access requirements. Single items start from £49. Get an instant quote by entering your pickup and delivery postcodes.'
  },
  {
    question: 'What areas do you cover?',
    answer: 'We cover all of mainland UK. From local moves within the same city to long-distance furniture transport across the country.'
  },
  {
    question: 'Are my items insured during transport?',
    answer: 'Yes, all items are covered by our comprehensive goods-in-transit insurance up to £10,000. Your furniture is protected from collection to delivery.'
  }
];

export default function FurnitureCollectionDeliveryPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <MarketplaceServiceSchema
        serviceName="Furniture Collection & Delivery Service"
        serviceDescription="Professional furniture collection and delivery service. We pick up furniture from private sellers, stores, and any location, delivering safely to your door with full insurance."
        serviceUrl="https://speedy-van.co.uk/furniture-collection-delivery"
        platform="general"
        faqs={faqData}
      />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, orange.900, red.900, gray.900)"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge
              colorScheme="orange"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
            >
              <HStack spacing={2}>
                <Icon as={FaCouch} />
                <Text>Door-to-Door Furniture Service</Text>
              </HStack>
            </Badge>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              color="white"
              lineHeight="shorter"
            >
              Furniture Collection & Delivery Service
            </Heading>

            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="whiteAlpha.900"
              maxW="800px"
            >
              Professional door-to-door furniture collection from anywhere in the UK. 
              Whether it's a sofa from a private seller, a bed from a friend, or a wardrobe from 
              a charity shop — we collect and deliver with care.
            </Text>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiShield} />
                  <Text>Fully Insured</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FaHandsHelping} />
                  <Text>2-Man Team</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="cyan" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiClock} />
                  <Text>Same Day Available</Text>
                </HStack>
              </Badge>
            </HStack>

            <HStack spacing={4} mt={4}>
              <Button
                as={Link}
                href="/booking-luxury?source=furniture-collection"
                size="lg"
                colorScheme="orange"
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
                Call Now
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* What We Collect */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Furniture We Collect & Deliver
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              From single items to full room loads — professional furniture moving at affordable prices
            </Text>
          </Box>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={FaCouch} boxSize={12} color="orange.400" />
                    <Heading size="md" color="white">Living Room</Heading>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Sofas (2-seater to corner)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Armchairs & recliners
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Coffee tables & TV units
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Bookcases & display cabinets
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={FaBed} boxSize={12} color="orange.400" />
                    <Heading size="md" color="white">Bedroom</Heading>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Beds (single to super king)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Wardrobes & chest of drawers
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Mattresses (all sizes)
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Dressing tables & mirrors
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Icon as={FaBox} boxSize={12} color="orange.400" />
                    <Heading size="md" color="white">Dining & Kitchen</Heading>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Dining tables & chairs
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Sideboards & buffets
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Kitchen appliances
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        American fridge freezers
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Collection Sources */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Where We Collect Furniture From
            </Heading>
            <Text fontSize="lg" color="gray.400">
              We pick up furniture from any location across the UK
            </Text>
          </Box>

          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {[
              { icon: FiHome, name: 'Private Sellers', desc: 'Facebook, Gumtree, eBay' },
              { icon: FiPackage, name: 'Retail Stores', desc: 'IKEA, DFS, furniture shops' },
              { icon: FaHandsHelping, name: 'Friends & Family', desc: 'Personal collections' },
              { icon: FiTruck, name: 'Charity Shops', desc: 'British Heart Foundation, etc.' },
              { icon: FaBox, name: 'Storage Units', desc: 'Self-storage facilities' },
              { icon: FaTools, name: 'House Clearances', desc: 'Estate & probate' },
              { icon: FiHome, name: 'Auctions', desc: 'Auction houses & online' },
              { icon: FiPackage, name: 'Warehouses', desc: 'Trade & wholesale' },
            ].map((item, idx) => (
              <Box
                key={idx}
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
                  <Icon as={item.icon} boxSize={6} color="orange.400" />
                  <Text fontWeight="bold" color="white" textAlign="center" fontSize="sm">
                    {item.name}
                  </Text>
                  <Text fontSize="xs" color="gray.400" textAlign="center">
                    {item.desc}
                  </Text>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Pricing */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Furniture Collection Pricing
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Transparent pricing with no hidden fees. Price includes collection, transport, and delivery.
            </Text>
          </Box>

          <Flex wrap="wrap" gap={6} w="full" justify="center">
            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg" color="white">Single Item</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">
                      from £59
                    </Text>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Chair, table, small cabinet
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Driver + porter
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Up to 15 miles
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card
                bg="gray.800"
                borderColor="orange.500"
                borderWidth="2px"
                position="relative"
                h="full"
              >
                <Badge
                  position="absolute"
                  top="-3"
                  left="50%"
                  transform="translateX(-50%)"
                  colorScheme="orange"
                  fontSize="sm"
                  px={4}
                  py={1}
                >
                  Most Popular
                </Badge>
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg" color="white">Sofa / Bed</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">
                      from £79
                    </Text>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        3-seater sofa or double bed
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        2-man professional team
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Stairs included (up to 2 floors)
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>

            <Box
              flex={{ base: '1 1 100%', md: '1 1 calc(33.333% - 16px)' }}
              maxW={{ base: '100%', md: 'calc(33.333% - 16px)' }}
              minW={{ base: '280px', md: '280px' }}
            >
              <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" h="full">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg" color="white">Multiple Items</Heading>
                    <Text fontSize="3xl" fontWeight="bold" color="orange.400">
                      from £129
                    </Text>
                    <List spacing={2} color="gray.300">
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Up to 5 items
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Large van + 2-man team
                      </ListItem>
                      <ListItem>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        Assembly available
                      </ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </Box>
          </Flex>

          <Button
            as={Link}
            href="/booking-luxury?source=furniture-collection"
            size="lg"
            colorScheme="orange"
            px={12}
          >
            Get Your Exact Price
          </Button>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* FAQs */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Furniture Collection FAQs
            </Heading>
          </Box>

          <Accordion allowToggle w="full" maxW="800px">
            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Do you dismantle and reassemble furniture?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! We can dismantle beds, wardrobes, and other flat-pack furniture at 
                collection and reassemble at delivery. Just select this option when booking. 
                There's a small additional fee depending on complexity.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What if the furniture doesn't fit through doorways?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Our experienced team knows how to manoeuvre furniture through tight spaces. 
                If a sofa needs to come apart or go through a window (safely!), we can 
                usually make it work. Let us know about any concerns during booking.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    How do you protect furniture during transport?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                We use professional removal blankets, furniture pads, and secure strapping. 
                Leather sofas get extra protection. All items are covered by our goods-in-transit 
                insurance up to £10,000.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Can you collect furniture the same day?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! Same-day collection is available for bookings made before 10am (subject to 
                availability in your area). We also offer next-day and scheduled collections 
                to suit your timing.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Do you take old furniture away?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                We can arrange furniture disposal through our certified partners. 
                Let us know when booking if you need your old sofa or bed removed 
                when we deliver the new one.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>

      {/* Final CTA */}
      <Box bg="orange.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Need Furniture Collected & Delivered?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote for door-to-door furniture collection. 
              Professional service, fully insured, competitive prices.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href="/booking-luxury?source=furniture-collection"
                size="lg"
                colorScheme="yellow"
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
          </VStack>
        </Container>
      </Box>
    </Box>
    </>
  );
}
