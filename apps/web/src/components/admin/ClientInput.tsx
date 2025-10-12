'use client';

import React from 'react';
import {
  Input,
  InputProps,
  useColorModeValue,
} from '@chakra-ui/react';

interface ClientInputProps extends InputProps {
  // Add any additional props specific to ClientInput
}

const ClientInput: React.FC<ClientInputProps> = ({
  ...props
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const focusBorderColor = useColorModeValue('blue.500', 'blue.300');

  return (
    <Input
      bg={bgColor}
      borderColor={borderColor}
      _hover={{
        borderColor: borderColor,
      }}
      _focus={{
        borderColor: focusBorderColor,
        boxShadow: `0 0 0 1px ${focusBorderColor}`,
      }}
      _placeholder={{
        color: 'gray.500',
      }}
      {...props}
    />
  );
};

export default ClientInput;
