"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiCheck } from "react-icons/hi2";
import { easeOutExpo, staggerFast, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface Tier {
  name: string;
  vanType: string;
  price: string;
  bestFor: string;
  features: string[];
  popular?: boolean;
}

const TIERS: Tier[] = [
  {
    name: "Small",
    vanType: "Small Van",
    price: "£45",
    bestFor: "Single items & student moves",
    features: [
      "Up to 2 m³ capacity",
      "Driver included",
      "Insured to £10,000",
      "Same-day available",
    ],
  },
  {
    name: "Medium",
    vanType: "SWB Transit",
    price: "£75",
    bestFor: "1-bed flats & small moves",
    features: [
      "Up to 6 m³ capacity",
      "Driver + 1 helper option",
      "Full insurance £25,000",
      "Blankets & straps included",
    ],
    popular: true,
  },
  {
    name: "Large",
    vanType: "LWB Transit",
    price: "£120",
    bestFor: "2–3 bed homes",
    features: [
      "Up to 12 m³ capacity",
      "Driver + 1 helper",
      "Full insurance £50,000",
      "Disassembly support",
    ],
  },
  {
    name: "Luton",
    vanType: "Luton Van",
    price: "£180",
    bestFor: "Full house & office moves",
    features: [
      "Up to 18 m³ + tail lift",
      "Driver + 2 helpers",
      "Full insurance £75,000",
      "Packing service available",
    ],
  },
];

export function PricingSection() {
  return (
    <chakra.section id="pricing" bg="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="7xl">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          textAlign="center"
          mb={{ base: "12", md: "16" }}
        >
          <Text
            color="gold"
            fontFamily="heading"
            fontWeight="500"
            fontSize="sm"
            letterSpacing="0.32em"
            textTransform="uppercase"
            mb="3"
          >
            Transparent Pricing
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontWeight="700"
            color="ink"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "5xl" }}
            mb="4"
          >
            Fixed prices. No surprises.
          </Heading>
          <Text
            color="muted"
            fontFamily="body"
            fontSize={{ base: "md", md: "lg" }}
            maxW="2xl"
            mx="auto"
            lineHeight="1.7"
          >
            Pick the van that fits. We tell you the price upfront and we honour it.
          </Text>
        </MotionBox>

        <MotionBox
          variants={staggerFast}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={{ base: "5", md: "6" }}>
            {TIERS.map((t) => (
              <PricingCard key={t.name} tier={t} />
            ))}
          </SimpleGrid>
        </MotionBox>

        <Text
          textAlign="center"
          mt="10"
          color="muted"
          fontFamily="body"
          fontSize="sm"
        >
          Prices shown are starting points. Final price depends on distance, items, and
          access. Quote is fixed once confirmed — no hidden fees.
        </Text>
      </Container>
    </chakra.section>
  );
}

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <MotionBox
      variants={{
        hidden: { opacity: 0, y: 24 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.55, ease: easeOutExpo },
        },
      }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: easeOutExpo }}
      position="relative"
    >
      {tier.popular && (
        <Badge
          position="absolute"
          top="-3"
          right="6"
          bg="gold"
          color="obsidian"
          fontFamily="body"
          fontWeight="700"
          fontSize="xs"
          letterSpacing="0.08em"
          textTransform="uppercase"
          px="3"
          py="1.5"
          rounded="full"
          zIndex="1"
          boxShadow="md"
        >
          Most Popular
        </Badge>
      )}
      <Box
        bg="surface"
        rounded="lg"
        border="1px solid"
        borderColor={tier.popular ? "gold" : "rgba(0,0,0,0.06)"}
        borderTopWidth={tier.popular ? "3px" : "1px"}
        p={{ base: "6", md: "7" }}
        h="full"
        boxShadow={tier.popular ? "lg" : "md"}
        transition="all 300ms"
        _hover={{ boxShadow: "xl", borderColor: "gold" }}
      >
        <Stack gap="6" h="full">
          <Stack gap="1">
            <Text
              fontFamily="heading"
              fontWeight="600"
              color="ink"
              fontSize="xl"
            >
              {tier.name}
            </Text>
            <Text fontFamily="body" fontSize="sm" color="muted">
              {tier.vanType}
            </Text>
          </Stack>

          <Stack gap="0">
            <Text
              fontFamily="mono"
              color="gold"
              fontWeight="700"
              fontSize="5xl"
              letterSpacing="-0.03em"
              lineHeight="1"
            >
              {tier.price}
            </Text>
            <Text fontFamily="body" fontSize="xs" color="muted" mt="1">
              from · per booking
            </Text>
          </Stack>

          <Text fontFamily="body" fontSize="sm" color="ink" lineHeight="1.6">
            {tier.bestFor}
          </Text>

          <Stack gap="3" flex="1">
            {tier.features.map((f) => (
              <Text
                key={f}
                as="span"
                fontFamily="body"
                fontSize="sm"
                color="ink"
                display="flex"
                alignItems="flex-start"
                gap="2.5"
              >
                <Box as="span" color="gold" mt="0.5" flexShrink={0}>
                  <HiCheck size={16} />
                </Box>
                {f}
              </Text>
            ))}
          </Stack>

          <Link href="/book">
            <Button
              w="full"
              h="12"
              rounded="full"
              fontFamily="body"
              fontWeight="600"
              bg={tier.popular ? "gold" : "transparent"}
              color={tier.popular ? "obsidian" : "ink"}
              border={tier.popular ? "none" : "1.5px solid"}
              borderColor="ink"
              _hover={
                tier.popular
                  ? { bg: "goldSoft" }
                  : { bg: "ink", color: "pearl" }
              }
              _active={{ transform: "scale(0.97)" }}
              transition="all 200ms"
            >
              Book {tier.name}
            </Button>
          </Link>
        </Stack>
      </Box>
    </MotionBox>
  );
}
