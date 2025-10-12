'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Button,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import {
  FaTruck,
  FaBell,
  FaSync,
  FaMapMarkerAlt,
} from 'react-icons/fa';

interface NoJobsMessageProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  message?: string;
  subMessage?: string;
}

export function NoJobsMessage({
  onRefresh,
  isRefreshing = false,
  message = "No available jobs at the moment",
  subMessage = "New jobs will appear here when customers place orders"
}: NoJobsMessageProps) {
  // Use Admin dashboard styling - dark theme with neon accents
  const bgColor = 'bg.surface';
  const textColor = 'text.secondary';
  const textPrimary = 'text.primary';
  const iconColor = 'text.disabled';

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={6} textAlign="center">
        {/* Icon */}
        <Box
          p={6}
          borderRadius="full"
          bg={bgColor}
          color={iconColor}
          boxShadow="0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)"
          animation="pulse-icon 3s ease-in-out infinite"
          sx={{
            "@keyframes pulse-icon": {
              "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.15)" },
              "50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)" }
            }
          }}
        >
          <Icon as={FaTruck} boxSize={12} />
        </Box>

        {/* Message */}
        <VStack spacing={3}>
          <Text
            fontSize="xl"
            fontWeight="semibold"
            color="white"
            textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
          >
            {message}
          </Text>
          <Text
            fontSize="md"
            color="white"
            lineHeight="1.6"
            textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
          >
            {subMessage}
          </Text>
        </VStack>

        {/* Tips */}
        <VStack spacing={4} align="stretch" w="full">
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="white"
            textShadow="0 0 10px rgba(255, 255, 255, 0.6)"
          >
            💡 Tips to get more jobs:
          </Text>
          <VStack spacing={2} align="start" w="full" pl={4}>
            <HStack spacing={3}>
              <Icon as={FaMapMarkerAlt} color="neon.500" boxSize={4} />
              <Text 
                fontSize="sm" 
                color="white"
                textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
              >
                Keep your location updated
              </Text>
            </HStack>
            <HStack spacing={3}>
              <Icon as={FaBell} color="brand.500" boxSize={4} />
              <Text 
                fontSize="sm" 
                color="white"
                textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
              >
                Enable notifications for new jobs
              </Text>
            </HStack>
            <HStack spacing={3}>
              <Icon as={FaSync} color="info.500" boxSize={4} />
              <Text 
                fontSize="sm" 
                color="white"
                textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
              >
                Check back regularly for updates
              </Text>
            </HStack>
          </VStack>
        </VStack>

        {/* Refresh Button */}
        {onRefresh && (
          <Button
            colorScheme="blue"
            size="lg"
            onClick={onRefresh}
            isLoading={isRefreshing}
            loadingText="Checking for jobs..."
            leftIcon={<Icon as={FaSync} />}
            borderRadius="xl"
            fontWeight="semibold"
            px={8}
            py={6}
            position="relative"
            overflow="hidden"
            boxShadow="0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)",
              _before: {
                content: '""',
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "0",
                height: "0",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.6)",
                transform: "translate(-50%, -50%)",
                animation: "ripple-refresh 0.6s ease-out"
              }
            }}
            sx={{
              "@keyframes ripple-refresh": {
                "0%": { width: "0", height: "0", opacity: 1 },
                "100%": { width: "250px", height: "250px", opacity: 0 }
              }
            }}
          >
            Check for New Jobs
          </Button>
        )}
      </VStack>
    </Container>
  );
}
