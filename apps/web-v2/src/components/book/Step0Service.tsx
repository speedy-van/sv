"use client";

import {
  Box,
  Heading,
  HStack,
  IconButton,
  NativeSelect,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { HiCheck, HiMinus, HiPlus } from "react-icons/hi2";
import type { BookingState } from "@/lib/booking-types";

const MotionBox = motion.create(chakra.div);

interface ServiceCard {
  id: NonNullable<BookingState["serviceCategory"]>;
  title: string;
  sub: string;
  fromPrice: string;
  gradient: string;
  icon: string;
  variants?: Array<{ value: string; label: string }>;
  variantLabel?: string;
}

const SERVICE_CARDS: ServiceCard[] = [
  {
    id: "house-removals",
    title: "House Removals",
    sub: "Whole-home moves, blanket-wrap, full crew.",
    fromPrice: "from £120",
    gradient: "linear-gradient(135deg, rgba(212,175,55,0.20), rgba(212,175,55,0.06))",
    icon: "🏠",
    variantLabel: "Property size",
    variants: [
      { value: "studio", label: "Studio" },
      { value: "1bed", label: "1 Bedroom" },
      { value: "2bed", label: "2 Bedroom" },
      { value: "3bed", label: "3 Bedroom" },
      { value: "4bed", label: "4 Bedroom" },
      { value: "5bed_plus", label: "5+ Bedroom" },
    ],
  },
  {
    id: "office-relocation",
    title: "Office Relocation",
    sub: "After-hours, IT-aware, business-grade.",
    fromPrice: "from £180",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.04))",
    icon: "🏢",
    variantLabel: "Office size",
    variants: [
      { value: "small-office", label: "Small (2–5 desks)" },
      { value: "mid-office", label: "Mid (6–15 desks)" },
      { value: "large-office", label: "Large (16+ desks)" },
    ],
  },
  {
    id: "man-and-van",
    title: "Man & Van",
    sub: "One driver, one van, hourly slots.",
    fromPrice: "from £45",
    gradient: "linear-gradient(135deg, rgba(5,150,105,0.18), rgba(5,150,105,0.04))",
    icon: "🚐",
  },
  {
    id: "single-item",
    title: "Single Item",
    sub: "Sofa, fridge, wardrobe — one piece, properly.",
    fromPrice: "from £55",
    gradient: "linear-gradient(135deg, rgba(220,38,38,0.16), rgba(220,38,38,0.04))",
    icon: "🛋️",
  },
  {
    id: "student-moves",
    title: "Student Moves",
    sub: "Hall to flat, term-time friendly.",
    fromPrice: "from £65",
    gradient: "linear-gradient(135deg, rgba(14,165,233,0.18), rgba(14,165,233,0.04))",
    icon: "🎓",
    variantLabel: "Move type",
    variants: [
      { value: "hall-to-hall", label: "Hall → Hall" },
      { value: "hall-to-flat", label: "Hall → Flat" },
      { value: "flat-to-flat", label: "Flat → Flat" },
    ],
  },
  {
    id: "european-removals",
    title: "European Removals",
    sub: "20+ countries, customs-handled.",
    fromPrice: "enquiry",
    gradient: "linear-gradient(135deg, rgba(212,175,55,0.20), rgba(99,102,241,0.10))",
    icon: "🌍",
  },
];

interface Step0Props {
  state: BookingState;
  set: (next: Partial<BookingState>) => void;
}

