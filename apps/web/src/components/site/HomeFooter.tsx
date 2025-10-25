'use client';

import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Link,
  SimpleGrid,
  Flex,
  Divider,
  Icon,
  Tooltip,
  IconButton,
  Heading,
} from '@chakra-ui/react';
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiHeart,
  FiShield,
  FiAward,
  FiUsers,
  FiTruck,
  FiCalendar,
  FiPackage,
  FiHome,
  FiClock,
} from 'react-icons/fi';

const HomeFooter: React.FC = () => {
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

  const trustIndicators = [
    { icon: FiShield, text: 'Fully Insured', color: '#00D18F' },
    { icon: FiAward, text: '50K+ Customers', color: '#00C2FF' },
    { icon: FiHeart, text: '5-Star Rated', color: '#FFD700' },
    { icon: FiClock, text: '24/7 Support', color: '#9F7AEA' },
  ];

  return (
    <Box
      as="footer"
      bg="gray.900"
      color="white"
      width="100%"
      mt={16}
    >
      {/* Trust Indicators Section */}
      <Box
        borderTop="1px solid"
        borderColor="whiteAlpha.200"
        py={{ base: 12, md: 16 }}
      >
        <Container maxW="container.xl">
          <Flex
            gap={{ base: 4, md: 8 }}
            justify="center"
            wrap="wrap"
          >
            {trustIndicators.map((item, index) => (
              <HStack
                key={index}
                spacing={2}
                px={4}
                py={2}
                borderRadius="xl"
                bg="whiteAlpha.100"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                _hover={{
                  bg: 'whiteAlpha.200',
                  transform: 'translateY(-2px)',
                  borderColor: item.color,
                }}
                transition="all 0.3s ease"
              >
                <Icon as={item.icon} boxSize={5} color={item.color} />
                <Text
                  fontSize={{ base: 'sm', md: 'md' }}
                  color="white"
                  fontWeight="semibold"
                >
                  {item.text}
                </Text>
              </HStack>
            ))}
          </Flex>
        </Container>
      </Box>

      {/* Main Footer Content */}
      <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 4 }} 
          spacing={10}
          mb={12}
        >
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
                  href="tel:+441202129746"
                  fontSize="md"
                  color="white"
                  fontWeight="medium"
                  _hover={{ color: '#00D18F' }}
                >
                  01202129746
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
                  Office 2.18, 1 Barrack street,<br />
                  Hamilton ML3 0DG
                </Text>
              </VStack>
            </VStack>
          </Box>
        </SimpleGrid>

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
    </Box>
  );
};

export default HomeFooter;

