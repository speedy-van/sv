import React from 'react';
import { Box } from '@chakra-ui/react';
import Header from '@/components/site/Header';
import Footer from '@/components/site/Footer';
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
        minH="100dvh"
        display="grid"
        gridTemplateRows="auto 1fr auto"
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

        <Footer />
      </Box>
    </>
  );
}
