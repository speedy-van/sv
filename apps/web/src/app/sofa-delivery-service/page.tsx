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
  FiPhone,
} from 'react-icons/fi';
import { FaCouch, FaHandsHelping, FaFacebook } from 'react-icons/fa';
import Link from 'next/link';
import MarketplaceServiceSchema from '@/components/Schema/MarketplaceServiceSchema';
import Header from '@/components/site/Header';

const faqData = [
  {
    question: 'Can you deliver a sofa I bought on Facebook Marketplace?',
    answer: 'Absolutely! We specialise in collecting sofas from Facebook Marketplace sellers and delivering to your home. We handle everything from collection to final placement in your room.'
  },
  {
    question: 'How much does sofa delivery cost?',
    answer: 'Sofa delivery starts from £79 for local deliveries. Final price depends on distance, sofa size, and access requirements. Get an instant quote in seconds.'
  },
  {
    question: 'Do you take the sofa upstairs?',
    answer: 'Yes! Our 2-man teams are equipped to handle stairs. Ground and first floor are included. Additional floors may have a small surcharge based on sofa weight.'
  },
  {
    question: 'What if my sofa doesn\'t fit through the door?',
    answer: 'If there\'s a tight squeeze, our experienced team will try various angles and techniques. If it truly won\'t fit, we\'ll discuss options with you before attempting anything risky.'
  },
  {
    question: 'Is my sofa insured during transport?',
    answer: 'Yes, all items including sofas are covered by our comprehensive goods-in-transit insurance up to £10,000. Your purchase is protected throughout the journey.'
  }
];

