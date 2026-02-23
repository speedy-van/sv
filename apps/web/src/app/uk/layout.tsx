import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '@/components/site/Header';
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
      <Box
        minH="100vh"
        display="flex"
        flexDirection="column"
        w="100%"
        bg="bg.canvas"
        color="text.primary"
      >
        <Header />

        <Box
          as="main"
          flex="1"
          pt={{ base: 20, md: 22 }}
          boxSizing="border-box"
          className="safe-area-bottom"
          sx={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {children}
        </Box>

        <HomeFooter />
      </Box>
      <WhatsAppFloatingGuard />
    </>
  );
}
