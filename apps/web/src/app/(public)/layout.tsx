import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '@/components/site/Header';
import { WhatsAppFloatingGuard } from '@/components/shared/WhatsAppFloatingGuard';
import CallMeBackFloating from '@/components/shared/CallMeBackFloating';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Box
        minH="100vh"
        display="grid"
        gridTemplateRows="auto 1fr"
        w="100%"
      >
        <Header />

        <Box
          as="main"
          pt={{ base: 28, md: 36 }}
          boxSizing="border-box"
          className="safe-area-bottom"
          sx={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {children}
        </Box>
      </Box>
      <WhatsAppFloatingGuard />
      <CallMeBackFloating />
    </>
  );
}