export default function SofaDeliveryServicePage() {
  return (
    <>
      <Header />
      <MarketplaceServiceSchema
        serviceName="Sofa Delivery Service"
        serviceDescription="Professional sofa delivery service. We collect sofas from Facebook Marketplace, Gumtree, stores, or any address and deliver safely to your home with 2-man handling."
        serviceUrl="https://speedy-van.co.uk/sofa-delivery-service"
        platform="general"
        faqs={faqData}
      />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, purple.900, pink.900, gray.900)"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge
              colorScheme="purple"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
            >
              <HStack spacing={2}>
                <Icon as={FaCouch} />
                <Text>Sofa Delivery Specialists</Text>
              </HStack>
            </Badge>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              color="white"
              lineHeight="shorter"
            >
              Sofa Delivered, Stress-Free
            </Heading>

            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="whiteAlpha.900"
              maxW="800px"
            >
              Professional sofa delivery from just £79. 2-man team handles stairs, narrow doors, and room placement. Fully insured, same-day available.
            </Text>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                <HStack spacing={1}>
                  <Icon as={FiShield} />
                  <Text>Fully Insured</Text>
                </HStack>
              </Badge>
              <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
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
                href="/booking-luxury?source=sofa-delivery&item=sofa"
                size="lg"
                colorScheme="purple"
                rightIcon={<FiTruck />}
              >
                Get Sofa Delivery Quote
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

      {/* Sofa Types */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Sofas We Collect & Deliver
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              All sofa types, all sizes — from marketplace finds to store purchases
            </Text>
          </Box>

          <Flex wrap="wrap" gap={3} justify="center" w="full">
            {[
              { name: '2-Seater Sofa', price: 'from £59', desc: 'Compact & loveseats' },
              { name: '3-Seater Sofa', price: 'from £79', desc: 'Standard living room' },
              { name: 'Corner Sofa', price: 'from £99', desc: 'L-shaped & modular' },
              { name: 'Sofa Bed', price: 'from £89', desc: 'Pull-out & click-clack' },
              { name: 'Chesterfield', price: 'from £89', desc: 'Classic & tufted' },
              { name: 'Recliner Sofa', price: 'from £99', desc: 'Manual & electric' },
              { name: 'Sectional', price: 'from £119', desc: 'Multi-piece units' },
              { name: 'Chaise Lounge', price: 'from £69', desc: 'Single-end sofas' },
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
                <VStack spacing={1}>
                  <Icon as={FaCouch} boxSize={6} color="purple.400" />
                  <Text fontWeight="bold" color="white" textAlign="center" fontSize="sm">
                    {item.name}
                  </Text>
                  <Text fontSize="md" color="purple.300" fontWeight="semibold">
                    {item.price}
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

      {/* Where We Collect From */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Where We Collect Sofas From
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Professional sofa collection from any location
            </Text>
          </Box>

          <Flex wrap="wrap" gap={4} justify="center" w="full">
            <Box
              bg="gray.800"
              borderColor="blue.500"
              borderWidth="2px"
              borderRadius="lg"
              p={5}
              flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(33% - 16px)' }}
              minW={{ base: '150px', md: '280px' }}
              maxW={{ base: '100%', md: '350px' }}
            >
              <VStack spacing={3}>
                <Icon as={FaFacebook} boxSize={8} color="blue.400" />
                <Heading size="sm" color="white">Facebook Marketplace</Heading>
                <Text color="gray.400" textAlign="center" fontSize="sm">
                  Bought a sofa on Facebook? We collect from the seller 
                  and deliver to your home. Most popular service!
                </Text>
                <Button
                  as={Link}
                  href="/facebook-marketplace-delivery"
                  variant="outline"
                  colorScheme="blue"
                  size="sm"
                >
                  Learn More
                </Button>
              </VStack>
            </Box>

            <Box
              bg="gray.800"
              borderColor="green.500"
              borderWidth="2px"
              borderRadius="lg"
              p={5}
              flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(33% - 16px)' }}
              minW={{ base: '150px', md: '280px' }}
              maxW={{ base: '100%', md: '350px' }}
            >
              <VStack spacing={3}>
                <Text fontSize="3xl">🌳</Text>
                <Heading size="sm" color="white">Gumtree</Heading>
                <Text color="gray.400" textAlign="center" fontSize="sm">
                  Found the perfect sofa on Gumtree? We handle the collection 
                  from private sellers anywhere in the UK.
                </Text>
                <Button
                  as={Link}
                  href="/gumtree-pickup-delivery"
                  variant="outline"
                  colorScheme="green"
                  size="sm"
                >
                  Learn More
                </Button>
              </VStack>
            </Box>

            <Box
              bg="gray.800"
              borderColor="orange.500"
              borderWidth="2px"
              borderRadius="lg"
              p={5}
              flex={{ base: '1 1 calc(50% - 8px)', md: '1 1 calc(33% - 16px)' }}
              minW={{ base: '150px', md: '280px' }}
              maxW={{ base: '100%', md: '350px' }}
            >
              <VStack spacing={3}>
                <Text fontSize="3xl">🏪</Text>
                <Heading size="sm" color="white">Furniture Stores</Heading>
                <Text color="gray.400" textAlign="center" fontSize="sm">
                  DFS, IKEA, charity shops, or independent stores — we 
                  collect and deliver faster than store delivery.
                </Text>
              </VStack>
            </Box>
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Service Features */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Professional Sofa Delivery Service
            </Heading>
          </Box>

          <Flex wrap="wrap" gap={4} justify="center" w="full">
            {[
              {
                icon: '🚪',
                title: 'Stairs & Narrow Access',
                desc: "Our experienced team knows how to navigate stairs, tight corners, and narrow doorways. We'll get your sofa in safely.",
              },
              {
                icon: '🛡️',
                title: 'Full Protection',
                desc: 'Removal blankets, corner protectors, and secure strapping. Leather sofas get extra care. £10,000 insurance coverage.',
              },
              {
                icon: '⏰',
                title: 'Same Day Delivery',
                desc: 'Need your sofa today? Book before 10am for same-day collection and delivery (subject to availability).',
              },
              {
                icon: '🏠',
                title: 'Room Placement',
                desc: "We don't just leave it at the door. We'll place your sofa exactly where you want it in your living room.",
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
                  <Flex
                    w={10}
                    h={10}
                    borderRadius="lg"
                    bg="purple.500"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <Text fontSize="lg">{feature.icon}</Text>
                  </Flex>
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
              Sofa Delivery FAQs
            </Heading>
          </Box>

          <Accordion allowToggle w="full" maxW="800px">
            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    How much does sofa delivery cost?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Sofa delivery prices start from £59 for a 2-seater and £79 for a 3-seater 
                (within 15 miles). Corner sofas start from £99. The exact price depends on 
                distance, floor access, and any additional services like old sofa removal.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What if my sofa won't fit through the door?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Our team is experienced with tricky access. We can remove sofa legs, tilt at angles, 
                or in some cases use windows (safely). Let us know your doorway measurements and 
                we'll advise before the job.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Can you take my old sofa away?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! We offer old sofa removal when delivering your new one. The sofa is 
                recycled responsibly through our certified partners. Just add this option 
                when booking (typically £30-50 depending on size).
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Do you deliver to flats with no lift?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Absolutely! Our 2-man teams are experienced with stairs. Ground and first floor 
                are included in the standard price. Higher floors have a small surcharge 
                (typically £10-20 per additional floor).
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Can you collect from Facebook Marketplace sellers?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! This is one of our most popular services. We collect from the seller's address 
                and deliver straight to your home. You don't need to be present at collection — 
                just provide the seller's details when booking.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Is my sofa insured during transport?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes, all items are covered by our comprehensive goods-in-transit insurance 
                up to £10,000. We take extra care with leather sofas and use protective 
                blankets on every job.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>

      {/* Final CTA */}
      <Box bg="purple.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Get Your Sofa Delivered?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote for sofa collection and delivery. 
              Professional 2-man team, fully insured, same-day available.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href="/booking-luxury?source=sofa-delivery&item=sofa"
                size="lg"
                colorScheme="pink"
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
