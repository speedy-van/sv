"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Box,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import type { ReactNode } from "react";
import {
  HiOutlineHome,
  HiOutlineClipboardDocumentList,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { ClientShell } from "@/components/layout/ClientShell";

const NAV = [
  { href: "/customer", label: "Overview", Icon: HiOutlineHome, exact: true },
  { href: "/customer/bookings", label: "My Bookings", Icon: HiOutlineClipboardDocumentList },
  { href: "/customer/profile", label: "Profile", Icon: HiOutlineUserCircle },
];

const TITLES: Record<string, string> = {
  "/customer": "Welcome back",
  "/customer/bookings": "My Bookings",
  "/customer/profile": "Profile",
};

export function CustomerShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/customer";
  const title =
    TITLES[path] ||
    (Object.entries(TITLES).find(([k]) => k !== "/customer" && path.startsWith(k))?.[1] ?? "Account");

  return (
    <ClientShell>
      <Box bg="pearl" minH="100vh" pt={{ base: "24", md: "28" }} pb="16">
        <Container maxW="6xl">
          <Stack gap="6">
            <Stack gap="1">
              <Text
                color="gold"
                fontFamily="heading"
                fontWeight="500"
                fontSize="xs"
                letterSpacing="0.32em"
                textTransform="uppercase"
              >
                Customer Portal
              </Text>
              <chakra.h1
                fontFamily="heading"
                fontWeight="800"
                color="ink"
                fontSize={{ base: "3xl", md: "4xl" }}
                letterSpacing="-0.02em"
              >
                {title}
              </chakra.h1>
            </Stack>

            <Flex
              direction={{ base: "column", md: "row" }}
              gap={{ base: "4", md: "8" }}
              align="flex-start"
            >
              {/* Sidebar */}
              <Box
                as="nav"
                w={{ base: "full", md: "240px" }}
                flexShrink={0}
                bg="surface"
                border="1px solid"
                borderColor="rgba(9,9,11,0.08)"
                rounded="xl"
                p="3"
                position={{ md: "sticky" }}
                top={{ md: "100px" }}
              >
                <Stack gap="1">
                  {NAV.map(({ href, label, Icon, exact }) => {
                    const active = exact ? path === href : path.startsWith(href);
                    return (
                      <Link key={href} href={href} style={{ textDecoration: "none" }}>
                        <HStack
                          gap="3"
                          px="3"
                          py="2.5"
                          rounded="md"
                          bg={active ? "rgba(212,175,55,0.12)" : "transparent"}
                          borderLeft="2px solid"
                          borderLeftColor={active ? "gold" : "transparent"}
                          _hover={active ? {} : { bg: "rgba(9,9,11,0.04)" }}
                          transition="all 0.15s"
                          cursor="pointer"
                        >
                          <Box as={Icon} fontSize="17px" color={active ? "gold" : "muted"} />
                          <Text
                            fontFamily="body"
                            fontSize="sm"
                            fontWeight={active ? "600" : "500"}
                            color={active ? "ink" : "ink"}
                          >
                            {label}
                          </Text>
                        </HStack>
                      </Link>
                    );
                  })}
                </Stack>
                <Box mt="2" pt="2" borderTop="1px solid" borderTopColor="rgba(9,9,11,0.06)">
                  <Link href="/auth/login" style={{ textDecoration: "none" }}>
                    <HStack gap="3" px="3" py="2.5" rounded="md" cursor="pointer" _hover={{ bg: "rgba(9,9,11,0.04)" }}>
                      <Box as={HiOutlineArrowRightOnRectangle} fontSize="17px" color="muted" />
                      <Text fontFamily="body" fontSize="sm" color="muted">
                        Sign out
                      </Text>
                    </HStack>
                  </Link>
                </Box>
              </Box>

              {/* Main */}
              <Box flex="1" minW="0" w="full">
                {children}
              </Box>
            </Flex>
          </Stack>
        </Container>
      </Box>
    </ClientShell>
  );
}
