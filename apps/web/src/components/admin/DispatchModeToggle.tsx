'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Switch,
  Badge,
  Tooltip,
  useToast,
  Spinner,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FiZap, FiUser, FiInfo } from 'react-icons/fi';

interface DispatchModeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function DispatchModeToggle({ 
  showLabel = true, 
  size = 'md' 
}: DispatchModeToggleProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchCurrentMode();
  }, []);

  const fetchCurrentMode = async () => {
    try {
      const response = await fetch('/api/admin/dispatch/mode');
      const data = await response.json();

      if (data.success) {
        setMode(data.data.mode);
      }
    } catch (error) {
      console.error('Error fetching dispatch mode:', error);
      // Default to manual on error
      setMode('manual');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (isSwitching) return;

    const newMode = mode === 'auto' ? 'manual' : 'auto';
    setIsSwitching(true);

    try {
      const response = await fetch('/api/admin/dispatch/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });

      const data = await response.json();

      if (data.success) {
        setMode(newMode);
        toast({
          title: 'Dispatch Mode Updated',
          description: `Switched to ${newMode === 'auto' ? 'Automatic' : 'Manual'} assignment mode`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
      } else {
        throw new Error(data.error || 'Failed to update mode');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update dispatch mode',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <HStack spacing={2}>
        <Spinner size="sm" />
        <Text fontSize="sm" color="gray.500">Loading...</Text>
      </HStack>
    );
  }

  return (
    <Tooltip
      label={
        mode === 'auto'
          ? 'Auto mode: Orders are automatically assigned to the best available driver'
          : 'Manual mode: You manually assign orders to drivers'
      }
      placement="bottom"
    >
      <Flex
        align="center"
        gap={3}
        p={2}
        px={3}
        borderRadius="md"
        bg={mode === 'auto' ? 'green.50' : 'blue.50'}
        borderWidth="1px"
        borderColor={mode === 'auto' ? 'green.200' : 'blue.200'}
        transition="all 0.2s"
        cursor="pointer"
        _hover={{
          bg: mode === 'auto' ? 'green.100' : 'blue.100',
          transform: 'translateY(-1px)',
          shadow: 'sm'
        }}
      >
        <Icon 
          as={mode === 'auto' ? FiZap : FiUser} 
          color={mode === 'auto' ? 'green.600' : 'blue.600'}
          boxSize={size === 'lg' ? 5 : size === 'sm' ? 3 : 4}
        />
        
        {showLabel && (
          <VStack align="start" spacing={0}>
            <Text 
              fontSize={size === 'lg' ? 'md' : 'sm'} 
              fontWeight="bold"
              color={mode === 'auto' ? 'green.700' : 'blue.700'}
            >
              Dispatch Mode
            </Text>
            <Text 
              fontSize={size === 'lg' ? 'sm' : 'xs'} 
              color={mode === 'auto' ? 'green.600' : 'blue.600'}
            >
              {mode === 'auto' ? 'Automatic' : 'Manual'}
            </Text>
          </VStack>
        )}

        <Badge
          colorScheme={mode === 'auto' ? 'green' : 'blue'}
          fontSize={size === 'lg' ? 'sm' : 'xs'}
          px={2}
          py={1}
          borderRadius="full"
        >
          {mode.toUpperCase()}
        </Badge>

        <Switch
          isChecked={mode === 'auto'}
          onChange={handleToggle}
          isDisabled={isSwitching}
          colorScheme={mode === 'auto' ? 'green' : 'blue'}
          size={size}
        />

        <Tooltip label="Click to learn more about dispatch modes">
          <Box>
            <Icon 
              as={FiInfo} 
              color="gray.400" 
              boxSize={3}
              cursor="help"
            />
          </Box>
        </Tooltip>
      </Flex>
    </Tooltip>
  );
}

