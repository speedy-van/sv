"use client";

import { Box, HStack, SimpleGrid, Stack, Text, chakra } from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { BookingState } from "@/lib/booking-types";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface DayCell {
  date: Date;
  iso: string;
  cheapest: number; // numeric £
  tier: "cheap" | "average" | "peak";
}

interface AirlineCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (iso: string) => void;
  selectedSlot: BookingState["timeSlot"];
  onSlotChange: (slot: BookingState["timeSlot"]) => void;
  basePrice?: number; // estimated quote total to seed pricing
}

const TIME_SLOTS: Array<{ value: BookingState["timeSlot"]; label: string; sub: string; multiplier: number }> = [
  { value: "morning", label: "Morning", sub: "8am – 12pm", multiplier: 1.05 },
  { value: "afternoon", label: "Afternoon", sub: "12pm – 5pm", multiplier: 1.0 },
  { value: "evening", label: "Evening", sub: "5pm – 9pm", multiplier: 1.10 },
];

function dayPrice(date: Date, base: number): number {
  // deterministic pseudo-random by day of year so it's stable for the user
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const dow = date.getDay(); // 0 Sun, 6 Sat
  const weekendBoost = dow === 5 || dow === 6 ? 1.18 : dow === 0 ? 1.10 : 1.0;
  const noise = ((dayOfYear * 9301 + 49297) % 233280) / 233280; // 0..1
  const variance = 0.85 + noise * 0.4; // 0.85..1.25
  return Math.round(base * weekendBoost * variance);
}

function tierFor(price: number, min: number, max: number): DayCell["tier"] {
  if (max === min) return "average";
  const t = (price - min) / (max - min);
  if (t <= 0.33) return "cheap";
  if (t <= 0.66) return "average";
  return "peak";
}

function fmt(n: number) {
  return `£${n}`;
}

const TIER_COLOUR: Record<DayCell["tier"], string> = {
  cheap: "#059669",
  average: "#D4AF37",
  peak: "#DC2626",
};

const TIER_LABEL: Record<DayCell["tier"], string> = {
  cheap: "Cheapest",
  average: "Average",
  peak: "Peak",
};

