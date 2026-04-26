"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentList,
  HiOutlineTruck,
  HiOutlineCurrencyPound,
  HiOutlineUser,
} from "react-icons/hi2";
import { Logo } from "@/components/ui/Logo";

const NAV = [
  { href: "/driver", label: "Dashboard", Icon: HiOutlineSquares2X2, exact: true },
  { href: "/driver/jobs", label: "Jobs", Icon: HiOutlineClipboardDocumentList },
  { href: "/driver/active", label: "Active job", Icon: HiOutlineTruck },
  { href: "/driver/earnings", label: "Earnings", Icon: HiOutlineCurrencyPound },
  { href: "/driver/profile", label: "Profile", Icon: HiOutlineUser },
];

export function DriverNav() {
  const path = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <Box
        as="nav"
        position="fixed"
        top="0"
        left="0"
        h="100vh"
        w="220px"
        bg="rgba(9,9,11,0.97)"
        borderRight="1px solid"
        borderRightColor="rgba(255,255,255,0.07)"
        backdropFilter="blur(16px)"
        display={{ base: "none", lg: "flex" }}
        flexDirection="column"
        zIndex={10}
      >
        <Box
          px="5"
          py="6"
          borderBottom="1px solid"
          borderBottomColor="rgba(255,255,255,0.06)"
        >
          <Link href="/">
            <Logo variant="gold" size="sm" />
          </Link>
          <Text fontFamily="body" color="muted" fontSize="xs" mt="1.5" letterSpacing="0.04em">
            Driver Console
          </Text>
        </Box>

        <Stack gap="1" px="3" py="5" flex="1">
          {NAV.map(({ href, label, Icon, exact }) => {
            const active = isActive(href, exact);
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
                  _hover={
                    active
                      ? {}
                      : {
                          bg: "rgba(255,255,255,0.04)",
                          borderLeftColor: "rgba(212,175,55,0.3)",
                        }
                  }
                  transition="all 0.15s"
                  cursor="pointer"
                >
                  <Box
                    as={Icon}
                    fontSize="17px"
                    color={active ? "gold" : "muted"}
                    flexShrink={0}
                  />
                  <Text
                    fontFamily="body"
                    fontSize="sm"
                    fontWeight={active ? "600" : "400"}
                    color={active ? "gold" : "pearl"}
                  >
                    {label}
                  </Text>
                </HStack>
              </Link>
            );
          })}
        </Stack>
      </Box>

      {/* Mobile bottom bar */}
      <Box
        display={{ base: "flex", lg: "none" }}
        position="fixed"
        bottom="0"
        left="0"
        right="0"
        bg="rgba(9,9,11,0.96)"
        borderTop="1px solid"
        borderTopColor="rgba(255,255,255,0.07)"
        backdropFilter="blur(16px)"
        zIndex={10}
        px="2"
        py="2"
        justifyContent="space-around"
      >
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <Stack
                align="center"
                gap="0.5"
                px="3"
                py="1.5"
                rounded="md"
                bg={active ? "rgba(212,175,55,0.1)" : "transparent"}
              >
                <Box
                  as={Icon}
                  fontSize="20px"
                  color={active ? "gold" : "muted"}
                />
                <Text
                  fontFamily="body"
                  fontSize="10px"
                  color={active ? "gold" : "muted"}
                  fontWeight={active ? "600" : "400"}
                >
                  {label}
                </Text>
              </Stack>
            </Link>
          );
        })}
      </Box>
    </>
  );
}
