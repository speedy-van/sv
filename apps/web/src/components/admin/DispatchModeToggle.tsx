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
      <HStack spacing={2} bg="#111111" px={3} py={2} borderRadius="lg" border="1px solid" borderColor="#333333">
        <Spinner size="sm" color="#2563eb" />
        <Text fontSize="sm" color="#9ca3af">Loading...</Text>
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
      hasArrow
    >
      <Flex
        align="center"
        gap={3}
        px={4}
        py={2.5}
        borderRadius="lg"
        bg={mode === 'auto' 
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
          : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'}
        borderWidth="2px"
        borderColor={mode === 'auto' ? '#10b981' : '#2563eb'}
        boxShadow={mode === 'auto'
          ? '0 4px 16px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2)'
          : '0 4px 16px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.2)'}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        cursor="pointer"
        position="relative"
        overflow="hidden"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: mode === 'auto'
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(29, 78, 216, 0.1) 100%)',
          pointerEvents: 'none',
        }}
        _hover={{
          transform: 'translateY(-2px)',
          boxShadow: mode === 'auto'
            ? '0 6px 24px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.3)'
            : '0 6px 24px rgba(37, 99, 235, 0.6), 0 0 30px rgba(37, 99, 235, 0.3)',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
      >
        <Icon 
          as={mode === 'auto' ? FiZap : FiUser} 
          color="#FFFFFF"
          boxSize={size === 'lg' ? 6 : size === 'sm' ? 4 : 5}
          position="relative"
          zIndex={1}
          filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
        />
        
        {showLabel && (
          <VStack align="start" spacing={0.5} position="relative" zIndex={1}>
            <Text 
              fontSize={size === 'lg' ? 'md' : 'sm'} 
              fontWeight="bold"
              color="#FFFFFF"
              letterSpacing="0.3px"
              textShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
            >
              Dispatch Mode
            </Text>
            <Text 
              fontSize={size === 'lg' ? 'sm' : 'xs'} 
              color="rgba(255, 255, 255, 0.9)"
              fontWeight="semibold"
              letterSpacing="0.5px"
            >
              {mode === 'auto' ? 'Automatic' : 'Manual'}
            </Text>
          </VStack>
        )}

        <Badge
          bg="rgba(255, 255, 255, 0.2)"
          color="#FFFFFF"
          fontSize={size === 'lg' ? 'sm' : 'xs'}
          px={3}
          py={1}
          borderRadius="full"
          fontWeight="bold"
          letterSpacing="0.5px"
          border="1px solid rgba(255, 255, 255, 0.3)"
          backdropFilter="blur(10px)"
          boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
          position="relative"
          zIndex={1}
        >
          {mode.toUpperCase()}
        </Badge>

        <Box position="relative" zIndex={1}>
          <Switch
            isChecked={mode === 'auto'}
            onChange={handleToggle}
            isDisabled={isSwitching}
            colorScheme={mode === 'auto' ? 'green' : 'blue'}
            size={size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'}
            sx={{
              'span[data-checked]': {
                bg: '#FFFFFF',
              },
            }}
          />
        </Box>

        {isSwitching && (
          <Spinner 
            size="sm" 
            color="#FFFFFF"
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            zIndex={2}
          />
        )}
      </Flex>
    </Tooltip>
  );
}

