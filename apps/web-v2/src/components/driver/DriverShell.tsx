"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Flex, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { DriverNav } from "./DriverNav";
import { getDriverSession } from "@/lib/driver-api";

export function DriverShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const [name, setName] = useState("");

  useEffect(() => {
    getDriverSession()
      .then((data) => {
        if (data.isAuthenticated && data.user?.role === "driver") {
          setName(data.user.name || "Driver");
          setStatus("ok");
        } else {
          setStatus("denied");
        }
      })
      .catch(() => setStatus("denied"));
  }, []);

  useEffect(() => {
    if (status === "denied") {
      router.replace(`/auth/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [status, router, path]);

  if (status === "loading") {
    return (
      <Box
        bg="obsidian"
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Stack align="center" gap="4">
          <Spinner color="gold" size="xl" borderWidth="3px" />
          <Text fontFamily="body" color="muted" fontSize="sm">
            Checking credentials…
          </Text>
        </Stack>
      </Box>
    );
  }

  if (status !== "ok") return null;

  return (
    <Flex bg="obsidian" minH="100vh" color="pearl">
      <DriverNav />

      {/* Content */}
      <Box
        flex="1"
        ml={{ base: 0, lg: "220px" }}
        mb={{ base: "64px", lg: 0 }}
        display="flex"
        flexDirection="column"
      >
        {/* Topbar */}
        <HStack
          as="header"
          px={{ base: "4", md: "6" }}
          py="4"
          justify="space-between"
          align="center"
          bg="rgba(9,9,11,0.92)"
          borderBottom="1px solid"
          borderBottomColor="rgba(255,255,255,0.06)"
          backdropFilter="blur(12px)"
          position="sticky"
          top="0"
          zIndex={5}
        >
          <Text
            fontFamily="body"
            color="muted"
            fontSize="xs"
            letterSpacing="0.06em"
            textTransform="uppercase"
          >
            Speedy Van · Driver
          </Text>
          <HStack gap="3">
            <Box
              w="8"
              h="8"
              rounded="full"
              bg="rgba(212,175,55,0.15)"
              border="1.5px solid"
              borderColor="gold"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontFamily="heading"
              fontWeight="700"
              color="gold"
              fontSize="xs"
            >
              {name.charAt(0).toUpperCase()}
            </Box>
            <Text
              fontFamily="body"
              color="pearl"
              fontSize="sm"
              fontWeight="500"
              display={{ base: "none", sm: "block" }}
            >
              {name}
            </Text>
          </HStack>
        </HStack>

        <Box flex="1" p={{ base: "4", md: "6" }} overflowY="auto">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
