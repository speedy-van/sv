'use client';

import { Box, Container, Heading, Text, VStack, HStack, Icon, SimpleGrid, Card, CardBody, List, ListItem, ListIcon, Button, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiStar, FiClock, FiDollarSign, FiTruck } from 'react-icons/fi';

export default function VanHirePage() {
  return (
    <Box pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>Van Hire with Professional Driver</Heading>
            <Text fontSize="xl" color="gray.600">Affordable van hire with a professional driver. Our man and van service is perfect for moving anything from single items to full loads. Book your van with driver online for a fixed hourly rate.</Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Why Hire a Van with Driver?</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiDollarSign} w={12} h={12} color="orange.500" />
                <Heading size="md">Cost-Effective</Heading>
                <Text>Hiring a van with a driver is often cheaper than self-drive van hire, with no deposits or insurance hassles. Our man and van hire is a simple, pay-by-the-hour service.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiClock} w={12} h={12} color="orange.500" />
                <Heading size="md">Saves Time & Effort</Heading>
                <Text>Let our professional driver handle the loading, driving, and unloading. You can sit back and relax while we do the heavy lifting.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTruck} w={12} h={12} color="orange.500" />
                <Heading size="md">The Right Van for the Job</Heading>
                <Text>We have a range of van sizes available, so you only pay for the space you need. Our team can help you choose the perfect van for your requirements.</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Our Van Sizes</Heading>
            <Text fontSize="lg" mb={4}>We offer a range of vans to suit any job, big or small. All our vans are clean, modern, and fully equipped.</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Medium Van</Heading>
                    <Text>e.g., Ford Transit Custom</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Load space: 5.95 m³</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Payload: 1,000 kg</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Ideal for small moves</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg" borderColor="orange.500">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Large Van</Heading>
                    <Text>e.g., Ford Transit LWB</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Load space: 11.5 m³</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Payload: 1,200 kg</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 1-2 bed flat moves</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Luton Van</Heading>
                    <Text>e.g., Ford Transit Luton</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Load space: 15.1 m³</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Payload: 1,000 kg</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 2-3 bed house moves</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
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
                <Text fontStyle="italic">"Great service! The van hire with driver was so much easier than renting a van myself. The driver was helpful and professional."</Text>
                <Text fontWeight="bold" mt={4}>- Michael, London</Text>
              </Box>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"I needed to hire a van and driver to collect some furniture. Speedy Van was affordable and the service was excellent. I'll definitely use them again."</Text>
                <Text fontWeight="bold" mt={4}>- Chloe, Manchester</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            <Accordion allowToggle>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">What's included in the van hire with driver service?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Our van hire with driver service includes the van, a professional driver, and help with loading and unloading. Fuel is also included in the hourly rate.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Can I travel in the van with the driver?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Yes, you can travel in the van with the driver. Most of our vans have seating for 1 or 2 passengers, but please check when booking.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Heading size="lg" mb={4}>Book Your Van with Driver Today</Heading>
            <Button as="a" href="/booking-luxury" colorScheme="orange" size="lg">Get an Instant Quote</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

