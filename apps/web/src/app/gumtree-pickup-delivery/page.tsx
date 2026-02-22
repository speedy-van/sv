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
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiStar,
  FiShield,
  FiTruck,
  FiClock,
  FiMapPin,
  FiPhone,
} from 'react-icons/fi';
import { FaCouch, FaBed, FaBox } from 'react-icons/fa';
import { SiGumtree } from 'react-icons/si';
import Link from 'next/link';
import MarketplaceServiceSchema from '@/components/Schema/MarketplaceServiceSchema';
import Header from '@/components/site/Header';

const faqData = [
  {
    question: 'Can you collect from any Gumtree seller?',
    answer: 'Yes! We can collect from any private seller, business, or trade seller on Gumtree across the UK. Just provide their address or postcode and we\'ll handle the rest.'
  },
  {
    question: 'What if the seller can\'t help load?',
    answer: 'No problem! Our standard 2-man team can handle most items independently. For exceptionally heavy items like piano or hot tubs, we can arrange additional crew members for a small fee.'
  },
  {
    question: 'How much does Gumtree delivery cost?',
    answer: 'Pricing depends on item size, distance, and access. Small items start from £49, sofas and beds from £79. Enter your details for an instant, accurate quote with no hidden fees.'
  },
  {
    question: 'Do you handle stairs at pickup and delivery?',
    answer: 'Absolutely! Tell us about stairs during booking. Ground and first floor are typically included. Additional floors may have a small surcharge depending on item weight.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit/debit cards through our secure checkout. Pay online when booking — no cash needed on the day.'
  }
];

