import { Metadata } from 'next';
import { metadata as pageMetadata } from './metadata';
import { Box, Container, Heading, Text, VStack, HStack, Icon, SimpleGrid, Card, CardBody, List, ListItem, ListIcon, Button, Divider, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from '@chakra-ui/react';
import { FiCheckCircle, FiStar, FiThumbsUp, FiTag, FiTruck } from 'react-icons/fi';

export const metadata: Metadata = pageMetadata;

export default function AffordableManAndVanPage() {
  return (
    <Box pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={12}>
          <Box textAlign="center">
            <Heading as="h1" size="2xl" mb={4}>Affordable Man and Van Service</Heading>
            <Text fontSize="xl" color="gray.600">Looking for a cheap man and van service that doesn't compromise on quality? Speedy Van offers affordable moving services across the UK. Get an instant quote and book online today.</Text>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Cheap Moving Services Without Compromise</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTag} w={12} h={12} color="teal.500" />
                <Heading size="md">Transparent Pricing</Heading>
                <Text>Our cheap man and van service has no hidden fees. You get a clear, upfront quote, so you know exactly what you're paying for.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiThumbsUp} w={12} h={12} color="teal.500" />
                <Heading size="md">5-Star Service</Heading>
                <Text>Affordable doesn't mean low quality. Our professional drivers provide a 5-star service, ensuring your move goes smoothly.</Text>
              </VStack>
              <VStack spacing={4} textAlign="center">
                <Icon as={FiTruck} w={12} h={12} color="teal.500" />
                <Heading size="md">Flexible Options</Heading>
                <Text>Choose from a range of van sizes and service options to create a cheap moving service package that fits your budget.</Text>
              </VStack>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>How We Keep Our Man and Van Service Affordable</Heading>
            <List spacing={3}>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **Efficient Operations:** Our advanced booking system and route optimization software reduce our costs, and we pass the savings on to you.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **No Hidden Fees:** We believe in honest, transparent pricing. The price you're quoted is the price you pay.</ListItem>
              <ListItem><ListIcon as={FiCheckCircle} color="green.500" /> **Pay for What You Need:** With a range of van sizes, you don't have to pay for a large van if you only have a few items to move.</ListItem>
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
                <Text fontStyle="italic">"I was looking for a cheap man and van near me and found Speedy Van. The service was excellent and the price was very reasonable. Highly recommend!"</Text>
                <Text fontWeight="bold" mt={4}>- Laura, London</Text>
              </Box>
              <Box p={6} borderWidth="1px" borderRadius="lg">
                <HStack mb={2}>
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                  <Icon as={FiStar} color="yellow.400" />
                </HStack>
                <Text fontStyle="italic">"An affordable man and van service that is also reliable and professional. I was very impressed with the service and will use them again."</Text>
                <Text fontWeight="bold" mt={4}>- Ben, Bristol</Text>
              </Box>
            </SimpleGrid>
          </Box>

          <Divider />

          <Box w="full">
            <Heading as="h2" size="xl" mb={6}>Frequently Asked Questions</Heading>
            <Accordion allowToggle>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Is your cheap man and van service available near me?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>Yes, our affordable man and van service is available across the UK. We have drivers in all major cities, so we're always local to you.</AccordionPanel>
              </AccordionItem>
              <AccordionItem>
                <h2><AccordionButton><Box flex="1" textAlign="left">Are there any hidden costs with your cheap moving services?</Box><AccordionIcon /></AccordionButton></h2>
                <AccordionPanel pb={4}>No, there are absolutely no hidden costs. The price you are quoted is the final price you will pay. Our affordable man and van service is built on trust and transparency.</AccordionPanel>
              </AccordionItem>
            </Accordion>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Heading size="lg" mb={4}>Get a Quote for Your Affordable Man and Van</Heading>
            <Button as="a" href="/booking-luxury" colorScheme="teal" size="lg">Book Your Cheap Move Now</Button>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

