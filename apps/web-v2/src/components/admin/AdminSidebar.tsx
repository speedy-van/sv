"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import {
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentList,
  HiOutlineTruck,
  HiOutlineChartBarSquare,
  HiOutlineMapPin,
  HiOutlineUsers,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";
import { Logo } from "@/components/ui/Logo";
import { SITE } from "@/lib/site";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: HiOutlineSquares2X2, exact: true },
  { href: "/admin/bookings", label: "Bookings", Icon: HiOutlineClipboardDocumentList },
  { href: "/admin/drivers", label: "Drivers", Icon: HiOutlineTruck },
  { href: "/admin/analytics", label: "Analytics", Icon: HiOutlineChartBarSquare },
  { href: "/admin/dispatch", label: "Dispatch", Icon: HiOutlineMapPin },
  { href: "/admin/customers", label: "Customers", Icon: HiOutlineUsers },
];

export function AdminSidebar() {
  const path = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? path === href : path.startsWith(href);
  }

  return (
    <Box
      as="nav"
      position="fixed"
      top="0"
      left="0"
      h="100vh"
      w="240px"
      bg="rgba(9,9,11,0.96)"
      borderRight="1px solid"
      borderRightColor="rgba(255,255,255,0.07)"
      backdropFilter="blur(16px)"
      display={{ base: "none", lg: "flex" }}
      flexDirection="column"
      zIndex={10}
    >
      {/* Logo */}
      <Box px="5" py="6" borderBottom="1px solid" borderBottomColor="rgba(255,255,255,0.06)">
        <Link href="/">
          <Logo variant="gold" size="sm" />
        </Link>
        <Text
          fontFamily="body"
          color="muted"
          fontSize="xs"
          mt="1.5"
          letterSpacing="0.04em"
        >
          Admin Console
        </Text>
      </Box>

      {/* Nav links */}
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
                    : { bg: "rgba(255,255,255,0.04)", borderLeftColor: "rgba(212,175,55,0.3)" }
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

      {/* Footer */}
      <Box px="3" py="5" borderTop="1px solid" borderTopColor="rgba(255,255,255,0.06)">
        <a
          href={`${SITE.url}/admin`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <HStack gap="3" px="3" py="2.5" rounded="md" cursor="pointer" _hover={{ bg: "rgba(255,255,255,0.04)" }}>
            <Box as={HiOutlineArrowRightOnRectangle} fontSize="17px" color="muted" />
            <Text fontFamily="body" fontSize="sm" color="muted">
              Classic portal
            </Text>
          </HStack>
        </a>
      </Box>
    </Box>
  );
}
