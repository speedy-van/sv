'use client';

import React from 'react';
import {
  Tooltip,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverHeader,
  VStack,
  HStack,
  Text,
  Link,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FiHelpCircle, FiExternalLink } from 'react-icons/fi';

interface HelpTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  link?: string;
  linkText?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'tooltip' | 'popover';
}

export function HelpTooltip({
  content,
  title,
  link,
  linkText = 'Learn more',
  placement = 'top',
  variant = 'tooltip',
}: HelpTooltipProps) {
  const bgColor = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  if (variant === 'popover') {
    return (
      <Popover placement={placement}>
        <PopoverTrigger>
          <IconButton
            aria-label="Help"
            icon={<FiHelpCircle />}
            size="xs"
            variant="ghost"
            color={secondaryTextColor}
            _hover={{ color: textColor }}
          />
        </PopoverTrigger>
        <PopoverContent bg={bgColor} borderColor={borderColor} borderWidth={1}>
          {title && (
            <PopoverHeader color={textColor} fontWeight="bold" fontSize="sm">
              {title}
            </PopoverHeader>
          )}
          <PopoverBody>
            <VStack align="start" spacing={2}>
              {typeof content === 'string' ? (
                <Text fontSize="sm" color={textColor}>
                  {content}
                </Text>
              ) : (
                content
              )}
              {link && (
                <Link
                  href={link}
                  isExternal
                  color="#2563eb"
                  fontSize="xs"
                  _hover={{ textDecoration: 'underline' }}
                >
                  <HStack spacing={1}>
                    <Text>{linkText}</Text>
                    <Icon as={FiExternalLink} boxSize={3} />
                  </HStack>
                </Link>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip
      label={
        <VStack align="start" spacing={1}>
          {title && (
            <Text fontWeight="bold" fontSize="sm">
              {title}
            </Text>
          )}
          {typeof content === 'string' ? (
            <Text fontSize="xs">{content}</Text>
          ) : (
            content
          )}
          {link && (
            <Link href={link} isExternal color="#2563eb" fontSize="xs">
              {linkText} →
            </Link>
          )}
        </VStack>
      }
      placement={placement}
      hasArrow
      bg={bgColor}
      color={textColor}
      borderColor={borderColor}
      borderWidth={1}
      maxW="300px"
    >
      <IconButton
        aria-label="Help"
        icon={<FiHelpCircle />}
        size="xs"
        variant="ghost"
        color={secondaryTextColor}
        _hover={{ color: textColor }}
      />
    </Tooltip>
  );
}

