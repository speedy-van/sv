'use client';

import React, { useCallback } from 'react';
import { Box, Button, Tooltip } from '@chakra-ui/react';
import { FaWhatsapp } from 'react-icons/fa';
import { trackWhatsAppClick } from '@/lib/analytics';

export const WHATSAPP_URL = 'https://wa.me/message/K57JWNNC2K3TA1';

const openWhatsApp = (context: string) => {
  if (typeof window === 'undefined') return;

  trackWhatsAppClick(context);
  window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
};

type WhatsAppIconLinkProps = {
  label?: string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  context?: string;
  variant?: 'solid' | 'ghost' | 'outline';
  showLabel?: boolean;
  display?: any;
};

// Size mapping for consistent button dimensions
const sizeMap = {
  sm: { box: '36px', icon: 16 },
  md: { box: '44px', icon: 20 },
  lg: { box: '40px', icon: 20 },
};

export const WhatsAppIconLink: React.FC<WhatsAppIconLinkProps> = ({
  label = 'WhatsApp',
  tooltip = 'Chat / Book on WhatsApp',
  size = 'md',
  context = 'header',
  variant = 'solid',
  showLabel = false,
  display,
}) => {
  const handleClick = useCallback(() => openWhatsApp(context), [context]);
  const dimensions = sizeMap[size] || sizeMap.md;

  const button = showLabel ? (
    <Button
      leftIcon={<FaWhatsapp />}
      size={size}
      variant={variant}
      bg="linear-gradient(135deg, #25D366, #128C7E)"
      color="white"
      _hover={{
        bg: 'linear-gradient(135deg, #128C7E, #0C6C5A)',
        transform: 'translateY(-1px)',
      }}
      _active={{ transform: 'scale(0.98)' }}
      onClick={handleClick}
      aria-label={label}
      display={display}
    >
      {label}
    </Button>
  ) : (
    <Box
      as="button"
      aria-label={label}
      onClick={handleClick}
      w={dimensions.box}
      h={dimensions.box}
      minW={dimensions.box}
      borderRadius="full"
      bg="linear-gradient(135deg, #25D366, #128C7E)"
      display={display || 'flex'}
      alignItems="center"
      justifyContent="center"
      cursor="pointer"
      transition="all 0.2s"
      boxShadow="0 4px 14px rgba(37, 211, 102, 0.35)"
      _hover={{
        bg: 'linear-gradient(135deg, #128C7E, #0C6C5A)',
        transform: 'translateY(-2px)',
        boxShadow: '0 6px 18px rgba(37, 211, 102, 0.45)',
      }}
      suppressHydrationWarning
    >
      <Box as="span" display="flex" alignItems="center" justifyContent="center" suppressHydrationWarning>
        <FaWhatsapp size={dimensions.icon} color="white" />
      </Box>
    </Box>
  );

  return (
    <Tooltip label={tooltip} hasArrow placement="bottom">
      <Box as="span" display="inline-block" suppressHydrationWarning>
        {button}
      </Box>
    </Tooltip>
  );
};

type WhatsAppFloatingButtonProps = {
  label?: string;
  showLabel?: boolean;
  context?: string;
  bottomOffset?: string;
  rightOffset?: string;
  zIndex?: number;
};

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  label = 'Chat / Book on WhatsApp',
  showLabel = false,
  context = 'floating_global',
  bottomOffset = '140px',
  rightOffset = '20px',
  zIndex = 1001,
}) => {
  const handleClick = useCallback(() => openWhatsApp(context), [context]);

  return (
    <Box
      position="fixed"
      right={{ base: rightOffset, md: '28px' }}
      bottom={{
        base: `calc(env(safe-area-inset-bottom, 0px) + ${bottomOffset})`,
        md: '32px',
      }}
      zIndex={zIndex}
      pointerEvents="auto"
      display="flex"
      justifyContent="flex-end"
    >
      <Button
        leftIcon={<FaWhatsapp />}
        aria-label="Chat or book on WhatsApp"
        size="lg"
        h="56px"
        px={showLabel ? 5 : 0}
        w={showLabel ? 'auto' : '56px'}
        borderRadius="full"
        bg="linear-gradient(135deg, #25D366, #128C7E)"
        color="white"
        boxShadow="0 10px 30px rgba(18, 140, 126, 0.35)"
        _hover={{
          bg: 'linear-gradient(135deg, #128C7E, #0C6C5A)',
          transform: 'translateY(-2px) scale(1.02)',
          boxShadow: '0 14px 34px rgba(18, 140, 126, 0.45)',
        }}
        _active={{
          transform: 'scale(0.97)',
        }}
        transition="all 0.2s ease"
        onClick={handleClick}
      >
        {showLabel ? label : null}
      </Button>
    </Box>
  );
};

export const openWhatsAppLink = openWhatsApp;

