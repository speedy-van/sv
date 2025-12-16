'use client';

import { Container, Heading, Text, VStack, Box, Divider, List, ListItem, ListIcon } from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon, InfoIcon } from '@chakra-ui/icons';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

export default function PrivacyPage() {
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
              Privacy Policy
            </Heading>
            <Text fontSize={{ base: 'md', md: 'lg' }} color="rgba(255, 255, 255, 0.8)" lineHeight="tall">
              Your privacy matters to us. Learn how we collect, use, and protect your personal information in compliance with UK GDPR.
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

          {/* Privacy Sections */}
          <VStack align="start" spacing={8} w="full">
            {/* Introduction */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                Our Commitment to Your Privacy
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                At Speedy Van, we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, store, and safeguard your information when you use our services.
              </Text>
              <Box 
                p={5} 
                bg="rgba(34, 197, 94, 0.1)" 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="rgba(34, 197, 94, 0.3)"
              >
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md" lineHeight="tall">
                  🔒 We comply with UK GDPR (General Data Protection Regulation) and Data Protection Act 2018, ensuring your data rights are fully protected.
                </Text>
              </Box>
            </Box>

            {/* Information We Collect */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                1. Information We Collect
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                We only collect information necessary to provide our services:
              </Text>
              
              <VStack align="start" spacing={5} w="full">
                {/* Personal Information */}
                <Box 
                  w="full"
                  p={5} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Heading as="h3" fontSize="lg" color="blue.300" mb={3}>
                    Personal Information
                  </Heading>
                  <List spacing={2}>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={CheckCircleIcon} color="blue.400" />
                      Name and contact details (email, phone number)
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={CheckCircleIcon} color="blue.400" />
                      Pickup and delivery addresses
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={CheckCircleIcon} color="blue.400" />
                      Booking details and service preferences
                    </ListItem>
                  </List>
                </Box>

                {/* Payment Information */}
                <Box 
                  w="full"
                  p={5} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Heading as="h3" fontSize="lg" color="blue.300" mb={3}>
                    Payment Information
                  </Heading>
                  <List spacing={2}>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={LockIcon} color="green.400" />
                      <Text as="span" fontWeight="semibold">Secure Processing:</Text> All payments processed via Stripe
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={LockIcon} color="green.400" />
                      <Text as="span" fontWeight="semibold">No Storage:</Text> We do NOT store your card details
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={LockIcon} color="green.400" />
                      <Text as="span" fontWeight="semibold">PCI Compliant:</Text> Bank-grade encryption for all transactions
                    </ListItem>
                  </List>
                </Box>

                {/* Technical Information */}
                <Box 
                  w="full"
                  p={5} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  border="1px solid" 
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Heading as="h3" fontSize="lg" color="blue.300" mb={3}>
                    Technical Information
                  </Heading>
                  <List spacing={2}>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={InfoIcon} color="blue.400" />
                      IP address and browser type (for security)
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={InfoIcon} color="blue.400" />
                      Device information and operating system
                    </ListItem>
                    <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                      <ListIcon as={InfoIcon} color="blue.400" />
                      Usage data to improve our website and services
                    </ListItem>
                  </List>
                </Box>
              </VStack>
            </Box>

            {/* How We Use Your Data */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                2. How We Use Your Data
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                Your data is used solely for legitimate business purposes:
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Service Delivery:</Text> Processing bookings, scheduling drivers, and coordinating removals
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Communication:</Text> Sending booking confirmations, updates, and support responses
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Payment Processing:</Text> Secure transaction handling via Stripe
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Legal Compliance:</Text> Meeting regulatory and tax obligations
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Service Improvement:</Text> Analyzing usage to enhance customer experience
                </ListItem>
              </List>
            </Box>

            {/* Data Sharing */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                3. Data Sharing & Third Parties
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                We do NOT sell or rent your personal data. We only share information with trusted partners when necessary:
              </Text>
              <VStack align="start" spacing={4} w="full">
                <Box 
                  p={4} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  w="full"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Text color="rgba(255, 255, 255, 0.9)" fontSize="md" mb={2}>
                    <Text as="span" fontWeight="bold" color="blue.300">Stripe</Text> - Secure payment processing (PCI DSS compliant)
                  </Text>
                </Box>
                <Box 
                  p={4} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  w="full"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Text color="rgba(255, 255, 255, 0.9)" fontSize="md" mb={2}>
                    <Text as="span" fontWeight="bold" color="blue.300">Assigned Drivers</Text> - Minimal info needed for service delivery (name, address, phone)
                  </Text>
                </Box>
                <Box 
                  p={4} 
                  bg="rgba(59, 130, 246, 0.08)" 
                  borderRadius="lg" 
                  w="full"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <Text color="rgba(255, 255, 255, 0.9)" fontSize="md" mb={2}>
                    <Text as="span" fontWeight="bold" color="blue.300">Legal Authorities</Text> - Only when required by law
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* Data Security */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                4. Data Security
              </Heading>
              <Box 
                p={6} 
                bg="rgba(34, 197, 94, 0.1)" 
                borderRadius="lg" 
                border="1px solid" 
                borderColor="rgba(34, 197, 94, 0.3)"
              >
                <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                  We implement industry-standard security measures to protect your data:
                </Text>
                <List spacing={3}>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={LockIcon} color="green.400" />
                    SSL/TLS encryption for all data transmission
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={LockIcon} color="green.400" />
                    Secure database storage with access controls
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={LockIcon} color="green.400" />
                    Regular security audits and vulnerability assessments
                  </ListItem>
                  <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                    <ListIcon as={LockIcon} color="green.400" />
                    Employee training on data protection best practices
                  </ListItem>
                </List>
              </Box>
            </Box>

            {/* Data Retention */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                5. Data Retention
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={3}>
                We retain your data only as long as necessary:
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • <Text as="span" fontWeight="semibold">Active Bookings:</Text> Until service completion + 30 days
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • <Text as="span" fontWeight="semibold">Completed Bookings:</Text> Up to 7 years (for legal/tax compliance)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • <Text as="span" fontWeight="semibold">Marketing Preferences:</Text> Until you unsubscribe or request deletion
                </ListItem>
              </List>
            </Box>

            {/* Your Rights */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                6. Your Data Rights (UK GDPR)
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                Under UK GDPR, you have the following rights:
              </Text>
              <List spacing={3}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Access:</Text> Request a copy of your personal data
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Rectification:</Text> Correct inaccurate or incomplete data
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Erasure:</Text> Request deletion of your data (subject to legal obligations)
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Restriction:</Text> Limit how we use your data
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Data Portability:</Text> Receive your data in a structured format
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  <ListIcon as={CheckCircleIcon} color="blue.400" />
                  <Text as="span" fontWeight="semibold">Right to Object:</Text> Object to processing based on legitimate interests
                </ListItem>
              </List>
              <Box 
                p={4} 
                bg="rgba(59, 130, 246, 0.1)" 
                borderRadius="md" 
                w="full"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.3)"
                mt={4}
              >
                <Text color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  To exercise any of these rights, contact us at <Text as="span" fontWeight="semibold">support@speedy-van.co.uk</Text>. We'll respond within 30 days.
                </Text>
              </Box>
            </Box>

            {/* Cookies */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                7. Cookies & Tracking
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall" mb={4}>
                We use essential cookies to ensure our website functions properly. These include:
              </Text>
              <List spacing={2}>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Session cookies for login and booking flow
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Security cookies to prevent fraud
                </ListItem>
                <ListItem color="rgba(255, 255, 255, 0.85)" fontSize="md">
                  • Preference cookies to remember your settings
                </ListItem>
              </List>
              <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm" mt={3} fontStyle="italic">
                You can control cookie preferences in your browser settings.
              </Text>
            </Box>

            {/* Changes to Policy */}
            <Box w="full">
              <Heading as="h2" fontSize={{ base: 'xl', md: '2xl' }} color="blue.300" mb={4}>
                8. Changes to This Policy
              </Heading>
              <Text color="rgba(255, 255, 255, 0.9)" fontSize={{ base: 'md', md: 'lg' }} lineHeight="tall">
                We may update this privacy policy periodically to reflect changes in our practices or legal requirements. We'll notify you of significant changes via email or a prominent notice on our website. Continued use of our services after changes constitutes acceptance of the updated policy.
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
                Privacy Questions or Data Requests?
              </Heading>
              <Text color="rgba(255, 255, 255, 0.85)" fontSize="md" lineHeight="tall">
                For questions about this privacy policy, to exercise your data rights, or to request full details about how we handle your information, please contact us:
              </Text>
              <VStack align="start" spacing={2}>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📧 <Text as="span" fontWeight="medium">support@speedy-van.co.uk</Text>
                </Text>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📞 <Text as="span" fontWeight="medium">01202 129746</Text>
                </Text>
                <Text color="rgba(255, 255, 255, 0.9)" fontSize="md">
                  📍 <Text as="span" fontWeight="medium">Data Protection Officer, Office 2.18 1 Barrack St, Hamilton ML3 0HS</Text>
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
