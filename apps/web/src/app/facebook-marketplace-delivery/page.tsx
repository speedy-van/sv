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
  FiMessageSquare,
} from 'react-icons/fi';
import { FaFacebook, FaCouch, FaBed, FaBox } from 'react-icons/fa';
import Link from 'next/link';
import MarketplaceServiceSchema from '@/components/Schema/MarketplaceServiceSchema';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

const faqData = [
  {
    question: 'Do I need to be at the seller\'s address for collection?',
    answer: 'No, you don\'t need to be present. We coordinate directly with the seller for collection. You just need to provide the seller\'s contact details and address when booking.',
  },
  {
    question: 'Will the seller help with loading?',
    answer: 'Our 2-man team can handle loading independently in most cases. However, for very heavy items, we may request seller assistance or recommend an additional helper.',
  },
  {
    question: 'What if there are stairs at pickup or delivery?',
    answer: 'We handle stairs at both locations! Just let us know the floor number during booking. Ground floor and first floor are typically included.',
  },
  {
    question: 'How long does Facebook Marketplace delivery take?',
    answer: 'Same-day delivery is available for bookings made before 10am. Most deliveries are completed within 2-4 hours from collection.',
  },
  {
    question: 'Is my item insured during transport?',
    answer: 'Yes! All items are covered by our comprehensive goods-in-transit insurance up to £10,000.',
  },
  {
    question: 'What areas do you cover?',
    answer: 'We cover all of England, Wales, and Scotland. Enter your postcodes for an instant quote.',
  },
];

export default function FacebookMarketplaceDeliveryPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <MarketplaceServiceSchema
        serviceName="Facebook Marketplace Pickup & Delivery"
        serviceDescription="Professional Facebook Marketplace delivery service. We collect furniture from private sellers and deliver to your door."
        serviceUrl="https://speedy-van.co.uk/facebook-marketplace-delivery"
        platform="facebook"
        faqs={faqData}
      />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, blue.900, purple.900, gray.900)"
        py={{ base: 16, md: 24 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center">
            <Badge
              colorScheme="blue"
              fontSize="md"
              px={4}
              py={2}
              borderRadius="full"
            >
              <HStack spacing={2}>
                <Icon as={FaFacebook} />
                <Text>Facebook Marketplace Specialist</Text>
              </HStack>
            </Badge>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              color="white"
              lineHeight="shorter"
            >
              Facebook Marketplace Pickup & Delivery
            </Heading>

            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              color="whiteAlpha.900"
              maxW="800px"
            >
              Bought something on Facebook Marketplace? We collect from the seller and deliver straight to your door. 
              Sofas, beds, wardrobes, appliances — we handle it all with care.
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
                href="/booking-luxury?source=facebook-marketplace"
                size="lg"
                colorScheme="blue"
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

      {/* How It Works */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              How Facebook Marketplace Delivery Works
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Simple 3-step process to get your marketplace finds delivered safely
            </Text>
          </Box>

          <Flex 
            direction={{ base: 'row', md: 'row' }}
            wrap="wrap"
            gap={4}
            justify="center"
            w="full"
          >
            {[
              { num: '1', color: 'blue.500', title: 'Tell Us the Details', desc: "Enter the seller's address (or postcode) and your delivery address. Tell us what you're collecting — sofa, bed, wardrobe, etc." },
              { num: '2', color: 'green.500', title: 'We Collect From Seller', desc: 'Our professional team arrives at the seller\'s location, carefully loads your item with proper protection and equipment.' },
              { num: '3', color: 'purple.500', title: 'Delivered to Your Door', desc: 'We deliver directly to your home, handle stairs, and can even help position furniture in the room of your choice.' },
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

      {/* Popular Items We Collect */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Popular Facebook Marketplace Items We Deliver
            </Heading>
            <Text fontSize="lg" color="gray.400">
              From single items to multiple pieces — we've got you covered
            </Text>
          </Box>

          <Flex 
            wrap="wrap" 
            gap={4} 
            justify="center"
            w="full"
          >
            {[
              { icon: FaCouch, name: 'Sofas & Couches', desc: '2-seater to corner sofas' },
              { icon: FaBed, name: 'Beds & Mattresses', desc: 'Single to super king' },
              { icon: FaBox, name: 'Wardrobes', desc: 'Flat-pack or assembled' },
              { icon: FiTruck, name: 'Dining Tables', desc: 'With or without chairs' },
              { icon: FaBox, name: 'Washing Machines', desc: 'Safe appliance transport' },
              { icon: FaBox, name: 'Fridges & Freezers', desc: 'Proper handling care' },
              { icon: FaCouch, name: 'Armchairs', desc: 'Recliners included' },
              { icon: FaBox, name: 'Garden Furniture', desc: 'Sets and individual' },
            ].map((item, idx) => (
              <Box
                key={idx}
                bg="gray.800"
                borderColor="gray.700"
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                minW={{ base: '140px', sm: '180px' }}
                maxW={{ base: '160px', sm: '200px' }}
                flex="1 1 140px"
              >
                <Flex direction="row" align="center" gap={3}>
                  <Icon as={item.icon} boxSize={7} color="cyan.400" flexShrink={0} />
                  <Box>
                    <Text fontWeight="bold" color="white" fontSize="sm">
                      {item.name}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {item.desc}
                    </Text>
                  </Box>
                </Flex>
              </Box>
            ))}
          </Flex>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* Pricing Section */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              Facebook Marketplace Delivery Pricing
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Transparent pricing based on distance and item size. No hidden fees.
            </Text>
          </Box>

          <Flex 
            wrap="wrap"
            gap={4}
            justify="center"
            w="full"
          >
            {[
              { 
                title: 'Small Items', 
                price: 'from £49', 
                features: ['Chairs, small tables', 'Up to 10 miles', 'Ground floor'],
                isPopular: false,
                borderColor: 'gray.700'
              },
              { 
                title: 'Sofas & Beds', 
                price: 'from £79', 
                features: ['2-3 seater sofas', '2-man team', 'Stairs included'],
                isPopular: true,
                borderColor: 'cyan.500'
              },
              { 
                title: 'Large Items', 
                price: 'from £99', 
                features: ['Corner sofas', 'Fridge freezers', 'Pro handling'],
                isPopular: false,
                borderColor: 'gray.700'
              },
            ].map((plan, idx) => (
              <Box
                key={idx}
                bg="gray.800"
                borderColor={plan.borderColor}
                borderWidth={plan.isPopular ? '2px' : '1px'}
                borderRadius="lg"
                p={4}
                position="relative"
                w={{ base: '100%', md: 'auto' }}
                flex={{ base: '1 1 100%', sm: '1 1 calc(33% - 16px)', md: '1 1 calc(33% - 16px)' }}
                minW={{ base: '100%', sm: '200px', md: '250px' }}
                maxW={{ base: '100%', md: '320px' }}
              >
                {plan.isPopular && (
                  <Badge
                    position="absolute"
                    top="-3"
                    left="50%"
                    transform="translateX(-50%)"
                    colorScheme="cyan"
                    fontSize="xs"
                    px={3}
                    py={1}
                    whiteSpace="nowrap"
                  >
                    Most Popular
                  </Badge>
                )}
                <VStack spacing={2}>
                  <Heading size="sm" color="white" whiteSpace="nowrap">{plan.title}</Heading>
                  <Text fontSize="xl" fontWeight="bold" color="cyan.400" whiteSpace="nowrap">
                    {plan.price}
                  </Text>
                  <List spacing={1} color="gray.300" fontSize="xs">
                    {plan.features.map((feature, fIdx) => (
                      <ListItem key={fIdx}>
                        <ListIcon as={FiCheckCircle} color="green.400" />
                        {feature}
                      </ListItem>
                    ))}
                  </List>
                </VStack>
              </Box>
            ))}
          </Flex>

          <Button
            as={Link}
            href="/booking-luxury?source=facebook-marketplace"
            size="lg"
            colorScheme="cyan"
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
              Frequently Asked Questions
            </Heading>
            <Text fontSize="lg" color="gray.400">
              Everything you need to know about Facebook Marketplace delivery
            </Text>
          </Box>

          <Accordion allowToggle w="full" maxW="800px">
            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Do I need to be at the seller's address for collection?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                No, you don't need to be present. We coordinate directly with the seller for collection. 
                You just need to provide the seller's contact details and address when booking. 
                We recommend informing the seller about our arrival time.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Will the seller help with loading?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Our 2-man team can handle loading independently in most cases. 
                However, for very heavy items (like piano or large safes), we may request seller assistance 
                or recommend an additional helper. You can specify if the seller has confirmed they'll help during booking.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What if there are stairs at pickup or delivery?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                We handle stairs at both locations! Just let us know the floor number during booking. 
                Ground floor and first floor are typically included. Higher floors may incur a small 
                additional charge (£10-20) depending on the item weight and number of flights.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    How long does Facebook Marketplace delivery take?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Same-day delivery is available for bookings made before 10am (subject to availability). 
                Most deliveries are completed within 2-4 hours from collection. We'll give you a 
                specific time window and keep you updated throughout.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    Is my item insured during transport?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                Yes! All items are covered by our comprehensive goods-in-transit insurance up to £10,000. 
                We use professional blankets, straps, and protection materials to ensure your 
                Facebook Marketplace purchase arrives in the same condition it left.
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem borderColor="gray.700">
              <h3>
                <AccordionButton py={4}>
                  <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                    What areas do you cover?
                  </Box>
                  <AccordionIcon color="gray.400" />
                </AccordionButton>
              </h3>
              <AccordionPanel pb={4} color="gray.300">
                We cover all of England, Wales, and Scotland. Popular routes include London to surrounding counties, 
                Manchester area, Birmingham, Bristol, Glasgow, Edinburgh, and everything in between. 
                Enter your postcodes for an instant quote.
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </Container>

      {/* Final CTA */}
      <Box bg="blue.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Get Your Facebook Marketplace Item Delivered?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote in seconds. No hidden fees, transparent pricing, 
              and professional service guaranteed.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href="/booking-luxury?source=facebook-marketplace"
                size="lg"
                colorScheme="cyan"
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
