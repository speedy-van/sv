/**
 * RESPONSIVE CARD/SECTION TEMPLATE
 * 
 * ⚠️ COPY THIS COMMENT BLOCK TO EVERY NEW CARD COMPONENT ⚠️
 * 
 * MOBILE RESPONSIVE RULES (MANDATORY):
 * 
 * 1. ✅ DO: Use ResponsiveSection wrapper for page sections
 *    import { ResponsiveSection } from '@/components/layout/ResponsiveSection';
 * 
 * 2. ✅ DO: Use Chakra responsive props instead of breakpoint hooks
 *    <Box w="full" maxW={{ base: "100%", lg: "800px" }} p={{ base: 4, md: 6 }}>
 * 
 * 3. ❌ DON'T: Use fixed pixel widths above mobile range
 *    ❌ w="1200px"  ❌ minW="1024px"
 *    ✅ maxW={{ base: "100%", lg: "1200px" }}
 * 
 * 4. ❌ DON'T: Import useBreakpointValue directly from @chakra-ui/react
 *    ❌ import { useBreakpointValue } from '@chakra-ui/react';
 *    ✅ Use responsive props instead, or our wrapper if absolutely needed
 * 
 * 5. ✅ DO: Test in DevTools mobile mode (iPhone 15 Pro: 393px width)
 *    - No horizontal scrolling
 *    - Text readable (min 16px for inputs)
 *    - Touch targets ≥ 44px
 * 
 * 6. ✅ DO: Verify viewport meta exists in production build
 *    Run: pnpm -C apps/web build
 *    Then: Search .next for 'name="viewport"'
 */

'use client';

import React from 'react';
import {
  Box,
  Card,
  CardBody,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { ResponsiveSection } from '@/components/layout/ResponsiveSection';

interface MyResponsiveCardProps {
  title: string;
  description: string;
}

/**
 * Example card component following responsive guidelines
 */
export function MyResponsiveCard({ title, description }: MyResponsiveCardProps) {
  // ✅ DO: Use Chakra color mode hooks
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // ❌ DON'T: Use useBreakpointValue for layout decisions
  // const isMobile = useBreakpointValue({ base: true, md: false });
  
  // ✅ DO: Use responsive props or display prop
  // <Box display={{ base: 'block', md: 'flex' }}>

  return (
    <ResponsiveSection maxW="1200px">
      <Card
        bg={bgColor}
        borderColor={borderColor}
        borderWidth="1px"
        // ✅ DO: Use responsive props for padding, margin, etc.
        p={{ base: 4, md: 6, lg: 8 }}
        // ❌ DON'T: p={isMobile ? 4 : 8}
      >
        <CardBody>
          <VStack spacing={{ base: 3, md: 4 }} align="start">
            <Heading
              size={{ base: 'md', md: 'lg' }}
              color="white"
            >
              {title}
            </Heading>
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="gray.400"
            >
              {description}
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </ResponsiveSection>
  );
}

/**
 * TESTING CHECKLIST (before committing):
 * 
 * [ ] Opened DevTools → Toggle Device Toolbar
 * [ ] Tested on iPhone 15 Pro (393px) - no horizontal scroll
 * [ ] Tested on iPad (768px) - layout transitions correctly
 * [ ] Tested on Desktop (1440px) - max-width applied
 * [ ] Inspected <head> - viewport meta exists
 * [ ] No console warnings about hydration mismatch
 * [ ] All touch targets ≥ 44px height
 * [ ] Input text size ≥ 16px (prevents iOS auto-zoom)
 */
