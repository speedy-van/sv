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
        sx={{
          minHeight: '100svh',
          '@supports not (height: 100svh)': {
            minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
          },
        }}
        display="grid"
        gridTemplateRows="auto 1fr"
        w="100%"
      >
        <Header />

        <Box
          as="main"
          sx={{
            // Header height + iOS safe area
            paddingTop: {
              base: 'calc(72px + env(safe-area-inset-top))',
              md: 'calc(120px + env(safe-area-inset-top))',
              lg: 'calc(140px + env(safe-area-inset-top))',
            },
          }}
          pb="env(safe-area-inset-bottom)"
          className="safe-area-bottom"
        >
          {children}
        </Box>
      </Box>
      <WhatsAppFloatingGuard />
      <CallMeBackFloating />
    </>
  );
}
