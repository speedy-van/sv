'use client';

import React from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { FiCheckCircle, FiClock, FiShield, FiTruck } from 'react-icons/fi';

interface HeroMessageProps {
  message?: string;
  showFeatures?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

const HeroMessage: React.FC<HeroMessageProps> = ({
  message = "Trusted by thousands of customers across the UK",
  showFeatures = true,
  variant = 'default',
}) => {
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const features = [
    { icon: FiTruck, text: "Fast Delivery" },
    { icon: FiShield, text: "Secure Service" },
    { icon: FiClock, text: "On-Time" },
    { icon: FiCheckCircle, text: "Reliable" },
  ];

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: useColorModeValue('green.50', 'green.900'),
          borderColor: useColorModeValue('green.200', 'green.700'),
          textColor: useColorModeValue('green.800', 'green.200'),
        };
      case 'warning':
        return {
          bg: useColorModeValue('yellow.50', 'yellow.900'),
          borderColor: useColorModeValue('yellow.200', 'yellow.700'),
          textColor: useColorModeValue('yellow.800', 'yellow.200'),
        };
      case 'info':
        return {
          bg: useColorModeValue('blue.50', 'blue.900'),
          borderColor: useColorModeValue('blue.200', 'blue.700'),
          textColor: useColorModeValue('blue.800', 'blue.200'),
        };
      default:
        return {
          bg: useColorModeValue('gray.50', 'gray.800'),
          borderColor: useColorModeValue('gray.200', 'gray.600'),
          textColor: textColor,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Box
      w="full"
      py={8}
      px={4}
      bg={styles.bg}
      borderTop="1px solid"
      borderColor={styles.borderColor}
    >
      <VStack spacing={6} maxW="4xl" mx="auto">
        <Text
          fontSize={isMobile ? 'sm' : 'md'}
          color={styles.textColor}
          textAlign="center"
          fontWeight="medium"
        >
          {message}
        </Text>

        {showFeatures && (
          <HStack
            spacing={isMobile ? 4 : 8}
            flexWrap="wrap"
            justify="center"
            align="center"
          >
            {features.map((feature, index) => (
              <HStack key={index} spacing={2}>
                <Icon
                  as={feature.icon}
                  boxSize={isMobile ? 4 : 5}
                  color={styles.textColor}
                />
                <Text
                  fontSize={isMobile ? 'xs' : 'sm'}
                  color={styles.textColor}
                  fontWeight="medium"
                >
                  {feature.text}
                </Text>
              </HStack>
            ))}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default HeroMessage;
