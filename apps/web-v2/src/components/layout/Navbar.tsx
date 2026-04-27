"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Stack,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { NAV_LINKS } from "@/lib/site";
import { easeOutExpo } from "@/lib/motion";

const MotionDiv = motion.create(chakra.div);
const MotionLi = motion.create(chakra.li);

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const has =
      !!sessionStorage.getItem("sv-auth-token") ||
      !!localStorage.getItem("sv-auth-token") ||
      document.cookie.includes("sv-auth-token=");
    setAuthed(has);
  }, [pathname]);

  const showBell =
    authed && (pathname?.startsWith("/admin") || pathname?.startsWith("/driver"));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <chakra.header
      position="fixed"
      top="0"
      left="0"
      right="0"
      zIndex="1000"
      transition="all 300ms ease"
      bg={scrolled ? "obsidian" : "rgba(9,9,11,0.20)"}
      borderBottom={scrolled ? "1px solid" : "1px solid transparent"}
      borderColor={scrolled ? "glassBorder" : "transparent"}
      backdropFilter={scrolled ? "blur(16px)" : "blur(8px)"}
      style={{ WebkitBackdropFilter: scrolled ? "blur(16px)" : "blur(8px)" }}
    >
      <Container maxW="7xl" py={{ base: "3", md: "4" }}>
        <Flex align="center" justify="space-between">
          <Logo variant="gold" size="md" />

          <HStack
            as="nav"
            gap="8"
            display={{ base: "none", lg: "flex" }}
            color="pearl"
            fontFamily="body"
            fontSize="sm"
            fontWeight="500"
          >
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Box key={link.href} position="relative">
                  <Link href={link.href}>
                    <chakra.span
                      color={active ? "gold" : "pearl"}
                      _hover={{ color: "gold" }}
                      transition="color 200ms"
                    >
                      {link.label}
                    </chakra.span>
                  </Link>
                  {active && (
                    <MotionDiv
                      layoutId="nav-underline"
                      position="absolute"
                      left="0"
                      right="0"
                      bottom="-6px"
                      height="2px"
                      bg="gold"
                      borderRadius="full"
                      transition={{ duration: 0.4, ease: easeOutExpo }}
                    />
                  )}
                </Box>
              );
            })}
          </HStack>

          <HStack gap="3" display={{ base: "none", md: "flex" }}>
            {showBell && <NotificationBell />}
            <Link href="/auth/login">
              <Button
                variant="ghost"
                color="pearl"
                _hover={{ color: "gold", bg: "transparent" }}
                fontFamily="body"
                fontWeight="500"
              >
                Login
              </Button>
            </Link>
            <Link href="/book">
              <Button
                bg="gold"
                color="obsidian"
                rounded="full"
                px="7"
                h="11"
                fontFamily="body"
                fontWeight="600"
                _hover={{ bg: "goldSoft", transform: "translateY(-1px)" }}
                _active={{ transform: "scale(0.97)" }}
                boxShadow="0 0 0 0 rgba(212,175,55,0.0)"
                transition="all 200ms"
              >
                ✨ Book Now
              </Button>
            </Link>
          </HStack>

          <HStack gap="2" display={{ base: "flex", lg: "none" }}>
            <Link href="/book">
              <Button
                bg="gold"
                color="obsidian"
                rounded="full"
                size="sm"
                fontWeight="600"
                display={{ base: "inline-flex", md: "none" }}
              >
                Book
              </Button>
            </Link>
            <IconButton
              aria-label={open ? "Close menu" : "Open menu"}
              variant="ghost"
              color="pearl"
              onClick={() => setOpen((v) => !v)}
              _hover={{ bg: "glass", color: "gold" }}
            >
              {open ? <HiXMark size={24} /> : <HiBars3 size={24} />}
            </IconButton>
          </HStack>
        </Flex>
      </Container>

      <AnimatePresence>
        {open && (
          <MotionDiv
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            bg="obsidian"
            zIndex="-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            display={{ base: "block", lg: "none" }}
            pt="20"
          >
            <Container maxW="7xl">
              <Stack as="ul" gap="6" listStyleType="none" py="12">
                {NAV_LINKS.map((link, i) => (
                  <MotionLi
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: easeOutExpo }}
                  >
                    <Link href={link.href}>
                      <chakra.span
                        fontFamily="heading"
                        fontWeight="600"
                        fontSize="3xl"
                        color={pathname === link.href ? "gold" : "pearl"}
                        _hover={{ color: "gold" }}
                      >
                        {link.label}
                      </chakra.span>
                    </Link>
                  </MotionLi>
                ))}
                <MotionLi
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * NAV_LINKS.length, duration: 0.4 }}
                >
                  <Link href="/auth/login">
                    <chakra.span
                      fontFamily="heading"
                      fontWeight="600"
                      fontSize="2xl"
                      color="muted"
                      _hover={{ color: "gold" }}
                    >
                      Login
                    </chakra.span>
                  </Link>
                </MotionLi>
              </Stack>
            </Container>
          </MotionDiv>
        )}
      </AnimatePresence>
    </chakra.header>
  );
}
