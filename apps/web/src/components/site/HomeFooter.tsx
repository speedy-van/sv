'use client';

import React from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Link,
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
      { label: 'Man and Van', href: '/man-and-van', icon: FiTruck },
      { label: 'House Removals', href: '/house-removals', icon: FiHome },
      { label: 'Same Day Delivery', href: '/same-day-delivery', icon: FiClock },
      { label: 'Single Item Delivery', href: '/single-item-delivery', icon: FiPackage },
      { label: 'Office Removals', href: '/office-removals', icon: FiUsers },
      { label: 'Student Moves', href: '/student-moves', icon: FiAward },
    ],
    marketplace: [
      { label: 'Facebook Marketplace', href: '/facebook-marketplace-delivery', icon: FiTruck },
      { label: 'Gumtree Pickup', href: '/gumtree-pickup-delivery', icon: FiTruck },
      { label: 'Sofa Delivery', href: '/sofa-delivery-service', icon: FiPackage },
      { label: 'Furniture Collection', href: '/furniture-collection-delivery', icon: FiPackage },
      { label: 'Assembly Service', href: '/assembly-service', icon: FiTruck },
      { label: 'Storage Services', href: '/storage-services', icon: FiPackage },
    ],
    company: [
      { label: 'About Us', href: '/about', icon: FiUsers },
      { label: 'All Services', href: '/services', icon: FiTruck },
      { label: 'Pricing', href: '/pricing', icon: FiCalendar },
      { label: 'Careers', href: '/careers', icon: FiUsers },
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

  return (
    <Box
      as="footer"
      bg="linear-gradient(135deg, #001F3F, #002D6B)"
      color="white"
      width="100%"
      mt={8}
      position="relative"
      overflow="hidden"
      sx={{
        '& *': {
          boxSizing: 'border-box',
        },
      }}
    >
      {/* Main Footer Content */}
      <Box 
        py={{ base: 6, md: 8 }} 
        w="100%"
        className="home-footer-main"
        bg="transparent"
      >
        <Container maxW="1400px" px={{ base: 4, md: 8 }}>
          <Box
            display="flex !important"
            flexDirection={{ base: 'column', lg: 'row' }}
            gap={{ base: 6, lg: 10 }}
            justifyContent="space-between"
            mb={6}
            w="100%"
            className="home-footer-grid"
            sx={{
              display: 'flex !important',
              '@media (min-width: 62em)': {
                flexDirection: 'row !important',
                display: 'flex !important',
              },
              '@media (min-width: 992px)': {
                flexDirection: 'row !important',
                display: 'flex !important',
              },
              '@media (min-width: 1024px)': {
                flexDirection: 'row !important',
                display: 'flex !important',
              },
              '& > div': {
                flex: { base: 'none', lg: '1 1 0%' },
                minWidth: { lg: '200px' },
              },
            }}
            style={{
              display: 'flex',
            }}
          >
            {/* Services Column */}
            <Box flex="1" minW={{ lg: '200px' }}>
              <Heading size="sm" mb={3} color="white" fontWeight="bold" letterSpacing="wide">
                OUR SERVICES
              </Heading>
              <VStack align="start" spacing={2}>
                {footerLinks.services.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontSize="sm"
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

            {/* Marketplace Column */}
            <Box flex="1" minW={{ lg: '200px' }}>
              <Heading size="sm" mb={3} color="white" fontWeight="bold" letterSpacing="wide">
                MARKETPLACE
              </Heading>
              <VStack align="start" spacing={2}>
                {footerLinks.marketplace.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontSize="sm"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={3.5} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Company Column */}
            <Box flex="1" minW={{ lg: '200px' }}>
              <Heading size="sm" mb={3} color="white" fontWeight="bold" letterSpacing="wide">
                COMPANY
              </Heading>
              <VStack align="start" spacing={2}>
                {footerLinks.company.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontSize="sm"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={3.5} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Support Column */}
            <Box flex="1" minW={{ lg: '200px' }}>
              <Heading size="sm" mb={3} color="white" fontWeight="bold" letterSpacing="wide">
                SUPPORT
              </Heading>
              <VStack align="start" spacing={2}>
                {footerLinks.support.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontSize="sm"
                    color="whiteAlpha.800"
                    _hover={{
                      color: '#00D18F',
                      textDecoration: 'none',
                      transform: 'translateX(4px)',
                    }}
                    transition="all 0.2s ease"
                  >
                    <Icon as={link.icon} boxSize={3.5} color="#00D18F" />
                    {link.label}
                  </Link>
                ))}
              </VStack>
            </Box>

            {/* Contact Info Column */}
            <Box flex="1" minW={{ lg: '220px' }}>
              <Heading size="sm" mb={3} color="white" fontWeight="bold" letterSpacing="wide">
                CONTACT US
              </Heading>
              <VStack align="start" spacing={2.5}>
                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiPhone} boxSize={4} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Phone
                    </Text>
                  </HStack>
                  <Link
                    href="tel:+441202129746"
                    fontSize="sm"
                    color="white"
                    fontWeight="medium"
                    _hover={{ color: '#00D18F' }}
                  >
                    01202 129746
                  </Link>
                  <Text fontSize="xs" color="whiteAlpha.700">
                    9AM - 6PM, 7 Days a Week
                  </Text>
                </VStack>

                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiMail} boxSize={3.5} />
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase">
                      Email
                    </Text>
                  </HStack>
                  <Link
                    href="mailto:support@speedy-van.co.uk"
                    fontSize="sm"
                    color="white"
                    fontWeight="medium"
                    _hover={{ color: '#00D18F' }}
                  >
                    support@speedy-van.co.uk
                  </Link>
                </VStack>

                <VStack align="start" spacing={1}>
                  <HStack spacing={2} color="#00D18F">
                    <Icon as={FiMapPin} boxSize={3.5} />
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
          </Box>

          <Divider borderColor="whiteAlpha.200" my={4} />

          {/* Bottom Section */}
          <Box
            display="flex !important"
            flexDirection={{ base: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="center"
            gap={4}
            className="home-footer-bottom"
            sx={{
              display: 'flex !important',
              '@media (min-width: 48em)': {
                flexDirection: 'row !important',
                display: 'flex !important',
              },
              '@media (min-width: 768px)': {
                flexDirection: 'row !important',
                display: 'flex !important',
              },
            }}
            style={{
              display: 'flex',
            }}
          >
          {/* Left Side: Legal Links & Copyright */}
          <VStack align={{ base: 'center', md: 'start' }} spacing={2} flex={1}>
            <HStack spacing={3} flexWrap="wrap" justify={{ base: 'center', md: 'start' }}>
              {footerLinks.legal.map((link, index) => (
                <React.Fragment key={link.label}>
                  <Link
                    href={link.href}
                    fontSize="xs"
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

            <VStack spacing={0.5} align={{ base: 'center', md: 'start' }}>
              <Text fontSize="xs" color="whiteAlpha.700">
                © {new Date().getFullYear()} Speedy Van. All rights reserved.
              </Text>
              <Text fontSize="2xs" color="whiteAlpha.600">
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
          <VStack spacing={2}>
            <Text fontSize="xs" color="white" fontWeight="bold">
              FOLLOW US
            </Text>
            <HStack spacing={2}>
              {socialLinks.map((social) => (
                <Tooltip key={social.label} label={social.label} placement="top">
                  <IconButton
                    as={Link}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    icon={<Icon as={social.icon} boxSize={5} />}
                    size="md"
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
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default HomeFooter;

