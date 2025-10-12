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
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import DispatchModeToggle from './DispatchModeToggle';

interface AdminShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  actions?: React.ReactNode;
  showDispatchMode?: boolean;
}

const AdminShell: React.FC<AdminShellProps> = ({
  title,
  subtitle,
  children,
  showCreateButton = false,
  onCreateClick,
  actions,
  showDispatchMode = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box minH="100vh" bg="bg.canvas">
      {/* Header */}
      <Box
        bg={bgColor}
        borderBottom={`1px solid ${borderColor}`}
        py={4}
        px={6}
        position="sticky"
        top={0}
        zIndex={1000}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="lg" color="text.primary">
                {title}
              </Heading>
              {subtitle && (
                <Text color="text.secondary" fontSize="sm">
                  {subtitle}
                </Text>
              )}
            </VStack>

            <HStack spacing={3}>
              {showDispatchMode && <DispatchModeToggle />}
              {actions}
              {showCreateButton && onCreateClick && (
                <Button
                  colorScheme="blue"
                  onClick={onCreateClick}
                  size="sm"
                >
                  Create New
                </Button>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="container.xl" py={6}>
        {children}
      </Container>
    </Box>
  );
};

export default AdminShell;
