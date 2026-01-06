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
  FiHome,
  FiPackage,
  FiUsers,
} from 'react-icons/fi';
import Link from 'next/link';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function HouseRemovalsPage() {
  return (
    <>
      <Header />
      <MobileHeader />
    <Box pt={36} bg="gray.900" minH="100vh">
      {/* Hero Section */}
      <Box
        bgGradient="linear(to-br, blue.900, indigo.900, gray.900)"
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
                <Icon as={FiHome} />
                <Text>Complete House Moving Service</Text>
              </HStack>
            </Badge>

            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              color="white"
              maxW="900px"
              lineHeight="shorter"
            >
              Professional House Removals
              <Text as="span" display="block" color="blue.300">
                Stress-Free Moving Across the UK
              </Text>
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="gray.300" maxW="700px">
              Full-service house removals with professional packing, careful handling, 
              and reliable delivery. From studio flats to 5-bedroom homes - we move you safely.
            </Text>

            <HStack spacing={4} pt={4} flexWrap="wrap" justify="center">
              <Button
                as={Link}
                href="/booking-luxury?service=house-removal"
                size="lg"
                colorScheme="blue"
                rightIcon={<FiTruck />}
              >
                Get Free Quote
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

            {/* Trust Badges */}
            <HStack spacing={8} pt={6} flexWrap="wrap" justify="center">
              {[
                { icon: FiShield, text: 'Fully Insured' },
                { icon: FiStar, text: '4.9★ Rated' },
                { icon: FiClock, text: 'Flexible Dates' },
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

      {/* Services Included */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h2" size="xl" mb={4} color="white">
              What&apos;s Included in Our House Removal Service
            </Heading>
            <Text fontSize="lg" color="gray.400" maxW="700px" mx="auto">
              Everything you need for a smooth, hassle-free move
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            {[
              {
                icon: FiUsers,
                title: 'Professional Team',
                desc: 'Experienced 2-3 man crew depending on property size. Trained in careful handling and efficient loading.',
              },
              {
                icon: FiPackage,
                title: 'Packing Service',
                desc: 'Optional full or partial packing service. We supply boxes, bubble wrap, and packing paper.',
              },
              {
                icon: FiShield,
                title: 'Full Insurance',
                desc: 'Comprehensive goods-in-transit insurance up to £50,000. Your belongings are protected.',
              },
              {
                icon: FiTruck,
                title: 'Right-Sized Van',
                desc: 'We match the van to your move. From Luton vans to large removal trucks.',
              },
              {
                icon: FiClock,
                title: 'Flexible Timing',
                desc: 'Weekend and evening moves available. We work around your schedule.',
              },
              {
                icon: FiHome,
                title: 'Room-by-Room Placement',
                desc: 'We don&apos;t just dump boxes. Items placed exactly where you want them.',
              },
            ].map((item) => (
              <Card key={item.title} bg="gray.800" borderColor="gray.700" borderWidth="1px">
                <CardBody>
                  <VStack spacing={4} align="start">
                    <Icon as={item.icon} boxSize={8} color="blue.400" />
                    <Heading size="md" color="white">{item.title}</Heading>
                    <Text color="gray.400">{item.desc}</Text>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>

      <Divider borderColor="gray.700" />

      {/* FAQs */}
      <Container maxW="container.xl" py={16}>
        <VStack spacing={8}>
          <Heading as="h2" size="xl" mb={4} color="white" textAlign="center">
            House Removal FAQs
          </Heading>

          <Accordion allowToggle w="full" maxW="800px">
            {[
              {
                q: 'How far in advance should I book?',
                a: 'We recommend booking 2-4 weeks ahead for house moves, especially at busy times (end of month, summer). However, we can often accommodate last-minute moves if availability allows.',
              },
              {
                q: 'Do you provide packing materials?',
                a: 'Yes! We can supply boxes, bubble wrap, packing paper, and tape. These can be delivered before your move or brought on the day. Packing materials are charged separately.',
              },
              {
                q: 'What items can you not move?',
                a: 'We cannot transport hazardous materials (paint, chemicals, gas canisters), perishable food, or plants over long distances. We also recommend you transport valuables like jewelry and important documents yourself.',
              },
              {
                q: 'Do I need to be present during the move?',
                a: 'Someone needs to be present at both the collection and delivery addresses to sign off on the inventory and direct where items should be placed.',
              },
              {
                q: 'What if something gets damaged?',
                a: 'All moves are fully insured. In the rare event of damage, report it to us within 24 hours with photos and we will process your claim promptly.',
              },
            ].map((faq) => (
              <AccordionItem key={faq.q} borderColor="gray.700">
                <h3>
                  <AccordionButton py={4}>
                    <Box flex="1" textAlign="left" fontWeight="semibold" color="white">
                      {faq.q}
                    </Box>
                    <AccordionIcon color="gray.400" />
                  </AccordionButton>
                </h3>
                <AccordionPanel pb={4} color="gray.300">
                  {faq.a}
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </VStack>
      </Container>

      {/* Final CTA */}
      <Box bg="blue.900" py={16}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Book Your House Move?
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.900" maxW="600px">
              Get an instant quote online or speak to our team to plan your move.
            </Text>
            <HStack spacing={4}>
              <Button
                as={Link}
                href="/booking-luxury?service=house-removal"
                size="lg"
                colorScheme="cyan"
                rightIcon={<FiTruck />}
              >
                Get Free Quote
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
