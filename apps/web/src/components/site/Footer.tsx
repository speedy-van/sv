'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Link,
  SimpleGrid,
  Flex,
  useColorModeValue,
  Divider,
  Icon,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  Badge,
  useToast,
  Tooltip,
  IconButton,
  Collapse,
  useDisclosure,
  Heading,
} from '@chakra-ui/react';
import { m, isValidMotionProp } from 'framer-motion';
import { chakra, shouldForwardProp } from '@chakra-ui/react';
import {
  FiTruck,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiSend,
  FiChevronDown,
  FiChevronUp,
  FiHeart,
  FiAward,
  FiUsers,
} from 'react-icons/fi';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { isOpen: isExpanded, onToggle } = useDisclosure();
  const toast = useToast();

  // Mount effect to prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const cardBg = useColorModeValue('gray.50', 'gray.800');

  const footerLinks = {
    services: [
      { label: 'House Moving', href: '/services/house-moving', icon: FiTruck },
      { label: 'Office Relocation', href: '/services/office', icon: FiUsers },
      { label: 'Furniture Delivery', href: '/services/furniture', icon: FiTruck },
      { label: 'Student Moving', href: '/services/student', icon: FiAward },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Our Services', href: '/services' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Contact', href: '/contact' },
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Track Your Move', href: '/track' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Insurance Info', href: '/insurance' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' },
    ],
  };

  const socialLinks = [
    { icon: FiFacebook, href: 'https://facebook.com/speedyvan', label: 'Facebook', color: 'blue.600' },
    { icon: FiTwitter, href: 'https://twitter.com/speedyvan', label: 'Twitter', color: 'blue.400' },
    { icon: FiInstagram, href: 'https://instagram.com/speedyvan', label: 'Instagram', color: 'pink.500' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/speedyvan', label: 'LinkedIn', color: 'blue.700' },
  ];


  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      // Simulate newsletter subscription
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Subscribed!',
        description: 'Thank you for subscribing to our newsletter.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setEmail('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to subscribe. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Proper Chakra UI motion integration with proper prop filtering
  const MotionBox = chakra(m.footer, {
    shouldForwardProp: (prop) => {
      // Allow motion-specific props to pass through to Framer Motion
      const motionProps = ['whileInView', 'initial', 'animate', 'exit', 'transition', 'viewport', 'drag', 'whileHover', 'whileTap', 'whileDrag', 'whileFocus'];
      if (motionProps.includes(prop as string)) {
        return true;
      }
      // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
      return shouldForwardProp(prop);
    },
  });

  const MotionCard = chakra(m.div, {
    shouldForwardProp: (prop) => {
      // Allow motion-specific props to pass through to Framer Motion
      const motionProps = ['whileInView', 'initial', 'animate', 'exit', 'transition', 'viewport', 'drag', 'whileHover', 'whileTap', 'whileDrag', 'whileFocus'];
      if (motionProps.includes(prop as string)) {
        return true;
      }
      // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
      return shouldForwardProp(prop);
    },
  });

  return (
    <MotionBox
      bg={bgColor}
      borderTop={`1px solid ${borderColor}`}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 } as any}
    >
      <Container maxW="container.xl" py={16}>
        <Box>
          {/* Newsletter Section */}
          <MotionCard
            bg="linear-gradient(135deg, neon.400, green.400)"
            borderRadius="2xl"
            p={8}
            color="white"
            textAlign="center"
            mb={12}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 } as any}
          >
            <VStack spacing={6}>
              <VStack spacing={2}>
                <Icon as={FiHeart} boxSize={8} color="white" />
                <Heading size="lg">Stay Updated with Speedy Van</Heading>
                <Text fontSize="lg" opacity={0.9}>
                  Get the latest news, tips, and exclusive offers delivered to your inbox.
                </Text>
              </VStack>

              <Box as="form" onSubmit={handleNewsletterSubmit} w="full" maxW="md">
                <InputGroup size="lg">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="white"
                    color="gray.800"
                    border="none"
                    borderRadius="xl"
                    _placeholder={{ color: 'gray.500' }}
                    _focus={{ boxShadow: '0 0 0 3px rgba(255,255,255,0.3)' }}
                  />
                  <InputRightElement width="auto" pr={2}>
                    <Button
                      type="submit"
                      colorScheme="blue"
                      size="sm"
                      borderRadius="lg"
                      isLoading={isSubmitting}
                      loadingText="Subscribing..."
                      leftIcon={<FiSend />}
                    >
                      Subscribe
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </Box>

              <Text fontSize="sm" opacity={0.8}>
                No spam, unsubscribe at any time. We respect your privacy.
              </Text>
            </VStack>
          </MotionCard>

          {/* Main Footer Content */}
          <SimpleGrid 
            columns={{ base: 1, sm: 2, md: 3, lg: 5 }} 
            spacing={8}
            w="full"
            mb={12}
            className="footer-main-grid"
          >
            {/* Company Info */}
            <Box minW={0}>
              <HStack spacing={4} mb={6}>
                <Box
                  w="60px"
                  h="60px"
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  borderRadius="xl"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  color="white"
                  fontSize="2xl"
                  fontWeight="bold"
                  boxShadow="0 8px 25px rgba(0,194,255,0.3)"
                >
                  SV
                </Box>
                <VStack align="start" spacing={1}>
                  <Text fontSize="xl" fontWeight="bold" color="text.primary">
                    Speedy Van
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Professional Moving Services
                  </Text>
                  <Badge colorScheme="green" variant="subtle" borderRadius="full">
                    Trusted Nationwide
                  </Badge>
                </VStack>
              </HStack>
              
              <Text fontSize="sm" color={textColor} lineHeight="tall" mb={6}>
                Your trusted partner for professional moving services across the UK. 
                Fast, reliable, and fully insured with over 50,000 happy customers.
              </Text>

              {/* Enhanced Contact Info */}
              <VStack align="start" spacing={3}>
                <HStack spacing={3} p={3} bg={cardBg} borderRadius="xl" w="full">
                  <Box
                    w="40px"
                    h="40px"
                    bg="blue.100"
                    color="blue.600"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiPhone size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="text.secondary">Phone</Text>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary">
                      +44 7901846297
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} p={3} bg={cardBg} borderRadius="xl" w="full">
                  <Box
                    w="40px"
                    h="40px"
                    bg="green.100"
                    color="green.600"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiMail size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="text.secondary">Email</Text>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary">
                      support@speedy-van.co.uk
                    </Text>
                  </VStack>
                </HStack>

                <HStack spacing={3} p={3} bg={cardBg} borderRadius="xl" w="full">
                  <Box
                    w="40px"
                    h="40px"
                    bg="purple.100"
                    color="purple.600"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <FiMapPin size={20} />
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="xs" color="text.secondary">Address</Text>
                    <Text fontSize="sm" fontWeight="medium" color="text.primary">
                      Office 2.18, 1 Barrack Street, Hamilton
                    </Text>
                  </VStack>
                </HStack>
              </VStack>
            </Box>

            {/* Services */}
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="lg" color="text.primary" mb={6}>
                Our Services
              </Text>
              <VStack align="start" spacing={3}>
                {footerLinks.services.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    p={2}
                    borderRadius="lg"
                    _hover={{
                      bg: cardBg,
                      color: 'neon.500',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <HStack spacing={3}>
                      <Icon as={link.icon} boxSize={4} color="neon.500" />
                      <Text fontSize="sm" fontWeight="medium">
                        {link.label}
                      </Text>
                    </HStack>
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Company */}
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="lg" color="text.primary" mb={6}>
                Company
              </Text>
              <VStack align="start" spacing={3}>
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    fontSize="sm"
                    color={textColor}
                    p={2}
                    borderRadius="lg"
                    _hover={{
                      color: 'neon.500',
                      textDecoration: 'none',
                      bg: cardBg,
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Support */}
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="lg" color="text.primary" mb={6}>
                Support
              </Text>
              <VStack align="start" spacing={3}>
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    fontSize="sm"
                    color={textColor}
                    p={2}
                    borderRadius="lg"
                    _hover={{
                      color: 'neon.500',
                      textDecoration: 'none',
                      bg: cardBg,
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Legal */}
            <Box minW={0}>
              <Text fontWeight="bold" fontSize="lg" color="text.primary" mb={6}>
                Legal
              </Text>
              <VStack align="start" spacing={3}>
                {footerLinks.legal.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    fontSize="sm"
                    color={textColor}
                    p={2}
                    borderRadius="lg"
                    _hover={{
                      color: 'neon.500',
                      textDecoration: 'none',
                      bg: cardBg,
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>

          <Divider borderColor={borderColor} mb={12} />

          {/* Bottom Footer */}
          <Flex
            justify="space-between"
            align={isMounted ? "center" : undefined}
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 6, md: 0 }}
            className="footer-bottom"
          >
            <VStack align={isMounted ? { base: 'center', md: 'start' } : undefined} spacing={2}>
              <Text fontSize="sm" color={textColor}>
                © {new Date().getFullYear()} Speedy Van. All rights reserved.
              </Text>
              <Text fontSize="xs" color={textColor} opacity={0.8}>
                SPEEDY VAN REMOVALS LTD · Company No. SC865658 · Registered in Scotland
              </Text>
              <Text fontSize="xs" color={textColor} opacity={0.8}>
                Made with ❤️ for reliable moving services across the UK
              </Text>
            </VStack>

            {/* Enhanced Social Links */}
            <VStack spacing={4}>
              <Text fontSize="sm" fontWeight="medium" color="text.primary">
                Follow Us
              </Text>
              <HStack spacing={4}>
                {socialLinks.map((social, index) => (
                  <Tooltip key={social.label} label={social.label} placement="top">
                    <IconButton
                      as={Link}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.label}
                      icon={<Icon as={social.icon} boxSize={5} />}
                      size="lg"
                      variant="ghost"
                      color={textColor}
                      _hover={{
                        color: social.color,
                        transform: 'translateY(-2px)',
                        bg: cardBg,
                      }}
                      transition="all 0.2s ease"
                      borderRadius="xl"
                    />
                  </Tooltip>
                ))}
              </HStack>
            </VStack>
          </Flex>
        </Box>
      </Container>
    </MotionBox>
  );
};

export default Footer;
