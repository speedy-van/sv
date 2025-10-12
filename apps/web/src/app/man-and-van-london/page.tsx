import { Metadata } from 'next';
import { metadata as pageMetadata } from './metadata';
import { Box, Container, Heading, Text, VStack, HStack, Icon, SimpleGrid, Card, CardBody, List, ListItem, ListIcon, Button, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiStar, FiPhone, FiCalendar, FiTruck } from 'react-icons/fi';

export const metadata: Metadata = pageMetadata;

export default function ManAndVanLondonPage() {
  return (
    <Box pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>Professional Man and Van Service in London</Heading>
            <Text fontSize="xl" color="gray.600">Same day service from £25/hour. We cover all of London for furniture delivery, house moves, and more. Book your trusted London man and van online in minutes.</Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Why Choose Our Man and Van Service in London?</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTruck} w={12} h={12} color="blue.500" />
                <Heading size="md">Reliable & Professional</Heading>
                <Text>Our experienced and vetted drivers ensure your items are transported safely and efficiently. We are the go-to man and van service in London.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiCalendar} w={12} h={12} color="blue.500" />
                <Heading size="md">Same-Day Service</Heading>
                <Text>Need to move something urgently? Our same day man and van London service is available 7 days a week. Book now and get a driver in under an hour.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiPhone} w={12} h={12} color="blue.500" />
                <Heading size="md">Easy Online Booking</Heading>
                <Text>Get an instant quote and book your man with a van in London in just a few clicks. No hidden fees, just transparent pricing.</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Affordable Man and Van Rates - From £25/Hour</Heading>
            <Text fontSize="lg" mb={4}>We offer competitive and transparent pricing for our man and van London services. Choose the right van size for your needs and save money.</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Medium Van</Heading>
                    <Text fontSize="2xl" fontWeight="bold">from £25/hour</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Ideal for small moves</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Up to 10 boxes</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 1-2 furniture items</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg" borderColor="blue.500">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Large Van</Heading>
                    <Text fontSize="2xl" fontWeight="bold">from £35/hour</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 1-2 bedroom flat moves</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Up to 25 boxes</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Sofas, beds, wardrobes</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
              <Card borderWidth="1px" borderRadius="lg">
                <CardBody>
                  <VStack spacing={4}>
                    <Heading size="lg">Luton Van</Heading>
                    <Text fontSize="2xl" fontWeight="bold">from £45/hour</Text>
                    <List spacing={2}>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> 2-3 bedroom house moves</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> Up to 40 boxes</ListItem>
                      <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> All household furniture</ListItem>
                    </List>
                  </VStack>
                </CardBody>
              </Card>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>What Our London Customers Say</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"The best man and van service in London! The driver was on time, professional, and handled my furniture with care. Highly recommended."</Text>
                <Text fontWeight="bold" mt={4}>- Sarah, Camden</Text>
              </Box>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"I needed a same day man and van in London to pick up a sofa I bought online. Speedy Van was fast, affordable, and the service was excellent."</Text>
                <Text fontWeight="bold" mt={4}>- Mark, Shoreditch</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            <Accordion allowToggle>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">How much does a man and van in London cost?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Our man and van London prices start from just £25 per hour for a medium van. The final cost depends on the van size, number of helpers, and the duration of the job. We offer transparent pricing with no hidden fees.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Do you offer a same day man and van service in London?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Yes, we specialize in same day man and van services across London. We can often get a driver to you within an hour of booking, subject to availability.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">What areas of London do you cover?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>We cover all of Greater London, including Central London, North, South, East, and West London. Whether you\'re in Westminster, Camden, Islington, Hackney, or any other London borough, our man and van service is available to you.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Heading size="lg" mb={4}>Ready to Book Your Man and Van in London?</Heading>
            <Button as="a" href="/booking-luxury" colorScheme="blue" size="lg">Get an Instant Quote & Book Online</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

