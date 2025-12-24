'use client';

import React, { useState, useEffect } from 'react';
import { Box, Button, Badge, useDisclosure } from '@chakra-ui/react';
import { FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import CustomerChatWidget from './CustomerChatWidget';

const MotionBox = motion(Box);

interface FloatingCustomerChatButtonProps {
  position?: 'bottom-right' | 'bottom-left';
  showOnPages?: string[];
  hideOnPages?: string[];
}

export default function FloatingCustomerChatButton({
  position = 'bottom-right',
  showOnPages,
  hideOnPages,
}: FloatingCustomerChatButtonProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if we should show the button on current page
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    const currentPath = window.location.pathname;

    // Hide on admin pages
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/driver')) {
      setIsVisible(false);
      return;
    }

    // Check hideOnPages
    if (hideOnPages && hideOnPages.some(page => currentPath.includes(page))) {
      setIsVisible(false);
      return;
    }

    // Check showOnPages (if specified, only show on those pages)
    if (showOnPages && showOnPages.length > 0) {
      const shouldShow = showOnPages.some(page => currentPath.includes(page));
      setIsVisible(shouldShow);
      return;
    }

    // Default: show on all public pages
    setIsVisible(true);
  }, [mounted, showOnPages, hideOnPages]);

  // Fetch unread count (optional - can be implemented later)
  useEffect(() => {
    // TODO: Implement unread count fetching from API
    // This would require checking for active chat sessions with unread messages
  }, []);

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence mode="wait">
        {!isOpen && (
          <MotionBox
            position="fixed"
            bottom={{ base: '80px', md: '140px' }}
            right={position === 'bottom-right' ? { base: '20px', md: '30px' } : 'auto'}
            left={position === 'bottom-left' ? { base: '20px', md: '30px' } : 'auto'}
            zIndex={10000}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring' }}
            style={{ pointerEvents: 'auto' }}
          >
            <Button
              onClick={onOpen}
              size="lg"
              w={{ base: '60px', md: '70px' }}
              h={{ base: '60px', md: '70px' }}
              borderRadius="full"
              bg="linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
              color="white"
              boxShadow="0 8px 24px rgba(37, 99, 235, 0.5)"
              _hover={{
                bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 32px rgba(37, 99, 235, 0.6)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              transition="all 0.3s ease"
              aria-label="Open Live Chat"
              position="relative"
            >
              <FiMessageCircle size={28} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-2px"
                  right="-2px"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  px={2}
                  minW="20px"
                  h="20px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </Button>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Chat Widget */}
      <CustomerChatWidget isOpen={isOpen} onClose={onClose} />
    </>
  );
}

