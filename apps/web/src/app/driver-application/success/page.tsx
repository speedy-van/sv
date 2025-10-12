'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Icon,
  Alert,
  AlertIcon,
  List,
  ListItem,
  ListIcon,
  useColorModeValue,
  Container,
  chakra,
  Divider,
  Badge,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FiCheckCircle,
  FiMail,
  FiPhone,
  FiClock,
  FiFileText,
  FiShield,
  FiTruck,
  FiHome,
  FiLogIn,
  FiArrowRight,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return !prop.startsWith('while') && !prop.startsWith('animate') && !prop.startsWith('initial') && !prop.startsWith('transition') && !prop.startsWith('viewport');
    }
    return true;
  },
});

export default function DriverApplicationSuccessPage() {
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box
      minH="100vh"
      bg="bg.canvas"
      py={{ base: 8, md: 12 }}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        opacity={0.02}
        background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.1) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="4xl" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
          transition="0.5s ease-out"
        >
          <VStack spacing={{ base: 8, md: 12 }} align="stretch">
            {/* Success Header */}
            <Box textAlign="center" py={{ base: 4, md: 6 }}>
              <VStack spacing={6}>
                <MotionBox
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition="0.5s ease-out 0.2s"
                >
                  <Box
                    p={6}
                    borderRadius="2xl"
                    bg="linear-gradient(135deg, rgba(0,209,143,0.1), rgba(0,194,255,0.1))"
                    borderWidth="2px"
                    borderColor="green.400"
                    display="inline-block"
                    boxShadow="0 8px 25px rgba(0,209,143,0.3)"
                  >
                    <Icon as={FiCheckCircle} boxSize={16} color="green.500" />
                  </Box>
                </MotionBox>
                <VStack spacing={4}>
                  <Heading
                    size={{ base: 'xl', md: '2xl' }}
                    color="green.500"
                    fontWeight="extrabold"
                  >
                    Application Submitted Successfully! 🎉
                  </Heading>
                  <Text
                    color="text.secondary"
                    fontSize={{ base: 'md', md: 'lg' }}
                    maxW="2xl"
                    mx="auto"
                    lineHeight="1.6"
                  >
                    Thank you for applying to join our team of professional
                    drivers. We're excited to have you on board!
                  </Text>
                  <Badge
                    colorScheme="green"
                    variant="solid"
                    size="lg"
                    px={6}
                    py={3}
                    borderRadius="full"
                    fontSize="md"
                    fontWeight="bold"
                    boxShadow="0 4px 15px rgba(0,209,143,0.3)"
                  >
                    Application Received
                  </Badge>
                </VStack>
              </VStack>
            </Box>

            {/* Application Status */}
            <Card
              bg={cardBg}
              borderWidth="2px"
              borderColor="border.primary"
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(135deg, rgba(0,194,255,0.05), rgba(0,209,143,0.05))',
                pointerEvents: 'none',
              }}
            >
              <CardBody p={{ base: 6, md: 8 }} position="relative" zIndex={1}>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={3} mb={4}>
                    <Icon as={FiClock} color="neon.500" boxSize={6} />
                    <Heading size="lg" color="neon.500">
                      What happens next?
                    </Heading>
                  </HStack>

                  <List spacing={4}>
                    <ListItem>
                      <HStack align="start" spacing={4}>
                        <Box
                          p={3}
                          borderRadius="lg"
                          bg="blue.500"
                          color="white"
                          boxSize="50px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                        >
                          <Icon as={FiMail} boxSize={5} />
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontWeight="bold"
                            color="text.primary"
                            fontSize="lg"
                          >
                            Email Confirmation
                          </Text>
                          <Text
                            fontSize="md"
                            color="text.secondary"
                            lineHeight="1.6"
                          >
                            You will receive a confirmation email within the
                            next few minutes with your application details
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>

                    <ListItem>
                      <HStack align="start" spacing={4}>
                        <Box
                          p={3}
                          borderRadius="lg"
                          bg="purple.500"
                          color="white"
                          boxSize="50px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 15px rgba(128,90,213,0.3)"
                        >
                          <Icon as={FiFileText} boxSize={5} />
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontWeight="bold"
                            color="text.primary"
                            fontSize="lg"
                          >
                            Document Review
                          </Text>
                          <Text
                            fontSize="md"
                            color="text.secondary"
                            lineHeight="1.6"
                          >
                            Our team will review your documents and verify all
                            information within 24-48 hours
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>

                    <ListItem>
                      <HStack align="start" spacing={4}>
                        <Box
                          p={3}
                          borderRadius="lg"
                          bg="orange.500"
                          color="white"
                          boxSize="50px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 15px rgba(255,159,64,0.3)"
                        >
                          <Icon as={FiShield} boxSize={5} />
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontWeight="bold"
                            color="text.primary"
                            fontSize="lg"
                          >
                            Background Check
                          </Text>
                          <Text
                            fontSize="md"
                            color="text.secondary"
                            lineHeight="1.6"
                          >
                            We will conduct necessary background and driving
                            record checks to ensure safety
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>

                    <ListItem>
                      <HStack align="start" spacing={4}>
                        <Box
                          p={3}
                          borderRadius="lg"
                          bg="green.500"
                          color="white"
                          boxSize="50px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 4px 15px rgba(0,209,143,0.3)"
                        >
                          <Icon as={FiClock} boxSize={5} />
                        </Box>
                        <Box flex={1}>
                          <Text
                            fontWeight="bold"
                            color="text.primary"
                            fontSize="lg"
                          >
                            Processing Time
                          </Text>
                          <Text
                            fontSize="md"
                            color="text.secondary"
                            lineHeight="1.6"
                          >
                            You will hear back from us within 3-5 business days
                            with your application status
                          </Text>
                        </Box>
                      </HStack>
                    </ListItem>
                  </List>
                </VStack>
              </CardBody>
            </Card>

            {/* Important Information */}
            <Alert
              status="info"
              borderRadius="xl"
              borderWidth="2px"
              borderColor="blue.400"
              bg="blue.50"
              _dark={{ bg: 'blue.900' }}
              p={6}
            >
              <AlertIcon boxSize={6} color="blue.500" />
              <Box>
                <Text fontWeight="bold" color="text.primary" fontSize="lg">
                  Important Information
                </Text>
                <Text
                  fontSize="md"
                  color="text.secondary"
                  lineHeight="1.6"
                  mt={2}
                >
                  Your account will remain inactive until your application is
                  approved by our admin team. You will receive an email
                  notification once your application has been reviewed and a
                  decision has been made.
                </Text>
              </Box>
            </Alert>

            {/* Contact Information */}
            <Card
              bg={cardBg}
              borderWidth="2px"
              borderColor="border.primary"
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(135deg, rgba(0,194,255,0.05), rgba(0,209,143,0.05))',
                pointerEvents: 'none',
              }}
            >
              <CardBody p={{ base: 6, md: 8 }} position="relative" zIndex={1}>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={3} mb={4}>
                    <Icon as={FiTruck} color="neon.500" boxSize={6} />
                    <Heading size="lg" color="neon.500">
                      Need Help?
                    </Heading>
                  </HStack>

                  <Text fontSize="md" color="text.secondary" lineHeight="1.6">
                    If you have any questions about your application or need to
                    provide additional information, please don't hesitate to
                    contact our support team:
                  </Text>

                  <VStack spacing={4} align="stretch">
                    <HStack
                      p={4}
                      borderRadius="lg"
                      bg="blue.50"
                      _dark={{ bg: 'blue.900' }}
                      borderWidth="1px"
                      borderColor="blue.200"
                    >
                      <Icon as={FiMail} color="blue.500" boxSize={5} />
                      <Box>
                        <Text fontWeight="bold" color="text.primary">
                          Email Support
                        </Text>
                        <Text fontSize="md" color="text.secondary">
                          support@speedy-van.co.uk
                        </Text>
                      </Box>
                    </HStack>

                    <HStack
                      p={4}
                      borderRadius="lg"
                      bg="green.50"
                      _dark={{ bg: 'green.900' }}
                      borderWidth="1px"
                      borderColor="green.200"
                    >
                      <Icon as={FiPhone} color="green.500" boxSize={5} />
                      <Box>
                        <Text fontWeight="bold" color="text.primary">
                          Phone Support
                        </Text>
                        <Text fontSize="md" color="text.secondary">
                          +44 (0) 20 1234 5678
                        </Text>
                      </Box>
                    </HStack>

                    <Box
                      p={4}
                      borderRadius="lg"
                      bg="purple.50"
                      _dark={{ bg: 'purple.900' }}
                      borderWidth="1px"
                      borderColor="purple.200"
                    >
                      <Text fontWeight="bold" color="text.primary" mb={2}>
                        Support Hours
                      </Text>
                      <Text fontSize="md" color="text.secondary">
                        Monday - Friday, 9:00 AM - 6:00 PM GMT
                      </Text>
                    </Box>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Action Buttons */}
            <VStack spacing={4}>
              <Button
                variant="solid"
                size="lg"
                onClick={() => router.push('/')}
                w="full"
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                color="white"
                _hover={{
                  bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                }}
                _active={{
                  bg: 'linear-gradient(135deg, #00B8E6, #00C2FF)',
                }}
                transition="all 0.3s ease"
                borderRadius="xl"
                py={7}
                fontWeight="bold"
                rightIcon={<Icon as={FiHome} />}
              >
                Return to Homepage
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/auth/login')}
                w="full"
                borderColor="neon.400"
                color="neon.400"
                _hover={{
                  bg: 'rgba(0,194,255,0.1)',
                  borderColor: 'neon.500',
                  color: 'neon.500',
                  transform: 'translateY(-1px)',
                }}
                transition="all 0.2s"
                borderRadius="xl"
                py={7}
                fontWeight="semibold"
                rightIcon={<Icon as={FiLogIn} />}
              >
                Go to Login Page
              </Button>
            </VStack>

            {/* Additional Information */}
            <Box
              textAlign="center"
              py={6}
              p={6}
              borderRadius="xl"
              bg="bg.surface"
              borderWidth="1px"
              borderColor="border.primary"
            >
              <VStack spacing={3}>
                <Text fontSize="md" color="text.secondary" fontWeight="medium">
                  Application Reference:{' '}
                  <Badge colorScheme="neon" variant="outline" fontSize="md">
                    {Date.now().toString().slice(-8)}
                  </Badge>
                </Text>
                <Text fontSize="sm" color="text.tertiary">
                  Please keep this reference number for your records and future
                  communications
                </Text>
              </VStack>
            </Box>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
}