export default function GumtreePickupDeliveryPage() {
  return (
    <>
      <Header />
      <MarketplaceServiceSchema
        serviceName="Gumtree Pickup & Delivery Service"
        serviceDescription="Professional Gumtree collection and delivery service. We pick up furniture and large items from Gumtree sellers and deliver to your door with full insurance coverage."
        serviceUrl="https://speedy-van.co.uk/gumtree-pickup-delivery"
        platform="gumtree"
        faqs={faqData}
      />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, green.900, teal.900, gray.900)"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge
              colorScheme="green"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
            >
              <HStack spacing={2}>
                <Text>🌳</Text>
                <Text>Gumtree Collection Specialist</Text>
              </HStack>
            </Badge>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              color="white"
              lineHeight="shorter"
            >
              Gumtree Bargains, Delivered Today
            </Heading>

            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="whiteAlpha.900"
              maxW="800px"
            >
              Same-day Gumtree pickup from just £25/hour. We collect from sellers and deliver to your door. Fully insured, 5-star rated service.
            </Text>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiShield} />
                  <Text>Fully Insured</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="yellow" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiStar} />
                  <Text>5-Star Rated</Text>
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
                href="/booking-luxury?source=gumtree"
                size="lg"
                colorScheme="green"
                rightIcon={<FiTruck />}
              >
                Get Instant Quote
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
                Call Now
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              How Gumtree Pickup & Delivery Works
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Simple process to get your Gumtree purchase delivered safely to your door
            </Text>
          </Box>

          <Flex wrap="wrap" gap={4} justify="center" w="full">
            {[
              { num: '1', color: 'green.500', title: 'Book Your Collection', desc: "Enter the seller's postcode and your delivery address. Select what you're buying and get an instant price." },
              { num: '2', color: 'teal.500', title: 'We Collect From Seller', desc: "Our professional team arrives at the seller's location with proper equipment. We load carefully and protect your item for transport." },
              { num: '3', color: 'cyan.500', title: 'Delivered to You', desc: 'We bring your Gumtree find straight to your home. Stairs, narrow doorways — we handle it all and place it where you want.' },
            ].map((step, idx) => (
              <Box
                key={idx}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={5}
                flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(33% - 16px)' }}
                minW={{ base: '140px', md: '280px' }}
                maxW={{ base: '100%', md: '350px' }}
              >
                <VStack spacing={3} textAlign="center">
                  <Flex
                    w={12}
                    h={12}
                    borderRadius="full"
                    bg={step.color}
                    align="center"
                    justify="center"
                    fontSize="xl"
                    fontWeight="bold"
                    color="white"
                  >
                    {step.num}
                  </Flex>
                  <Heading size="sm" color="white">{step.title}</Heading>
                  <Text color="gray.400" fontSize="sm">
                    {step.desc}
                  </Text>
                </VStack>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* What We Collect */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Popular Gumtree Items We Deliver
            </Heading>
            <Text fontSize="lg" color="gray.400">
              From furniture to white goods — professional handling guaranteed
            </Text>
          </Box>

          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {[
              { icon: FaCouch, name: 'Sofas', desc: 'All sizes and styles' },
              { icon: FaBed, name: 'Beds & Mattresses', desc: 'Safe handling' },
              { icon: FaBox, name: 'Wardrobes', desc: 'Assembled or flat-pack' },
              { icon: FiTruck, name: 'Dining Sets', desc: 'Tables and chairs' },
              { icon: FaBox, name: 'Appliances', desc: 'Washers, dryers, fridges' },
              { icon: FaCouch, name: 'Office Furniture', desc: 'Desks and chairs' },
              { icon: FaBox, name: 'Exercise Equipment', desc: 'Treadmills, bikes' },
              { icon: FaBox, name: 'Garden Items', desc: 'Furniture and tools' },
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
                  <Icon as={item.icon} boxSize={6} color="green.400" />
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

      {/* Why Choose Us */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Why Choose Speedy Van for Gumtree Deliveries?
            </Heading>
          </Box>

          <Flex wrap="wrap" gap={4} justify="center" w="full">
            {[
              {
                icon: FiShield,
                title: 'Fully Insured Transport',
                desc: 'All items covered up to £10,000. Your Gumtree purchase is protected from collection to delivery.',
              },
              {
                icon: FiClock,
                title: 'Same Day Collection',
                desc: "Book before 10am for same-day service. We work around your schedule and the seller's availability.",
              },
              {
                icon: FiMapPin,
                title: 'UK-Wide Coverage',
                desc: 'From London to Edinburgh, Manchester to Cardiff — we cover all of mainland UK for Gumtree pickups.',
              },
              {
                icon: FiStar,
                title: 'Professional Team',
                desc: 'Experienced 2-man teams with proper equipment. We handle heavy items, stairs, and awkward access.',
              },
            ].map((feature, idx) => (
              <Box
                key={idx}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(50% - 8px)' }}
                minW={{ base: '150px', md: '300px' }}
                maxW={{ base: '100%', md: '48%' }}
              >
                <Flex direction="row" align="flex-start" gap={3}>
                  <Icon as={feature.icon} boxSize={6} color="green.400" mt={1} flexShrink={0} />
                  <Box>
                    <Heading size="sm" color="white" mb={1}>
                      {feature.title}
                    </Heading>
                    <Text color="gray.400" fontSize="sm">
                      {feature.desc}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* FAQs */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Gumtree Delivery FAQs
            </Heading>
          </Box>

          <Accordion allowToggle w="full" maxW="800px">
            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Can you collect from any Gumtree seller?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! We can collect from any private seller, business, or trade seller on Gumtree 
                across the UK. Just provide their address or postcode and we'll handle the rest.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What if the seller can't help load?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                No problem! Our standard 2-man team can handle most items independently. 
                For exceptionally heavy items like piano or hot tubs, we can arrange 
                additional crew members for a small fee.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    How much does Gumtree delivery cost?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Pricing depends on item size, distance, and access. Small items start from £49, 
                sofas and beds from £79. Enter your details for an instant, accurate quote 
                with no hidden fees.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Do you handle stairs at pickup and delivery?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Absolutely! Tell us about stairs during booking. Ground and first floor are 
                typically included. Additional floors may have a small surcharge depending 
                on item weight.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What payment methods do you accept?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                We accept all major credit/debit cards through our secure checkout. 
                Pay online when booking — no cash needed on the day.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>

      {/* Final CTA */}
      <Box bg="green.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Get Your Gumtree Item Delivered?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote now. Professional collection and delivery with full insurance coverage.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href="/booking-luxury?source=gumtree"
                size="lg"
                colorScheme="teal"
                rightIcon={<FiTruck />}
              >
                Get Instant Quote
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
    </Box>
    </>
  );
}