export function Step0Service({ state, set }: Step0Props) {
  const selected = SERVICE_CARDS.find((s) => s.id === state.serviceCategory);
  const helpers = state.helpers ?? 2;

  return (
    <Stack gap={{ base: "10", md: "12" }}>
      <Stack gap="2">
        <Text color="gold" fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase">
          Step 1 of 4
        </Text>
        <Heading
          as="h2"
          fontFamily="heading"
          fontWeight="700"
          color="pearl"
          fontSize={{ base: "2xl", md: "3xl" }}
          letterSpacing="-0.02em"
        >
          What kind of move?
        </Heading>
        <Text fontFamily="body" color="muted" fontSize="sm">
          Pick a service. We&apos;ll tailor the rest of the flow around it.
        </Text>
      </Stack>

      <SimpleGrid columns={{ base: 2, md: 3 }} gap={{ base: "3", md: "4" }}>
        {SERVICE_CARDS.map((card) => {
          const active = state.serviceCategory === card.id;
          return (
            <MotionBox
              key={card.id}
              onClick={() => {
                const variant = card.variants?.[0]?.value;
                set({ serviceCategory: card.id, serviceVariant: variant });
              }}
              cursor="pointer"
              position="relative"
              bg={card.gradient}
              border="1px solid"
              borderColor={active ? "gold" : "glassBorder"}
              rounded="xl"
              p={{ base: "4", md: "5" }}
              minH={{ base: "150px", md: "180px" }}
              overflow="hidden"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              boxShadow={active ? "goldGlow" : undefined}
            >
              {active && (
                <Box
                  position="absolute"
                  top="3"
                  right="3"
                  w="6"
                  h="6"
                  rounded="full"
                  bg="gold"
                  color="obsidian"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <HiCheck size={14} />
                </Box>
              )}
              <Stack gap="3" h="full" justify="space-between">
                <Text fontSize={{ base: "3xl", md: "4xl" }} lineHeight="1">
                  {card.icon}
                </Text>
                <Stack gap="1">
                  <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize={{ base: "md", md: "lg" }}>
                    {card.title}
                  </Text>
                  <Text fontFamily="body" color="muted" fontSize="xs" lineHeight="1.4">
                    {card.sub}
                  </Text>
                  <Text fontFamily="heading" color="gold" fontSize="xs" fontWeight="600" letterSpacing="0.04em" textTransform="uppercase" mt="1">
                    {card.fromPrice}
                  </Text>
                </Stack>
              </Stack>
            </MotionBox>
          );
        })}
      </SimpleGrid>

      {/* Variant selector */}
      {selected?.variants && (
        <Stack gap="2">
          <Text color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            {selected.variantLabel}
          </Text>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={state.serviceVariant || selected.variants[0].value}
              onChange={(e) => set({ serviceVariant: e.target.value })}
              bg="rgba(255,255,255,0.06)"
              border="1px solid"
              borderColor="glassBorder"
              color="pearl"
              h="12"
              rounded="md"
              _focus={{ borderColor: "gold" }}
            >
              {selected.variants.map((v) => (
                <option key={v.value} value={v.value} style={{ background: "#09090B" }}>
                  {v.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator color="gold" />
          </NativeSelect.Root>
        </Stack>
      )}

      {/* Helpers */}
      {state.serviceCategory && state.serviceCategory !== "european-removals" && (
        <Stack gap="3">
          <Text color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Crew size
          </Text>
          <HStack
            bg="rgba(255,255,255,0.04)"
            border="1px solid"
            borderColor="glassBorder"
            rounded="full"
            p="2"
            justify="space-between"
            maxW="sm"
          >
            <IconButton
              aria-label="Fewer helpers"
              onClick={() => set({ helpers: Math.max(0, helpers - 1) as BookingState["helpers"] })}
              variant="ghost"
              color="pearl"
              rounded="full"
              size="sm"
              _hover={{ bg: "rgba(212,175,55,0.12)", color: "gold" }}
              disabled={helpers <= 0}
            >
              <HiMinus />
            </IconButton>
            <Stack gap="0" align="center">
              <Text fontFamily="heading" fontWeight="700" color="gold" fontSize="2xl" lineHeight="1">
                {helpers}
              </Text>
              <Text fontFamily="body" color="muted" fontSize="xs">
                {helpers === 1 ? "helper" : "helpers"}
              </Text>
            </Stack>
            <IconButton
              aria-label="More helpers"
              onClick={() => set({ helpers: Math.min(4, helpers + 1) as BookingState["helpers"] })}
              variant="ghost"
              color="pearl"
              rounded="full"
              size="sm"
              _hover={{ bg: "rgba(212,175,55,0.12)", color: "gold" }}
              disabled={helpers >= 4}
            >
              <HiPlus />
            </IconButton>
          </HStack>
        </Stack>
      )}

      {/* Add-ons */}
      {state.serviceCategory && state.serviceCategory !== "european-removals" && (
        <Stack gap="3">
          <Text color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
            Add-ons
          </Text>
          <Stack gap="3">
            <ToggleRow
              label="Packing service"
              sub="We bring the boxes, paper, and tape."
              checked={!!state.addPacking}
              onChange={(v) => set({ addPacking: v })}
            />
            <ToggleRow
              label="Assembly / disassembly"
              sub="Beds, wardrobes, dining tables."
              checked={!!state.addAssembly}
              onChange={(v) => set({ addAssembly: v })}
            />
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}

function ToggleRow({
  label,
  sub,
  checked,
  onChange,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <HStack
      bg="rgba(255,255,255,0.04)"
      border="1px solid"
      borderColor={checked ? "gold" : "glassBorder"}
      rounded="lg"
      p="4"
      justify="space-between"
      transition="border 200ms"
    >
      <Stack gap="0.5">
        <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="sm">
          {label}
        </Text>
        <Text fontFamily="body" color="muted" fontSize="xs">
          {sub}
        </Text>
      </Stack>
      <Switch.Root
        checked={checked}
        onCheckedChange={(e) => onChange(!!e.checked)}
        size="md"
      >
        <Switch.HiddenInput />
        <Switch.Control bg={checked ? "gold" : "rgba(255,255,255,0.12)"}>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </HStack>
  );
}
