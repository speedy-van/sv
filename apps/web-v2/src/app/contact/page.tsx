import type { Metadata } from "next";
import { Box, Container, Heading, Link as ChakraLink, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { HiPhone, HiEnvelope, HiMapPin } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa";
import { ClientShell } from "@/components/layout/ClientShell";
import { PageHero } from "@/components/layout/PageHero";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Speak to a human at Speedy Van. Call, WhatsApp, email, or visit our Hamilton office. We reply fast and we never use call queues.",
  alternates: { canonical: "/contact" },
};

interface Channel {
  Icon: React.ComponentType<{ size?: number }>;
  title: string;
  body: string;
  href?: string;
  note?: string;
  external?: boolean;
}

const CHANNELS: Channel[] = [
  {
    Icon: HiPhone,
    title: "Call us",
    body: SITE.phone.display,
    href: SITE.phone.href,
    note: "Mon–Sun · 7am–9pm",
  },
  {
    Icon: FaWhatsapp,
    title: "WhatsApp",
    body: SITE.whatsapp.display,
    href: SITE.whatsapp.href,
    note: "Reply within minutes",
    external: true,
  },
  {
    Icon: HiEnvelope,
    title: "Email",
    body: SITE.email,
    href: `mailto:${SITE.email}`,
    note: "Reply within 1 hour",
  },
  {
    Icon: HiMapPin,
    title: "Office",
    body: SITE.address,
    note: "Hamilton, South Lanarkshire",
  },
];

function ChannelCard({ channel }: { channel: Channel }) {
  const Icon = channel.Icon;
  const inner = (
    <Stack gap="4" h="full">
      <Box
        w="48px"
        h="48px"
        rounded="md"
        bg="rgba(212,175,55,0.12)"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        color="gold"
      >
        <Icon size={22} />
      </Box>
      <Stack gap="1">
        <Heading as="h3" fontFamily="heading" fontWeight="600" color="ink" fontSize="lg">
          {channel.title}
        </Heading>
        <Text fontFamily="body" color="ink" fontSize="md">
          {channel.body}
        </Text>
        {channel.note && (
          <Text fontFamily="body" color="muted" fontSize="sm">
            {channel.note}
          </Text>
        )}
      </Stack>
    </Stack>
  );

  const cardStyles = {
    bg: "surface",
    rounded: "lg",
    border: "1px solid",
    borderColor: "rgba(0,0,0,0.06)",
    p: { base: "6", md: "7" },
    boxShadow: "sm",
    h: "full",
  } as const;

  if (channel.href) {
    return (
      <ChakraLink
        href={channel.href}
        target={channel.external ? "_blank" : undefined}
        rel={channel.external ? "noopener noreferrer" : undefined}
        display="block"
        textDecoration="none"
        transition="all 250ms"
        _hover={{
          textDecoration: "none",
          borderColor: "gold",
          transform: "translateY(-2px)",
          boxShadow: "lg",
        }}
        {...cardStyles}
      >
        {inner}
      </ChakraLink>
    );
  }
  return <Box {...cardStyles}>{inner}</Box>;
}

export default function ContactPage() {
  return (
    <ClientShell>
      <PageHero
        eyebrow="Contact"
        title="Talk to a real person."
        subtitle="No call queues, no scripts. Just thoughtful answers from a small team that actually moves things for a living."
      />
      <Box bg="pearl" py={{ base: "20", md: "28" }}>
        <Container maxW="5xl">
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
            {CHANNELS.map((c) => (
              <ChannelCard key={c.title} channel={c} />
            ))}
          </SimpleGrid>
        </Container>
      </Box>
    </ClientShell>
  );
}
