'use client';

import { useEffect, useState } from 'react';
import { Box, Container, VStack, Text, HStack, Link } from '@chakra-ui/react';

interface TrustpilotWidgetProps {
  businessUnitId?: string;
  templateId?: string;
  theme?: 'light' | 'dark';
  showTitle?: boolean;
}

export default function TrustpilotWidget({
  businessUnitId,
  templateId = '5419b6adfa0340045cd0c9fe',
  theme = 'dark',
  showTitle = true,
}: TrustpilotWidgetProps) {
  // Get businessUnitId from environment variable if not provided
  const finalBusinessUnitId = businessUnitId || process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID || '68b0fc8a6ad677c356e83f14';
  const [isClient, setIsClient] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load Trustpilot script
  useEffect(() => {
    if (!isClient || !finalBusinessUnitId) {
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src*="trustpilot.com/bootstrap"]')) {
      // Script already loaded, trigger widget initialization
      if (typeof window !== 'undefined' && (window as any).Trustpilot) {
        (window as any).Trustpilot.loadFromElement(
          document.querySelector('.trustpilot-widget'),
          true
        );
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Trustpilot widget script loaded successfully');
      // Initialize widget after script loads
      if (typeof window !== 'undefined' && (window as any).Trustpilot) {
        setTimeout(() => {
          const widgetElement = document.querySelector('.trustpilot-widget');
          if (widgetElement) {
            (window as any).Trustpilot.loadFromElement(widgetElement, true);
          }
        }, 100);
      }
    };
    script.onerror = () => {
      console.warn('⚠️ Failed to load Trustpilot widget script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup - remove script on unmount
      const existingScript = document.querySelector('script[src*="trustpilot.com/bootstrap"]');
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [isClient, finalBusinessUnitId]);

  // Don't render on server
  if (!isClient) {
    return null;
  }

  return (
    <Box
      py={{ base: 8, md: 12 }}
      bg="bg.surface"
      borderTopWidth="1px"
      borderTopColor="border.primary"
      display="block"
      visibility="visible"
      opacity={1}
      w="100%"
      sx={{
        '@media (max-width: 767px)': {
          display: 'block !important',
          visibility: 'visible !important',
          opacity: '1 !important',
        }
      }}
    >
      <Container maxW="container.xl">
        <VStack spacing={6}>
          {/* Trustpilot Widget */}
          <Box
            textAlign="center"
            w="full"
            maxW={{ base: '100%', md: '300px' }}
            mx="auto"
            px={{ base: 4, md: 0 }}
          >
            {showTitle && (
              <Text
                fontSize={{ base: 'md', md: 'sm' }}
                color={{ base: 'white', md: 'text.secondary' }}
                mb={4}
                fontWeight="semibold"
                display="block"
                visibility="visible"
                opacity={1}
                sx={{
                  '@media (max-width: 767px)': {
                    display: 'block !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    color: '#FFFFFF !important',
                    fontSize: '16px !important',
                  }
                }}
              >
                Trusted by customers worldwide
              </Text>
            )}

            {/* Trustpilot Micro Review Count Widget */}
            <Box
              className="trustpilot-widget"
              data-locale="en-GB"
              data-template-id={templateId}
              data-businessunit-id={finalBusinessUnitId}
              data-style-height="240px"
              data-style-width="100%"
              data-theme={theme}
              textAlign="center"
              minH={{ base: '180px', md: '240px' }}
              w="100%"
              display="block"
              visibility="visible"
              opacity={1}
              sx={{
                '@media (max-width: 767px)': {
                  display: 'block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  minHeight: '180px !important',
                  '& iframe': {
                    height: '180px !important',
                  }
                },
                '@media (min-width: 768px)': {
                  minHeight: '240px !important',
                  '& iframe': {
                    height: '240px !important',
                  }
                },
                '& a': {
                  textDecoration: 'none',
                  color: '#00C2FF',
                },
                '& .trustpilot-widget': {
                  display: 'inline-block',
                },
                '& iframe': {
                  display: 'block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important',
                  width: '100% !important',
                }
              }}
            >
              <a
                href="https://uk.trustpilot.com/review/speedy-van.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#00C2FF', textDecoration: 'none' }}
              >
                Trustpilot
              </a>
            </Box>
          </Box>

          {/* Footer Links */}
          <HStack spacing={6} wrap="wrap" justify="center">
            <Link href="/privacy" style={{ textDecoration: 'none' }}>
              <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                Privacy Policy
              </Text>
            </Link>
            <Link href="/terms" style={{ textDecoration: 'none' }}>
              <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                Terms of Service
              </Text>
            </Link>
            <Link href="/contact" style={{ textDecoration: 'none' }}>
              <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                Contact Us
              </Text>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}


