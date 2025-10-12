'use client';

import React from 'react';
import { Box, Link, useColorModeValue } from '@chakra-ui/react';

const SkipLink: React.FC = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const color = useColorModeValue('black', 'white');

  return (
    <Box
      as="a"
      href="#main-content"
      position="absolute"
      top="-40px"
      left="6px"
      bg={bgColor}
      color={color}
      padding="8px"
      textDecoration="none"
      borderRadius="4px"
      zIndex="9999"
      opacity={0}
      _focus={{
        top: "6px",
        opacity: 1,
      }}
      transition="all 0.3s"
    >
      Skip to main content
    </Box>
  );
};

export default SkipLink;
