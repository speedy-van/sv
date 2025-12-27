import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '@/components/site/Header';
import SkipLink from '@/components/site/SkipLink';
import { WhatsAppFloatingGuard } from '@/components/shared/WhatsAppFloatingGuard';
import HomeFooter from '@/components/site/HomeFooter';

// Force Node runtime for SSG/ISR
export const runtime = 'nodejs';
export const revalidate = 86400; // 24h ISR
export const dynamic = 'force-static';
export const dynamicParams = false;

export default function UKLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SkipLink />
      <Box
        sx={{
          minHeight: '100svh',
          '@supports not (height: 100svh)': {
            minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          },
        }}
        display="flex"
        flexDirection="column"
        w="100%"
        bg="linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)"
        color="white"
      >
        <Header />

        <Box
          as="main"
          flex="1"
          pb="env(safe-area-inset-bottom)"
          className="safe-area-bottom"
        >
          {children}
        </Box>

        <HomeFooter />
      </Box>
      <WhatsAppFloatingGuard />
    </>
  );
}
