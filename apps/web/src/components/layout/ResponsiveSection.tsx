/**
 * ResponsiveSection - Mobile-First Layout Wrapper
 * 
 * Use this component for all new sections/cards to ensure mobile responsiveness.
 * 
 * Features:
 * - 100% width on mobile, max-width constrained on desktop
 * - Responsive padding (mobile: 16px, tablet: 24px, desktop: 32px)
 * - Prevents horizontal overflow
 * - Follows Chakra UI responsive patterns
 * 
 * @example
 * ```tsx
 * <ResponsiveSection maxW="1200px" bg="gray.900">
 *   <Heading>My Section</Heading>
 *   <Text>Content here</Text>
 * </ResponsiveSection>
 * ```
 */

import { Container, ContainerProps } from '@chakra-ui/react';
import { ReactNode } from 'react';

interface ResponsiveSectionProps extends Omit<ContainerProps, 'maxW'> {
  children: ReactNode;
  /**
   * Maximum width for desktop (default: "1200px")
   * Always 100% on mobile regardless of this value
   */
  maxW?: '1200px' | '1440px' | '100%';
  /**
   * Disable horizontal overflow protection (default: false)
   */
  allowOverflow?: boolean;
}

export function ResponsiveSection({
  children,
  maxW = '1200px',
  allowOverflow = false,
  px,
  ...props
}: ResponsiveSectionProps) {
  return (
    <Container
      maxW={{
        base: '100%', // Mobile: full width
        lg: maxW,     // Desktop: constrained width
      }}
      px={px || { base: 4, md: 6, lg: 8 }} // 16px, 24px, 32px
      w="100%"
      overflowX={allowOverflow ? undefined : 'hidden'}
      {...props}
    >
      {children}
    </Container>
  );
}
