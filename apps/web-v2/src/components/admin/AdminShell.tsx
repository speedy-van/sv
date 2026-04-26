"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Flex, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { getMe, type AdminUser } from "@/lib/admin-api";

const TITLES: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/bookings": "Bookings",
  "/admin/drivers": "Drivers",
  "/admin/analytics": "Analytics",
  "/admin/dispatch": "Dispatch",
  "/admin/customers": "Customers",
};

function getPageTitle(path: string): string {
  const exact = TITLES[path];
  if (exact) return exact;
  const partial = Object.entries(TITLES).find(
    ([k]) => k !== "/admin" && path.startsWith(k),
  );
  return partial ? partial[1] : "Admin";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [status, setStatus] = useState<"loading" | "ok" | "denied">("loading");
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    getMe()
      .then((data) => {
        if (data.isAdmin) {
          setUser(data.user);
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
            Verifying credentials…
          </Text>
        </Stack>
      </Box>
    );
  }

  if (status !== "ok") return null;

  const title = getPageTitle(path);

  return (
    <Flex bg="obsidian" minH="100vh" color="pearl">
      <AdminSidebar />

      {/* Content column */}
      <Box
        flex="1"
        ml={{ base: 0, lg: "240px" }}
        display="flex"
        flexDirection="column"
      >
        {/* Top bar */}
        <HStack
          as="header"
          px={{ base: "5", md: "8" }}
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
            fontFamily="heading"
            fontWeight="700"
            color="pearl"
            fontSize="xl"
            letterSpacing="-0.01em"
          >
            {title}
          </Text>

          {user && (
            <HStack gap="3" align="center">
              <Stack gap="0" textAlign="right" display={{ base: "none", sm: "flex" }}>
                <Text fontFamily="body" color="pearl" fontSize="sm" fontWeight="500">
                  {user.name}
                </Text>
                <Text fontFamily="body" color="muted" fontSize="xs">
                  {user.adminRole ?? user.role}
                </Text>
              </Stack>
              <Box
                w="9"
                h="9"
                rounded="full"
                bg="rgba(212,175,55,0.18)"
                border="1.5px solid"
                borderColor="gold"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontFamily="heading"
                fontWeight="700"
                color="gold"
                fontSize="sm"
              >
                {user.name.charAt(0).toUpperCase()}
              </Box>
            </HStack>
          )}
        </HStack>

        {/* Page content */}
        <Box
          flex="1"
          p={{ base: "5", md: "8" }}
          overflowY="auto"
        >
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
