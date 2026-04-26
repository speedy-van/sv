"use client";

import { Box } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { AnalyticsPixels } from "@/components/tracking/AnalyticsPixels";
import { CookieConsent } from "./CookieConsent";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { StickyBookBar } from "./StickyBookBar";

export function ClientShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const isAppArea = pathname.startsWith("/admin") || pathname.startsWith("/driver");
  return (
    <>
      <Navbar />
      <Box as="main" minH="100vh">
        {children}
      </Box>
      <Footer />
      <StickyBookBar />
      {!isAppArea && (
        <>
          <CookieConsent />
          <AnalyticsPixels />
        </>
      )}
    </>
  );
}
