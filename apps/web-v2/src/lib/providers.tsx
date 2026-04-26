"use client";

import { Box, ChakraProvider } from "@chakra-ui/react";
import { ReactNode, useEffect, useState } from "react";
import { system } from "./theme";

export function Providers({ children }: { children: ReactNode }) {
  // Mount-guard prevents Chakra v3 SSR/CSR style mismatches in monorepo dev.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ChakraProvider value={system}>
      <Box visibility={mounted ? "visible" : "hidden"}>{children}</Box>
    </ChakraProvider>
  );
}
