'use client';

import { Box, Container, Heading, Text, VStack, HStack, Icon, SimpleGrid, Card, CardBody, List, ListItem, ListIcon, Button, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiStar, FiShield, FiPackage, FiTruck } from 'react-icons/fi';

export default function FurnitureRemovalPage() {
  return (
    <Box pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>Professional Furniture Removal Service</Heading>
            <Text fontSize="xl" color="gray.600">Expert furniture movers you can trust. From single items to full house moves, we handle your furniture with the utmost care. Safe, reliable, and affordable furniture removal across the UK.</Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Expert Furniture Movers You Can Trust</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiShield} w={12} h={12} color="green.500" />
                <Heading size="md">Fully Insured</Heading>
                <Text>Your furniture is protected with our comprehensive insurance. We are a furniture moving service that gives you peace of mind.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiPackage} w={12} h={12} color="green.500" />
                <Heading size="md">Specialist Equipment</Heading>
                <Text>We use professional equipment for safe furniture removal, including blankets, straps, and trolleys to protect your items.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTruck} w={12} h={12} color="green.500" />
                <Heading size="md">All Van Sizes</Heading>
                <Text>From a single sofa removal to a full house, we have the right van for your furniture transport needs.</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Furniture Removal Services We Offer</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Sofa Removal</Heading><Text>Safe and secure sofa transport.</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Bed & Wardrobe</Heading><Text>Dismantling and reassembly available.</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Office Furniture</Heading><Text>Desks, chairs, and filing cabinets.</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">White Goods</Heading><Text>Fridges, washing machines, etc.</Text></VStack></CardBody></Card>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Furniture Removal Pricing</Heading>
            <Text fontSize="lg" mb={4}>Transparent and competitive pricing for all furniture removal services. No hidden costs.</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Single Item</Heading>
                    <Text fontSize="2xl" fontWeight="bold">from £80</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> e.g., a sofa or wardrobe</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 2-man team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Fully insured</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg" borderColor="green.500">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Multi-Item</Heading>
                    <Text fontSize="2xl" fontWeight="bold">from £120</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Up to 5 items</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 2-man team</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Assembly service available</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Full House</Heading>
                    <Text fontSize="2xl" fontWeight="bold">Custom Quote</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Complete house contents</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Packing service available</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Free survey</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Happy Customers</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"The team from Speedy Van were fantastic. They moved my antique wardrobe without a scratch. A truly professional furniture moving service."</Text>
                <Text fontWeight="bold" mt={4}>- Emily, Manchester</Text>
              </Box>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"I used their furniture removal service to clear out my late mother's house. The team was compassionate, efficient, and very respectful."</Text>
                <Text fontWeight="bold" mt={4}>- David, Birmingham</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            <Accordion allowToggle>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Do you offer furniture disposal?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>While our primary service is furniture removal and transport, we can arrange for furniture disposal through our certified partners. Please let us know in advance if you require this service.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Can you dismantle and reassemble furniture?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Yes, our professional furniture movers are equipped with tools and expertise to dismantle and reassemble most types of furniture, including beds, wardrobes, and tables.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Is your furniture removal service insured?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Absolutely. We have comprehensive goods in transit insurance to protect your furniture during transport. Our furniture moving service is designed to give you complete peace of mind.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Heading size="lg" mb={4}>Book Your Furniture Removal Today</Heading>
            <Button as="a" href="/booking-luxury" colorScheme="green" size="lg">Get a Free Quote</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