export function AirlineCalendar({
  selectedDate,
  onDateChange,
  selectedSlot,
  onSlotChange,
  basePrice = 220,
}: AirlineCalendarProps) {
  const [animatedTotal, setAnimatedTotal] = useState<number | null>(null);

  const days: DayCell[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() + 1); // tomorrow onwards
    const raw: { date: Date; iso: string; price: number }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      raw.push({ date: d, iso: d.toISOString().slice(0, 10), price: dayPrice(d, basePrice) });
    }
    const min = Math.min(...raw.map((r) => r.price));
    const max = Math.max(...raw.map((r) => r.price));
    return raw.map((r) => ({ date: r.date, iso: r.iso, cheapest: r.price, tier: tierFor(r.price, min, max) }));
  }, [basePrice]);

  const selectedDay = days.find((d) => d.iso === selectedDate);

  const slotPrice = (slotMultiplier: number) => Math.round((selectedDay?.cheapest ?? basePrice) * slotMultiplier);

  const cheapestSlotMultiplier = useMemo(() => {
    return TIME_SLOTS.reduce((best, s) => (s.multiplier < best ? s.multiplier : best), TIME_SLOTS[0].multiplier);
  }, []);

  // Count-up animation for total
  useEffect(() => {
    if (!selectedDay || !selectedSlot || selectedSlot === "flexible") {
      setAnimatedTotal(null);
      return;
    }
    const target = slotPrice(TIME_SLOTS.find((s) => s.value === selectedSlot)?.multiplier ?? 1);
    let raf = 0;
    const start = performance.now();
    const startVal = animatedTotal ?? Math.round(target * 0.6);
    const dur = 600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedTotal(Math.round(startVal + (target - startVal) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot, selectedDay?.iso]);

  const todayIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);
  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);

  return (
    <Stack gap="6">
      {/* WHITE calendar card on light surface */}
      <Box
        bg="surface"
        rounded="xl"
        border="1px solid"
        borderColor="rgba(0,0,0,0.06)"
        boxShadow="0 12px 36px rgba(9,9,11,0.18)"
        p={{ base: "5", md: "6" }}
      >
        <HStack justify="space-between" align="baseline" mb="5">
          <Stack gap="0.5">
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase" color="gold" fontWeight="600">
              Pick a date
            </Text>
            <Text fontFamily="heading" fontWeight="700" color="ink" fontSize="lg" letterSpacing="-0.01em">
              Next 14 days
            </Text>
          </Stack>
          <HStack gap="3">
            {(["cheap", "average", "peak"] as const).map((t) => (
              <HStack key={t} gap="1.5">
                <Box w="8px" h="8px" rounded="full" bg={TIER_COLOUR[t]} />
                <Text fontFamily="body" fontSize="xs" color="muted">
                  {TIER_LABEL[t]}
                </Text>
              </HStack>
            ))}
          </HStack>
        </HStack>

        <SimpleGrid columns={7} gap={{ base: "1.5", md: "2" }}>
          {days.map((day) => {
            const active = day.iso === selectedDate;
            const isToday = day.iso === todayIso;
            const isTomorrow = day.iso === tomorrowIso;
            return (
              <MotionBox
                key={day.iso}
                onClick={() => onDateChange(day.iso)}
                cursor="pointer"
                position="relative"
                bg={active ? "rgba(212,175,55,0.10)" : "rgba(9,9,11,0.02)"}
                border="2px solid"
                borderColor={active ? "gold" : "transparent"}
                rounded="lg"
                p={{ base: "1.5", md: "2.5" }}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                boxShadow={active ? "0 0 0 1px rgba(212,175,55,0.4)" : undefined}
              >
                <Stack gap="1" align="center">
                  <Text fontFamily="body" color="muted" fontSize="2xs" textTransform="uppercase" letterSpacing="0.08em">
                    {day.date.toLocaleDateString("en-GB", { weekday: "short" })}
                  </Text>
                  <Text fontFamily="heading" fontWeight="700" color="ink" fontSize={{ base: "lg", md: "xl" }} lineHeight="1">
                    {day.date.getDate()}
                  </Text>
                  <HStack gap="1" align="center">
                    <Box w="6px" h="6px" rounded="full" bg={TIER_COLOUR[day.tier]} />
                    <Text fontFamily="heading" color={active ? "gold" : "ink"} fontSize="xs" fontWeight="600">
                      {fmt(day.cheapest)}
                    </Text>
                  </HStack>
                  {(isToday || isTomorrow) && (
                    <Text
                      fontFamily="heading"
                      fontSize="2xs"
                      fontWeight="700"
                      letterSpacing="0.08em"
                      color="gold"
                      textTransform="uppercase"
                    >
                      {isToday ? "TMRW" : "+2"}
                    </Text>
                  )}
                </Stack>
              </MotionBox>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Time slots */}
      <AnimatePresence>
        {selectedDay && (
          <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: easeOutExpo }}
          >
            <Stack gap="3">
              <Text color="muted" fontSize="xs" fontWeight="500" letterSpacing="0.06em" textTransform="uppercase">
                Time window for{" "}
                {selectedDay.date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap="3">
                {TIME_SLOTS.map((slot) => {
                  const active = selectedSlot === slot.value;
                  const isCheapest = slot.multiplier === cheapestSlotMultiplier;
                  const price = slotPrice(slot.multiplier);
                  return (
                    <MotionBox
                      key={slot.value}
                      onClick={() => onSlotChange(slot.value)}
                      cursor="pointer"
                      bg={active ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.04)"}
                      border="1px solid"
                      borderColor={active ? "gold" : "glassBorder"}
                      rounded="lg"
                      p="4"
                      position="relative"
                      whileTap={{ scale: 0.98 }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      boxShadow={active ? "goldGlow" : undefined}
                    >
                      {isCheapest && (
                        <Box
                          position="absolute"
                          top="-10px"
                          left="50%"
                          transform="translateX(-50%)"
                          bg="gold"
                          color="obsidian"
                          fontFamily="heading"
                          fontSize="2xs"
                          fontWeight="700"
                          letterSpacing="0.12em"
                          textTransform="uppercase"
                          px="2.5"
                          py="1"
                          rounded="full"
                          boxShadow="goldGlow"
                        >
                          Best Value
                        </Box>
                      )}
                      <HStack justify="space-between" align="baseline">
                        <Stack gap="0.5">
                          <Text fontFamily="heading" fontWeight="700" color="pearl" fontSize="md">
                            {slot.label}
                          </Text>
                          <Text fontFamily="body" color="muted" fontSize="xs">
                            {slot.sub}
                          </Text>
                        </Stack>
                        <Text fontFamily="heading" color="gold" fontWeight="700" fontSize="lg">
                          {fmt(price)}
                        </Text>
                      </HStack>
                    </MotionBox>
                  );
                })}
              </SimpleGrid>
            </Stack>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Total */}
      <AnimatePresence>
        {animatedTotal !== null && (
          <MotionBox
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            bg="glass"
            border="1px solid"
            borderColor="gold"
            rounded="xl"
            backdropFilter="blur(12px)"
            style={{ WebkitBackdropFilter: "blur(12px)" }}
            p="5"
          >
            <HStack justify="space-between" align="baseline">
              <Stack gap="0.5">
                <Text fontFamily="heading" fontSize="xs" letterSpacing="0.32em" textTransform="uppercase" color="gold" fontWeight="600">
                  Estimated total
                </Text>
                <Text fontFamily="body" color="muted" fontSize="xs">
                  Final price confirmed at next step.
                </Text>
              </Stack>
              <chakra.div
                fontFamily="heading"
                fontWeight="800"
                color="gold"
                fontSize={{ base: "3xl", md: "4xl" }}
                letterSpacing="-0.02em"
              >
                £{animatedTotal}
              </chakra.div>
            </HStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Stack>
  );
}
