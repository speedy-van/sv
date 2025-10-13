'use client';

import { Box, Container, Heading, Text, VStack, HStack, Icon, SimpleGrid, Card, CardBody, List, ListItem, ListIcon, Button, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiStar, FiUsers, FiTool, FiTruck } from 'react-icons/fi';

export default function FurnitureMoversPage() {
  return (
    <Box pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>Expert Furniture Movers for Your Home or Office</Heading>
            <Text fontSize="xl" color="gray.600">Hire professional furniture movers for safe and reliable transport of your valuable items. Our expert team is trained to handle all types of furniture with care. Book your furniture moving service today.</Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Why Choose Our Furniture Moving Service?</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiUsers} w={12} h={12} color="purple.500" />
                <Heading size="md">Experienced Team</Heading>
                <Text>Our furniture movers are highly trained and experienced in handling all types of furniture, from delicate antiques to heavy, bulky items.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTool} w={12} h={12} color="purple.500" />
                <Heading size="md">Assembly & Disassembly</Heading>
                <Text>We provide a complete furniture moving service, including disassembly and reassembly of your items as required.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTruck} w={12} h={12} color="purple.500" />
                <Heading size="md">Modern Fleet</Heading>
                <Text>Our fleet of modern, clean, and fully-equipped vans ensures your furniture is transported securely.</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Types of Furniture We Move</Heading>
            <Text fontSize="lg" mb={4}>Our furniture movers are equipped to handle a wide range of items for both residential and commercial clients.</Text>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Living Room</Heading><Text>Sofas, armchairs, coffee tables</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Bedroom</Heading><Text>Beds, wardrobes, chest of drawers</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Dining Room</Heading><Text>Dining tables, chairs, sideboards</Text></VStack></CardBody></Card>
                <Card borderWidth="1px" borderRadius="lg"><CardBody><VStack><Heading size="md">Office</Heading><Text>Desks, office chairs, filing cabinets</Text></VStack></CardBody></Card>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Our Furniture Moving Process</Heading>
            <List spacing={3}>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **1. Free Quote:** Contact us for a free, no-obligation quote for your furniture moving service.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **2. Planning:** We work with you to plan the move, including dates, times, and any special requirements.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **3. Moving Day:** Our professional furniture movers arrive on time, with all the necessary equipment.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **4. Safe Transport:** We load, transport, and unload your furniture with the utmost care.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **5. Placement:** We place your furniture in the desired rooms, and can reassemble items if required.</ListItem>
            </List>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>What Our Customers Say</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"I hired Speedy Van as my furniture movers for my recent house move. They were brilliant! So careful with my belongings and very efficient."</Text>
                <Text fontWeight="bold" mt={4}>- Jessica, Bristol</Text>
              </Box>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"A great furniture moving service. The movers were friendly, professional, and made the whole process stress-free. I would definitely use them again."</Text>
                <Text fontWeight="bold" mt={4}>- Tom, Leeds</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            <Accordion allowToggle>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">How much does it cost to hire furniture movers?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>The cost of our furniture moving service depends on the number of items, the distance of the move, and the number of movers required. We provide a free, detailed quote with no hidden charges.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Are your furniture movers insured?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Yes, all our furniture movers are fully insured. We have both Goods in Transit and Public Liability insurance for your complete peace of mind.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Heading size="lg" mb={4}>Book Your Professional Furniture Movers Today</Heading>
            <Button as="a" href="/booking-luxury" colorScheme="purple" size="lg">Get a Free Quote</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

