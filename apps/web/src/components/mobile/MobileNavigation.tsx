'use client';

import React from 'react';
import {
  Box,
  Flex,
  Heading,
  IconButton,
  useBreakpointValue,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiMenu, FiArrowLeft } from 'react-icons/fi';

interface MobileNavigationProps {
  title: string;
  children: React.ReactNode;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onMenuClick?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  title,
  children,
  showBackButton = false,
  onBackClick,
  onMenuClick,
}) => {
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* Mobile Header */}
      <Box
        position="sticky"
        top={0}
        zIndex={1000}
        bg={bgColor}
        borderBottom={`1px solid ${borderColor}`}
        px={4}
        py={3}
      >
        <Flex align="center" justify="space-between">
          <Flex align="center" gap={3}>
            {showBackButton && (
              <IconButton
                icon={<FiArrowLeft />}
                aria-label="Go back"
                variant="ghost"
                size="sm"
                onClick={onBackClick}
              />
            )}
            <Heading size="md" color="text.primary">
              {title}
            </Heading>
          </Flex>
          
          <IconButton
            icon={<FiMenu />}
            aria-label="Open menu"
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
          />
        </Flex>
      </Box>

      {/* Content */}
      <Box>{children}</Box>
    </Box>
  );
};
