'use client';

import { Container, Heading, Text, VStack, Box, Divider, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckCircleIcon } from '@chakra-ui/icons';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function TermsPage() {
  return (
    <>
      <Header />
      <MobileHeader />
      <Container maxW="5xl" py={{ base: 20, md: 32 }} mt={{ base: 16, md: 20 }}>
        <VStack align="start" spacing={10}>
          {/* Header Section */}
          <Box w="full">
            <Heading 
              as="h1" 
              fontSize={{ base: '3xl', md: '5xl' }}
              fontWeight="bold"
              color="white"
              mb={4}
              bgGradient="linear(to-r, white, blue.200)"
              bgClip="text"
            >
              Terms & Conditions
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="rgba(255, 255, 255, 0.8)" lineHeight="tall">
              By using our services, you agree to these terms. Please review them carefully to understand your rights and obligations when booking with Speedy Van.
            </Text>
          </Box>

          <Divider borderColor="rgba(59, 130, 246, 0.3)" />
          
          {/* Company Info Card */}
          <Box 
            w="full"
            p={{ base: 6, md: 8 }}
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
            borderRadius="xl"
            border="2px solid"
            borderColor="rgba(59, 130, 246, 0.4)"
            shadow="lg"
          >
            <VStack align="start" spacing={3}>
              <Heading as="h2" fontSize="2xl" fontWeight="bold" color="blue.300">
                SPEEDY VAN REMOVALS LTD
              </Heading>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)" fontWeight="medium">
                Company No. SC865658 · Registered in Scotland
              </Text>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)">
                📍 Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom
              </Text>
              <Text fontSize="md" color="rgba(255, 255, 255, 0.85)">
                📧 support@speedy-van.co.uk | 📞 01202 129746
              </Text>
            </VStack>
          </Box>

          {/* Terms Sections */}
          <VStack align="start" spacing={8} w="full">
            {/* Section 1 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                1. Service Agreement
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                By booking with Speedy Van, you enter into a contract for removal and transportation services. 
                These terms govern the provision of our man and van services throughout the UK. We are committed 
                to providing professional, reliable, and fully insured moving solutions.
              </Text>
            </Box>

            {/* Section 2 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                2. Booking and Quotes
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                All quotes are valid for 7 days from the date of issue. Prices are fixed and transparent with no hidden fees.
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Final costs confirmed upon booking
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Includes driver, van, fuel, and basic insurance
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Additional services charged separately as agreed
                </ListItem>
              </List>
            </Box>

            {/* Section 3 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                3. Cancellation Policy
              </Heading>
              <VStack align="start" spacing={4} w="full">
                <Box 
                  p={4} 
                  bg="rgba(34, 197, 94, 0.1)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(34, 197, 94, 0.3)"
                  w="full"
                >
                  <Text fontWeight="bold" color="green.300" mb={2}>✓ 48+ hours notice</Text>
                  <Text color="rgba(255, 255, 255, 0.85)">Full refund eligible</Text>
                </Box>
                <Box 
                  p={4} 
                  bg="rgba(251, 191, 36, 0.1)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(251, 191, 36, 0.3)"
                  w="full"
                >
                  <Text fontWeight="bold" color="yellow.300" mb={2}>⚠ 24-48 hours notice</Text>
                  <Text color="rgba(255, 255, 255, 0.85)">50% cancellation fee applies</Text>
                </Box>
                <Box 
                  p={4} 
                  bg="rgba(239, 68, 68, 0.1)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(239, 68, 68, 0.3)"
                  w="full"
                >
                  <Text fontWeight="bold" color="red.300" mb={2}>✗ Less than 24 hours / No-show</Text>
                  <Text color="rgba(255, 255, 255, 0.85)">Full amount charged</Text>
                </Box>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" fontStyle="italic">
                  All refunds processed within 5-7 business days
                </Text>
              </VStack>
            </Box>

            {/* Section 4 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                4. Customer Responsibilities
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                To ensure smooth service delivery, you must:
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Ensure adequate parking access at collection and delivery addresses
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Provide accurate item details (dimensions, weight, quantity)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Declare special requirements (stairs, narrow doorways, restricted access)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Declare valuable or fragile items in advance
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Secure parking permits if required
                </ListItem>
              </List>
            </Box>

            {/* Section 5 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                5. Insurance and Liability
              </Heading>
              <Box 
                p={6} 
                bg="rgba(59, 130, 246, 0.08)" 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="rgba(59, 130, 246, 0.3)"
              >
                <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                  We carry comprehensive goods in transit insurance covering standard household items up to <Text as="span" fontWeight="bold" color="blue.300">£10,000</Text>.
                </Text>
                <List spacing={2}>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    • Liability limited to value declared at booking
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    • High-value items (over £500) must be declared separately
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    • Not liable for damages from improper packing or inherent defects
                  </ListItem>
                </List>
              </Box>
            </Box>

            {/* Section 6 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                6. Payment Terms
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                Payment required upon booking confirmation via our secure online platform.
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  All major credit/debit cards accepted via Stripe
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Card details encrypted and not stored on our servers
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  Business invoicing available upon request with approved credit terms
                </ListItem>
              </List>
            </Box>

            {/* Section 7 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                7. Service Delays
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                While we strive for punctuality, delays may occur due to traffic, weather, or unforeseen circumstances. 
                We will notify you promptly of any significant delays. We are not liable for consequential damages 
                resulting from delays beyond our reasonable control.
              </Text>
            </Box>

            {/* Section 8 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                8. Prohibited Items
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                For safety and legal reasons, we cannot transport:
              </Text>
              <Box 
                p={5} 
                bg="rgba(239, 68, 68, 0.08)" 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="rgba(239, 68, 68, 0.3)"
              >
                <List spacing={2}>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">⛔ Hazardous materials</ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">⛔ Illegal substances</ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">⛔ Firearms and explosives</ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">⛔ Perishable goods</ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">⛔ Live animals</ListItem>
                </List>
                <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" mt={3} fontStyle="italic">
                  💎 Cash, jewelry, and important documents should be transported personally
                </Text>
              </Box>
            </Box>

            {/* Section 9 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                9. Data Protection
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                We process your personal data in accordance with UK GDPR and our Privacy Policy. Your information 
                is used solely for service delivery, customer support, and legal compliance. We do not sell or share 
                your data with third parties except as required for service delivery (e.g., payment processing).
              </Text>
            </Box>

            {/* Section 10 */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                10. Dispute Resolution
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                Any disputes should first be addressed through our customer support team. If unresolved, matters 
                may be escalated to mediation or arbitration under Scottish law. These terms are governed by the 
                laws of Scotland, and parties submit to the exclusive jurisdiction of Scottish courts.
              </Text>
            </Box>
          </VStack>

          <Divider borderColor="rgba(59, 130, 246, 0.3)" />

          {/* Contact Section */}
          <Box 
            w="full"
            p={{ base: 6, md: 8 }}
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)"
            borderRadius="xl"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <VStack align="start" spacing={4}>
              <Heading as="h3" fontSize="xl" color="blue.300">
                Questions About These Terms?
              </Heading>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                For questions about these terms or to request the complete terms and conditions document, 
                please contact us:
              </Text>
              <VStack align="start" spacing={2}>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📧 <Text as="span" fontWeight="medium">support@speedy-van.co.uk</Text>
                </Text>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📞 <Text as="span" fontWeight="medium">01202 129746</Text>
                </Text>
              </VStack>
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" mt={2}>
                Last Updated: December 2025
              </Text>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </>
  );
}
