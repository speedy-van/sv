'use client';

import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  HStack,
  VStack,
  Container,
} from '@chakra-ui/react';

interface DriverShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showRefreshButton?: boolean;
  onRefreshClick?: () => void;
  actions?: React.ReactNode;
  stats?: React.ReactNode;
}

const DriverShell: React.FC<DriverShellProps> = ({
  title,
  subtitle,
  children,
  showRefreshButton = false,
  onRefreshClick,
  actions,
  stats,
}) => {
  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* Header */}
      <Box
        bg="bg.card"
        borderBottom={`1px solid`}
        borderColor="border.primary"
        py={4}
        px={6}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" direction={{ base: 'column', md: 'row' }} gap={4}>
            <VStack align={{ base: 'center', md: 'start' }} spacing={1}>
              <Heading size="lg" color="text.primary">
                {title}
              </Heading>
              {subtitle && (
                <Text color="text.secondary" fontSize="sm">
                  {subtitle}
                </Text>
              )}
            </VStack>

            <HStack spacing={3} wrap="wrap">
              {stats}
              {actions}
              {showRefreshButton && onRefreshClick && (
                <Button
                  colorScheme="neon"
                  variant="outline"
                  onClick={onRefreshClick}
                  size="sm"
                >
                  Refresh
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Stats Bar */}
      {stats && (
        <Box
          bg="bg.surface"
          borderBottom={`1px solid`}
          borderColor="border.secondary"
          py={3}
          px={6}
        >
          <Container maxW="container.xl">
            {stats}
          </Container>
        </Box>
      )}

      {/* Content */}
      <Container maxW="container.xl" py={6}>
        {children}
      </Container>
    </Box>
  );
};

export default DriverShell;
