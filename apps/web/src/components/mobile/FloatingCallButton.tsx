'use client';

import React, { useState, useEffect } from 'react';
import { Button, Box } from '@chakra-ui/react';
import { FaPhone } from 'react-icons/fa';
import { trackCallConversion } from '@/lib/utils/google-ads-tracking';

/**
 * Floating Sticky Call Button
 * 
 * Appears on mobile devices after user scrolls down 300px
 * Always visible in bottom-right corner for easy access
 * Includes Google Ads conversion tracking
 */
export const FloatingCallButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button after scrolling down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener('scroll', toggleVisibility);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Box
      position="fixed"
      bottom={{ base: '20px', md: '30px' }}
      right={{ base: '20px', md: '30px' }}
      zIndex={1000}
      display={{ base: 'block', lg: 'none' }} // Only show on mobile/tablet
    >
      <Button
        as="a"
        href="tel:+441202129746"
        onClick={trackCallConversion}
        size="lg"
        h="60px"
        w="60px"
        borderRadius="full"
        bg="linear-gradient(135deg, #10B981, #059669)"
        color="white"
        boxShadow="0 8px 24px rgba(16, 185, 129, 0.5)"
        _hover={{
          bg: 'linear-gradient(135deg, #059669, #047857)',
          transform: 'scale(1.1)',
          boxShadow: '0 12px 32px rgba(16, 185, 129, 0.6)',
        }}
        _active={{
          transform: 'scale(0.95)',
        }}
        transition="all 0.3s ease"
        aria-label="Call Now"
      >
        <FaPhone size={24} />
      </Button>
    </Box>
  );
};
