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

  //  FIXED: Call all hooks at component level
  const successBg = useColorModeValue('green.50', 'green.900');
  const successBorder = useColorModeValue('green.200', 'green.700');
  const successText = useColorModeValue('green.800', 'green.200');
  
  const warningBg = useColorModeValue('yellow.50', 'yellow.900');
  const warningBorder = useColorModeValue('yellow.200', 'yellow.700');
  const warningText = useColorModeValue('yellow.800', 'yellow.200');
  
  const infoBg = useColorModeValue('blue.50', 'blue.900');
  const infoBorder = useColorModeValue('blue.200', 'blue.700');
  const infoText = useColorModeValue('blue.800', 'blue.200');
  
  const defaultBg = useColorModeValue('gray.50', 'gray.800');
  const defaultBorder = useColorModeValue('gray.200', 'gray.600');

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: successBg,
          borderColor: successBorder,
          textColor: successText,
        };
      case 'warning':
        return {
          bg: warningBg,
          borderColor: warningBorder,
          textColor: warningText,
        };
      case 'info':
        return {
          bg: infoBg,
          borderColor: infoBorder,
          textColor: infoText,
        };
      default:
        return {
          bg: defaultBg,
          borderColor: defaultBorder,
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