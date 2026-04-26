"use client";

import {
  Box,
  Container,
  Flex,
  HStack,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { FaFacebookF, FaInstagram, FaTiktok, FaApple } from "react-icons/fa6";
import { Logo } from "@/components/ui/Logo";
import { NAV_LINKS, SITE } from "@/lib/site";

const SERVICES = [
  { label: "House Removals", href: "/services/house-removals" },
  { label: "Office Relocation", href: "/services/office-relocation" },
  { label: "Furniture Delivery", href: "/services/furniture-delivery" },
  { label: "Single Item Move", href: "/services/single-item" },
  { label: "Student Moves", href: "/services/student-moves" },
];

const AREAS = [
  { label: "Glasgow", href: "/areas/glasgow" },
  { label: "Edinburgh", href: "/areas/edinburgh" },
  { label: "Dundee", href: "/areas/dundee" },
  { label: "Aberdeen", href: "/areas/aberdeen" },
  { label: "Stirling", href: "/areas/stirling" },
];

const SOCIAL = [
  { Icon: FaInstagram, href: SITE.social.instagram, label: "Instagram" },
  { Icon: FaFacebookF, href: SITE.social.facebook, label: "Facebook" },
  { Icon: FaTiktok, href: SITE.social.tiktok, label: "TikTok" },
];

export function Footer() {
  return (
    <chakra.footer bg="obsidian" color="pearl" pt="20" pb="8" position="relative">
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="1px"
        bgGradient="linear(to-r, transparent, gold, transparent)"
        opacity="0.4"
      />
      <Container maxW="7xl">
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="12" mb="14">
          <Stack gap="5">
            <Logo variant="gold" size="md" />
            <Text color="muted" fontSize="sm" maxW="280px" lineHeight="1.7">
              {SITE.tagline}
              <br />
              Premium removals and trusted moves across Scotland.
            </Text>
            <HStack gap="3">
              {SOCIAL.map(({ Icon, href, label }) => (
                <chakra.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  w="9"
                  h="9"
                  rounded="full"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  bg="glass"
                  border="1px solid"
                  borderColor="glassBorder"
                  color="muted"
                  transition="all 200ms"
                  _hover={{ color: "gold", borderColor: "gold" }}
                >
                  <Icon size={14} />
                </chakra.a>
              ))}
            </HStack>
            <chakra.a
              href={SITE.ios}
              target="_blank"
              rel="noopener noreferrer"
              display="inline-flex"
              alignItems="center"
              gap="2"
              mt="2"
              px="4"
              h="11"
              rounded="full"
              border="1px solid"
              borderColor="glassBorder"
              color="pearl"
              fontFamily="body"
              fontSize="sm"
              transition="all 200ms"
              _hover={{ borderColor: "gold", color: "gold" }}
              w="fit-content"
            >
              <FaApple size={18} /> Get the iOS app
            </chakra.a>
          </Stack>

          <FooterColumn title="Services" links={SERVICES} />
          <FooterColumn title="Areas" links={AREAS} />

          <Stack gap="4">
            <Heading
              as="h4"
              fontFamily="heading"
              fontSize="sm"
              fontWeight="600"
              color="gold"
              letterSpacing="0.12em"
              textTransform="uppercase"
            >
              Contact
            </Heading>
            <Stack gap="2" fontFamily="body" fontSize="sm" color="muted">
              <chakra.a
                href={SITE.phone.href}
                _hover={{ color: "gold" }}
                transition="color 200ms"
              >
                {SITE.phone.display}
              </chakra.a>
              <chakra.a
                href={SITE.whatsapp.href}
                target="_blank"
                rel="noopener noreferrer"
                _hover={{ color: "gold" }}
                transition="color 200ms"
              >
                WhatsApp · {SITE.whatsapp.display}
              </chakra.a>
              <chakra.a
                href={`mailto:${SITE.email}`}
                _hover={{ color: "gold" }}
                transition="color 200ms"
              >
                {SITE.email}
              </chakra.a>
              <Text mt="2" lineHeight="1.7">
                {SITE.address}
              </Text>
            </Stack>
            {NAV_LINKS.length > 0 && null}
          </Stack>
        </SimpleGrid>

        <Flex
          pt="6"
          borderTop="1px solid"
          borderColor="glassBorder"
          direction={{ base: "column", md: "row" }}
          gap="3"
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          fontFamily="body"
          fontSize="xs"
          color="muted"
        >
          <Text>© {new Date().getFullYear()} Speedy Van Ltd. All rights reserved.</Text>
          <HStack gap="6">
            <Link href="/privacy">
              <chakra.span _hover={{ color: "gold" }}>Privacy</chakra.span>
            </Link>
            <Link href="/terms">
              <chakra.span _hover={{ color: "gold" }}>Terms</chakra.span>
            </Link>
            <Link href="/contact">
              <chakra.span _hover={{ color: "gold" }}>Contact</chakra.span>
            </Link>
          </HStack>
        </Flex>
      </Container>
    </chakra.footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <Stack gap="4">
      <Heading
        as="h4"
        fontFamily="heading"
        fontSize="sm"
        fontWeight="600"
        color="gold"
        letterSpacing="0.12em"
        textTransform="uppercase"
      >
        {title}
      </Heading>
      <Stack gap="2" fontFamily="body" fontSize="sm" color="muted">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <chakra.span
              transition="color 200ms"
              _hover={{ color: "gold" }}
            >
              {l.label}
            </chakra.span>
          </Link>
        ))}
      </Stack>
    </Stack>
  );
}
