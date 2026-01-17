'use client';

import { useEffect, useState } from 'react';
import { Box, Container, VStack, Text, HStack, Link, Icon, Badge, Button } from '@chakra-ui/react';
import { FaStar } from 'react-icons/fa';
import {
  getTrustpilotConfig,
  loadTrustpilotWidget
} from '@/lib/trustpilot-config';

interface TrustpilotWidgetProps {
  businessUnitId?: string;
  templateId?: string;
  token?: string;
  locale?: string;
  theme?: 'light' | 'dark';
  showTitle?: boolean;
}

export default function TrustpilotWidget({
  businessUnitId: propBusinessUnitId,
  templateId: propTemplateId,
  token: propToken,
  locale: propLocale,
  theme = 'dark',
  showTitle = true,
}: TrustpilotWidgetProps) {
  // Use centralized configuration
  const config = getTrustpilotConfig();
  const finalBusinessUnitId = propBusinessUnitId || config.businessUnitId;
  const finalTemplateId = propTemplateId || config.templateId;
  const finalToken = propToken || config.token;
  const finalLocale = propLocale || config.locale;

  const [isClient, setIsClient] = useState(false);
  const [widgetError, setWidgetError] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Log diagnostics in development mode (concise, one-time)
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔍 Trustpilot widget config: origin=${window.location.origin}, businessUnitId=${finalBusinessUnitId}, templateId=${finalTemplateId}, token=${finalToken}, locale=${finalLocale}`
      );
    }
  }, [isClient, finalBusinessUnitId, finalTemplateId, finalToken, finalLocale]);

  // Handle Trustpilot widget errors gracefully
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Listen for resource loading errors
    const handleError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLElement;

      // Check if error is from a Trustpilot resource
      if (target && (target.tagName === 'IFRAME' || target.tagName === 'SCRIPT')) {
        const src = (target as HTMLIFrameElement).src || (target as HTMLScriptElement).src;
        if (src && src.includes('trustpilot')) {
          // Silently handle Trustpilot errors (403, etc.) without cluttering console
          event.preventDefault();
          event.stopPropagation();
          setWidgetError(true);

          // Log once in development for debugging
          if (process.env.NODE_ENV === 'development' && !widgetError) {
            console.warn('[Trustpilot] Widget failed to load. This is usually due to domain restrictions. Check Trustpilot dashboard for domain whitelisting.');
          }

          return false;
        }
      }
    };

    window.addEventListener('error', handleError, true);

    return () => {
      window.removeEventListener('error', handleError, true);
    };
  }, [isClient, widgetError]);

  // Load Trustpilot script and widget
  useEffect(() => {
    if (!isClient || !finalBusinessUnitId || !config.isConfigured) {
      if (process.env.NODE_ENV === 'development' && !config.isConfigured) {
        console.warn('[Trustpilot] Configuration is incomplete. Check environment variables.');
      }
      return;
    }

    // Use centralized script loading helper
    const cleanup = loadTrustpilotWidget(finalBusinessUnitId, (error: Error) => {
      if (error) {
        setWidgetError(true);

        if (process.env.NODE_ENV === 'development') {
          console.warn('[Trustpilot] Widget initialization failed:', error.message);
        }
      }
    });

    return cleanup;
  }, [isClient, finalBusinessUnitId, config.isConfigured]);

  // Don't render on server
  if (!isClient) {
    return null;
  }

  // If config is invalid, handle gracefully
  if (!config.isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <Box p={4} bg="yellow.100" borderRadius="md" border="1px solid" borderColor="yellow.400">
          <Text fontSize="sm" color="gray.800">
            ⚠️ Trustpilot widget is not configured. Please check environment variables.
          </Text>
        </Box>
      );
    }
    // In production, fail silently
    return null;
  }

  return (
    <Box
      as="section"
      bg="transparent"
      borderTop="1px solid rgba(255, 255, 255, 0.06)"
      py={{ base: 8, md: 10 }}
      mt={{ base: 10, md: 14 }}
    >
      <Container maxW="container.xl">
        <VStack spacing={{ base: 6, md: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }} w="full" align="center">
            <VStack spacing={2}>
              <HStack spacing={1} justify="center">
                {[...Array(5)].map((_, i) => (
                  <Icon
                    key={i}
                    as={FaStar}
                    color="green.400"
                    boxSize={{ base: 5, md: 6 }}
                  />
                ))}
                <Text color="green.300" fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} ml={2}>
                  4.8/5
                </Text>
              </HStack>
              <Badge
                colorScheme="green"
                variant="solid"
                px={4}
                py={1.5}
                borderRadius="full"
                fontWeight="bold"
                fontSize={{ base: 'xs', md: 'sm' }}
              >
                Rated Excellent on Trustpilot
              </Badge>
              <Text color="whiteAlpha.700" fontSize={{ base: 'sm', md: 'md' }} textAlign="center">
                Join thousands of happy customers
              </Text>
            </VStack>
            {/* Enhanced Trustpilot TrustBox Widget */}
            <Box
              position="relative"
              textAlign="center"
              minH={{ base: '60px', md: '60px' }}
              w="100%"
              maxW="800px"
              mx="auto"
              display="block"
              visibility="visible"
              opacity={1}
              bg="transparent"
            >
              {/* Trustpilot Widget - Official TrustBox snippet structure */}
              <Box
                className="trustpilot-widget"
                data-locale={finalLocale}
                data-template-id={finalTemplateId}
                data-businessunit-id={finalBusinessUnitId}
                data-style-height="52px"
                data-style-width="100%"
                data-token={finalToken}
                textAlign="center"
                minH="52px"
                w="100%"
                display="block"
                visibility="visible"
                opacity={1}
                mb={4}
                sx={{
                  '@media (max-width: 767px)': {
                    display: 'block !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    minHeight: '52px !important',
                    '& iframe': {
                      height: '52px !important',
                    }
                  },
                  '@media (min-width: 768px)': {
                    minHeight: '52px !important',
                    '& iframe': {
                      height: '52px !important',
                    }
                  },
                  '& a': {
                    textDecoration: 'none',
                    color: '#00C2FF',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: '#3B82F6',
                    }
                  },
                  '& .trustpilot-widget': {
                    display: 'inline-block',
                  },
                  '& iframe': {
                    display: 'block !important',
                    visibility: 'visible !important',
                    opacity: '1 !important',
                    width: '100% !important',
                    borderRadius: '8px',
                  }
                }}
              >
                {/* Fallback link (visible when widget fails to load) */}
                <a
                  href="https://www.trustpilot.com/review/speedy-van.co.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Trustpilot
                </a>
              </Box>

              {/* Enhanced Clickable Button */}
              <Button
                as="a"
                href="https://www.trustpilot.com/review/speedy-van.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open('https://www.trustpilot.com/review/speedy-van.co.uk', '_blank', 'noopener,noreferrer');
                }}
                size={{ base: 'md', md: 'lg' }}
                colorScheme="green"
                leftIcon={<Icon as={FaStar} />}
                mt={3}
                px={{ base: 6, md: 8 }}
                borderRadius="full"
                boxShadow="0 4px 15px rgba(34, 197, 94, 0.3)"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(34, 197, 94, 0.4)',
                }}
                _active={{
                  transform: 'translateY(0)',
                }}
              >
                View Our Reviews
              </Button>
            </Box>
          </VStack>

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


