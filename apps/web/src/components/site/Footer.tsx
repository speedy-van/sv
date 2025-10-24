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
  useBreakpointValue,
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
  FiCalendar,
  FiShield,
  FiPackage,
  FiHome,
} from 'react-icons/fi';

// Collapsible Footer Section Component for Mobile
interface FooterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FooterSection: React.FC<FooterSectionProps> = ({ title, children, defaultOpen = false }) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: defaultOpen });
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (!isMobile) {
    return (
      <Box>
        <Heading size="sm" mb={6} color="white" fontWeight="bold" letterSpacing="wide">
          {title}
        </Heading>
        {children}
      </Box>
    );
  }

  return (
    <Box borderBottom="1px solid" borderColor="whiteAlpha.200" py={4}>
      <Button
        onClick={onToggle}
        w="full"
        justifyContent="space-between"
        variant="ghost"
        color="white"
        fontWeight="bold"
        fontSize="md"
        _hover={{ bg: 'whiteAlpha.100' }}
        _active={{ bg: 'whiteAlpha.200' }}
        rightIcon={<Icon as={isOpen ? FiChevronUp : FiChevronDown} />}
      >
        {title}
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <Box pt={4} pb={2}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const toast = useToast();

  // Mount effect to prevent hydration mismatch
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const footerLinks = {
    services: [
      { label: 'House Moving', href: '/services/house-moving', icon: FiHome },
      { label: 'Office Relocation', href: '/services/office', icon: FiUsers },
      { label: 'Furniture Delivery', href: '/services/furniture', icon: FiPackage },
      { label: 'Student Moving', href: '/services/student', icon: FiAward },
    ],
    company: [
      { label: 'About Us', href: '/about', icon: FiUsers },
      { label: 'Our Services', href: '/services', icon: FiTruck },
      { label: 'Pricing', href: '/pricing', icon: FiCalendar },
      { label: 'Contact', href: '/contact', icon: FiMail },
    ],
    support: [
      { label: 'Track Your Move', href: '/track', icon: FiMapPin },
      { label: 'How It Works', href: '/how-it-works', icon: FiShield },
      { label: 'Moving Checklist', href: '/checklist', icon: FiCalendar },
      { label: 'Moving Tips', href: '/moving-tips', icon: FiHeart },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/legal/cookies' },
      { label: 'Cancellation Policy', href: '/cancellation' },
    ],
  };

  const socialLinks = [
    { icon: FiFacebook, href: 'https://facebook.com/speedyvan', label: 'Facebook', color: '#1877F2' },
    { icon: FiTwitter, href: 'https://twitter.com/speedyvan', label: 'Twitter', color: '#1DA1F2' },
    { icon: FiInstagram, href: 'https://instagram.com/speedyvan', label: 'Instagram', color: '#E4405F' },
    { icon: FiLinkedin, href: 'https://linkedin.com/company/speedyvan', label: 'LinkedIn', color: '#0077B5' },
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
      as="footer"
      bg="gray.900"
      color="white"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 } as any}
    >
      {/* CTA Section with Gradient */}
      <Box
        bg="linear-gradient(135deg, #00C2FF 0%, #00D18F 100%)"
        py={{ base: 12, md: 16 }}
        position="relative"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          opacity={0.1}
          bgImage="radial-gradient(circle at 20% 50%, white 1px, transparent 1px)"
          bgSize="40px 40px"
        />
        <Container maxW="container.xl" position="relative" zIndex={1}>
          <VStack spacing={8} textAlign="center">
            <VStack spacing={4}>
              <Heading
                size={{ base: 'xl', md: '2xl' }}
                color="white"
                fontWeight="bold"
                maxW="800px"
              >
                Ready to Move? Get Your Free Quote Today!
              </Heading>
              <Text fontSize={{ base: 'lg', md: 'xl' }} color="whiteAlpha.900" maxW="600px">
                Professional, reliable, and affordable moving services across the UK.
                Book in minutes and enjoy stress-free moving!
              </Text>
            </VStack>

            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button
                as={Link}
                href="/booking-luxury"
                size="lg"
                bg="white"
                color="gray.900"
                px={8}
                py={6}
                fontSize="lg"
                fontWeight="bold"
                borderRadius="xl"
                leftIcon={<Icon as={FiTruck} boxSize={5} />}
                _hover={{
                  bg: 'whiteAlpha.900',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                }}
                transition="all 0.3s ease"
                boxShadow="0 10px 30px rgba(0,0,0,0.15)"
              >
                Book Now
              </Button>

              <Button
                as={Link}
                href="/contact"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                px={8}
                py={6}
                fontSize="lg"
                fontWeight="bold"
                borderRadius="xl"
                borderWidth="2px"
                leftIcon={<Icon as={FiPhone} boxSize={5} />}
                _hover={{
                  bg: 'whiteAlpha.200',
                  transform: 'translateY(-2px)',
                }}
                transition="all 0.3s ease"
              >
                Call Us Now
              </Button>
            </HStack>

            <HStack spacing={6} fontSize="sm" color="whiteAlpha.900">
              <HStack spacing={2}>
                <Icon as={FiShield} />
                <Text>Fully Insured</Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiAward} />
                <Text>50K+ Happy Customers</Text>
              </HStack>
              <HStack spacing={2} display={{ base: 'none', md: 'flex' }}>
                <Icon as={FiHeart} />
                <Text>5-Star Rated</Text>
              </HStack>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Main Footer Content - Dark Background */}
      <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
        {/* Desktop: Grid Layout | Mobile: Accordion */}
        <Box display={{ base: 'none', md: 'block' }} mb={12}>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={10}>
            {/* Services Column */}
            <Box>
              <Heading size="sm" mb={6} color="white" fontWeight="bold" letterSpacing="wide">
                OUR SERVICES
              </Heading>
              <VStack align="start" spacing={3}>
                {footerLinks.services.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    fontSize="md"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={4} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Company Column */}
            <Box>
              <Heading size="sm" mb={6} color="white" fontWeight="bold" letterSpacing="wide">
                COMPANY
              </Heading>
              <VStack align="start" spacing={3}>
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    fontSize="md"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={4} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Support Column */}
            <Box>
              <Heading size="sm" mb={6} color="white" fontWeight="bold" letterSpacing="wide">
                SUPPORT
              </Heading>
              <VStack align="start" spacing={3}>
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={3}
                    fontSize="md"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={4} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Contact Info Column */}
            <Box>
              <Heading size="sm" mb={6} color="white" fontWeight="bold" letterSpacing="wide">
                CONTACT US
              </Heading>
              <VStack align="start" spacing={4}>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiPhone} boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Phone
                    </Text>
                  </HStack>
                  <Link
                    href="tel:+447901846297"
                    fontSize="md"
                    color="white"
                    fontWeight="medium"
                    _hover={{ color: '#00D18F' }}
                  >
                    07901846297
                  </Link>
                </VStack>

                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiMail} boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Email
                    </Text>
                  </HStack>
                  <Link
                    href="mailto:support@speedy-van.co.uk"
                    fontSize="md"
                    color="white"
                    fontWeight="medium"
                    _hover={{ color: '#00D18F' }}
                  >
                    support@speedy-van.co.uk
                  </Link>
                </VStack>

                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiMapPin} boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Address
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="whiteAlpha.800" lineHeight="tall">
                    140 Charles Street,<br />
                    Glasgow City, G21 2QB
                  </Text>
                </VStack>
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Mobile: Accordion Layout */}
        <Box display={{ base: 'block', md: 'none' }} mb={8}>
          <FooterSection title="OUR SERVICES" defaultOpen>
            <VStack align="start" spacing={3}>
              {footerLinks.services.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  fontSize="md"
                  color="whiteAlpha.800"
                  _hover={{ color: '#00D18F' }}
                >
                  <Icon as={link.icon} boxSize={4} color="#00D18F" />
                  {link.label}
                </Link>
              ))}
            </VStack>
          </FooterSection>

          <FooterSection title="COMPANY">
            <VStack align="start" spacing={3}>
              {footerLinks.company.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  fontSize="md"
                  color="whiteAlpha.800"
                  _hover={{ color: '#00D18F' }}
                >
                  <Icon as={link.icon} boxSize={4} color="#00D18F" />
                  {link.label}
                </Link>
              ))}
            </VStack>
          </FooterSection>

          <FooterSection title="SUPPORT">
            <VStack align="start" spacing={3}>
              {footerLinks.support.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  display="flex"
                  alignItems="center"
                  gap={3}
                  fontSize="md"
                  color="whiteAlpha.800"
                  _hover={{ color: '#00D18F' }}
                >
                  <Icon as={link.icon} boxSize={4} color="#00D18F" />
                  {link.label}
                </Link>
              ))}
            </VStack>
          </FooterSection>

          <FooterSection title="CONTACT US">
            <VStack align="start" spacing={4}>
              <VStack align="start" spacing={1}>
                <HStack spacing={2} color="#00D18F">
                  <Icon as={FiPhone} boxSize={4} />
                  <Text fontSize="xs" fontWeight="bold">PHONE</Text>
                </HStack>
                <Link href="tel:+447901846297" color="white" fontSize="md">
                  07901846297
                </Link>
              </VStack>
              <VStack align="start" spacing={1}>
                <HStack spacing={2} color="#00D18F">
                  <Icon as={FiMail} boxSize={4} />
                  <Text fontSize="xs" fontWeight="bold">EMAIL</Text>
                </HStack>
                <Link href="mailto:support@speedy-van.co.uk" color="white" fontSize="md">
                  support@speedy-van.co.uk
                </Link>
              </VStack>
            </VStack>
          </FooterSection>
        </Box>

        <Divider borderColor="whiteAlpha.200" my={8} />

        {/* Bottom Section */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          gap={6}
        >
          {/* Left Side: Legal Links & Copyright */}
          <VStack align={{ base: 'center', md: 'start' }} spacing={3} flex={1}>
            <HStack spacing={4} flexWrap="wrap" justify={{ base: 'center', md: 'start' }}>
              {footerLinks.legal.map((link, index) => (
                <React.Fragment key={link.label}>
                  <Link
                    href={link.href}
                    fontSize="sm"
                    color="whiteAlpha.700"
                    _hover={{ color: '#00D18F' }}
                  >
                    {link.label}
                  </Link>
                  {index < footerLinks.legal.length - 1 && (
                    <Text color="whiteAlpha.400">·</Text>
                  )}
                </React.Fragment>
              ))}
            </HStack>

            <VStack spacing={1} align={{ base: 'center', md: 'start' }}>
              <Text fontSize="sm" color="whiteAlpha.700">
                © {new Date().getFullYear()} Speedy Van. All rights reserved.
              </Text>
              <Text fontSize="xs" color="whiteAlpha.600">
                SPEEDY VAN REMOVALS LTD · Company No. SC865658
              </Text>
              <HStack spacing={1} fontSize="xs" color="whiteAlpha.600">
                <Text>Made with</Text>
                <Icon as={FiHeart} color="#E4405F" />
                <Text>in the UK</Text>
              </HStack>
            </VStack>
          </VStack>

          {/* Right Side: Social Media Icons */}
          <VStack spacing={3}>
            <Text fontSize="sm" color="white" fontWeight="bold">
              FOLLOW US
            </Text>
            <HStack spacing={3}>
              {socialLinks.map((social) => (
                <Tooltip key={social.label} label={social.label} placement="top">
                  <IconButton
                    as={Link}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    icon={<Icon as={social.icon} boxSize={6} />}
                    size="lg"
                    variant="ghost"
                    color="white"
                    bg="whiteAlpha.100"
                    _hover={{
                      bg: social.color,
                      transform: 'translateY(-4px) scale(1.1)',
                      boxShadow: `0 8px 20px ${social.color}40`,
                    }}
                    transition="all 0.3s ease"
                    borderRadius="lg"
                  />
                </Tooltip>
              ))}
            </HStack>
          </VStack>
        </Flex>
      </Container>
    </MotionBox>
  );
};

export default Footer;
