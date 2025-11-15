import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '@/components/site/Header';
import SkipLink from '@/components/site/SkipLink';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        display="grid"
        gridTemplateRows="auto 1fr"
        w="100%"
      >
        <Header />

        <Box
          as="main"
          pb="env(safe-area-inset-bottom)"
          className="safe-area-bottom"
        >
          {children}
        </Box>
      </Box>
    </>
  );
}
