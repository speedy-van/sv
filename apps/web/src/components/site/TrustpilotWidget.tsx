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
  const [widgetError, setWidgetError] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Suppress Trustpilot 403 errors in console (common on localhost)
  // Trustpilot widgets often return 403 on localhost due to domain restrictions
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    // Suppress console errors for Trustpilot 403
    const originalError = console.error;
    const originalWarn = console.warn;

    const suppressTrustpilotErrors = (...args: any[]) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('trustpilot') || message.includes('trustbox')) {
        if (message.includes('403') || 
            message.includes('failed to load resource') ||
            message.includes('forbidden')) {
          setWidgetError(true);
          return; // Suppress the error
        }
      }
      // Allow other errors through
      originalError.apply(console, args);
    };

    const suppressTrustpilotWarnings = (...args: any[]) => {
      const message = args.join(' ').toLowerCase();
      if (message.includes('trustpilot') || message.includes('trustbox')) {
        if (message.includes('403') || 
            message.includes('failed to load resource') ||
            message.includes('forbidden')) {
          setWidgetError(true);
          return; // Suppress the warning
        }
      }
      // Allow other warnings through
      originalWarn.apply(console, args);
    };

    // Override console methods
    console.error = suppressTrustpilotErrors;
    console.warn = suppressTrustpilotWarnings;

    // Listen for network errors from iframes and resources
    const handleError = (event: ErrorEvent | Event) => {
      const target = event.target as HTMLElement;
      let shouldSuppress = false;

      // Check error message
      if (event instanceof ErrorEvent) {
        const message = (event.message || '').toLowerCase();
        if ((message.includes('trustpilot') || message.includes('trustbox')) &&
            (message.includes('403') || message.includes('failed to load resource'))) {
          shouldSuppress = true;
        }
      }

      // Check resource source
      if (target && (target.tagName === 'IFRAME' || target.tagName === 'SCRIPT' || target.tagName === 'IMG')) {
        const src = (target as HTMLIFrameElement).src || 
                   (target as HTMLScriptElement).src || 
                   (target as HTMLImageElement).src;
        if (src && (src.includes('trustpilot') || src.includes('trustbox'))) {
          shouldSuppress = true;
        }
      }

      if (shouldSuppress) {
        event.preventDefault();
        event.stopPropagation();
        setWidgetError(true);
        return false;
      }
    };

    // Listen for both error types
    window.addEventListener('error', handleError, true);

    return () => {
      // Restore original console methods
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener('error', handleError, true);
    };
  }, [isClient]);

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
    script.defer = true;
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
      // Silently handle Trustpilot script errors (common on localhost)
      setWidgetError(true);
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
              position="relative"
              textAlign="center"
              minH={{ base: '180px', md: '240px' }}
              w="100%"
              display="block"
              visibility="visible"
              opacity={1}
            >
              {/* Trustpilot Widget (may fail on localhost) */}
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
              />

              {/* Clickable Overlay Link - Always visible and clickable */}
              <Box
                as="a"
                href="https://uk.trustpilot.com/review/speedy-van.co.uk"
                target="_blank"
                rel="noopener noreferrer"
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={10}
                cursor="pointer"
                onClick={(e: React.MouseEvent<HTMLElement>) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open('https://uk.trustpilot.com/review/speedy-van.co.uk', '_blank', 'noopener,noreferrer');
                }}
                display="inline-block"
                padding="12px 24px"
                borderRadius="8px"
                border="1px solid rgba(59, 130, 246, 0.3)"
                bg="rgba(26, 26, 26, 0.8)"
                color="#00C2FF"
                textDecoration="none"
                fontWeight="semibold"
                fontSize="sm"
                transition="all 0.3s ease"
                _hover={{
                  bg: 'rgba(59, 130, 246, 0.2)',
                  borderColor: 'rgba(59, 130, 246, 0.5)',
                  transform: 'translate(-50%, -50%) scale(1.05)',
                  boxShadow: '0 4px 12px rgba(0, 194, 255, 0.3)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                  e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 194, 255, 0.3)';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 26, 26, 0.8)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                  e.currentTarget.style.transform = 'translate(-50%, -50%)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                View on Trustpilot
              </Box>
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


