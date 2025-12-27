'use client';

/**
 * Unified Floating Action Buttons for Booking Luxury
 * Prevents overlapping and provides consistent mobile UX
 */

import React from 'react';
import {
  Box,
  VStack,
  IconButton,
  Badge,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { FaRobot, FaShoppingCart, FaCommentDots, FaWhatsapp } from 'react-icons/fa';
import { openWhatsAppLink } from '@/components/shared/WhatsAppEntryPoint';

interface FloatingActionButtonsProps {
  // Selected Items
  itemCount?: number;
  onItemsClick?: () => void;
  showItemsButton?: boolean;
  
  // AI Assistant
  onAIClick?: () => void;
  showAIButton?: boolean;
  
  // Live Chat
  onChatClick?: () => void;
  showChatButton?: boolean;
  chatUnreadCount?: number;

  // WhatsApp
  showWhatsAppButton?: boolean;
  onWhatsAppClick?: () => void;
  whatsappLabel?: string;
}

export default function FloatingActionButtons({
  itemCount = 0,
  onItemsClick,
  showItemsButton = false,
  onAIClick,
  showAIButton = false,
  onChatClick,
  showChatButton = true,
  chatUnreadCount = 0,
  showWhatsAppButton = true,
  onWhatsAppClick = () => openWhatsAppLink('booking_floating'),
  whatsappLabel = 'Chat / Book on WhatsApp',
}: FloatingActionButtonsProps) {
  
  return (
    <Box
      position="fixed"
      bottom={{ base: '20px', md: '30px' }}
      right={{ base: '20px', md: '30px' }}
      zIndex={9999}
      pointerEvents="none"
    >
      <VStack spacing={3} align="flex-end">
        {/* WhatsApp Button - Placed above Selected Items */}
        {showWhatsAppButton && (
          <Tooltip
            label={whatsappLabel}
            placement="left"
            hasArrow
          >
            <Box pointerEvents="auto">
              <IconButton
                aria-label={whatsappLabel}
                icon={<Icon as={FaWhatsapp} boxSize={6} />}
                onClick={onWhatsAppClick}
                size="lg"
                w="60px"
                h="60px"
                borderRadius="full"
                bgGradient="linear(to-br, #25D366, #128C7E)"
                color="white"
                boxShadow="0 6px 20px rgba(18, 140, 126, 0.35)"
                _hover={{
                  bgGradient: 'linear(to-br, #128C7E, #0C6C5A)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 8px 24px rgba(18, 140, 126, 0.45)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
              />
            </Box>
          </Tooltip>
        )}

        {/* Selected Items Button - Cart Icon with Badge */}
        {showItemsButton && itemCount > 0 && (
          <Tooltip 
            label={`${itemCount} item${itemCount !== 1 ? 's' : ''} selected`}
            placement="left"
            hasArrow
          >
            <Box position="relative" pointerEvents="auto">
              <IconButton
                aria-label="View selected items"
                icon={<Icon as={FaShoppingCart} boxSize={6} />}
                onClick={onItemsClick}
                size="lg"
                w="60px"
                h="60px"
                borderRadius="full"
                bg="white"
                color="blue.600"
                border="2px solid"
                borderColor="blue.500"
                boxShadow="0 4px 16px rgba(37, 99, 235, 0.3)"
                _hover={{
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                  borderColor: 'blue.600',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
              />
              <Badge
                position="absolute"
                top="-4px"
                right="-4px"
                colorScheme="red"
                borderRadius="full"
                fontSize="xs"
                fontWeight="bold"
                minW="24px"
                h="24px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
              >
                {itemCount}
              </Badge>
            </Box>
          </Tooltip>
        )}

        {/* AI Assistant Button */}
        {showAIButton && (
          <Tooltip 
            label="AI Assistant"
            placement="left"
            hasArrow
          >
            <Box pointerEvents="auto">
              <IconButton
                aria-label="Open AI Assistant"
                icon={<Icon as={FaRobot} boxSize={6} />}
                onClick={onAIClick}
                size="lg"
                w="60px"
                h="60px"
                borderRadius="full"
                bgGradient="linear(to-br, green.400, teal.500)"
                color="white"
                boxShadow="0 4px 16px rgba(16, 185, 129, 0.3)"
                _hover={{
                  bgGradient: 'linear(to-br, green.500, teal.600)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
              />
            </Box>
          </Tooltip>
        )}

        {/* Live Chat Button */}
        {showChatButton && (
          <Tooltip 
            label="Live Chat Support"
            placement="left"
            hasArrow
          >
            <Box position="relative" pointerEvents="auto">
              <IconButton
                aria-label="Open live chat"
                icon={<Icon as={FaCommentDots} boxSize={6} />}
                onClick={onChatClick}
                size="lg"
                w="60px"
                h="60px"
                borderRadius="full"
                bgGradient="linear(135deg, #10b981, #059669)"
                color="white"
                boxShadow="0 4px 16px rgba(16, 185, 129, 0.3)"
                _hover={{
                  bgGradient: 'linear(135deg, #059669, #047857)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
              />
              {chatUnreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-4px"
                  right="-4px"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                  minW="24px"
                  h="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                >
                  {chatUnreadCount}
                </Badge>
              )}
            </Box>
          </Tooltip>
        )}
      </VStack>
    </Box>
  );
}
