"use client";

import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { HiPlus } from "react-icons/hi2";
import { easeOutExpo, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface QA {
  q: string;
  a: string;
}

const FAQS: QA[] = [
  {
    q: "How quickly can you arrive?",
    a: "Same-day moves are available across the Central Belt when booked before midday. For other regions and weekends we recommend booking 24–48 hours ahead to lock in your preferred slot.",
  },
  {
    q: "Is the price I see the price I pay?",
    a: "Yes. Once your quote is confirmed, the price is fixed. No fuel surcharges, no surprise hourly fees, no extras for stairs or distance — provided what you book matches what we move.",
  },
  {
    q: "Are my belongings insured?",
    a: "Every move is covered by Goods in Transit insurance up to the limit of your selected van class. We also carry full Public Liability cover.",
  },
  {
    q: "Do you provide packing materials and help?",
    a: "We offer optional professional packing as an add-on. Blankets, straps, and trolleys come standard with every booking.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major debit and credit cards through Stripe, plus Apple Pay and Google Pay. Payment is taken securely at booking.",
  },
  {
    q: "Can I reschedule or cancel?",
    a: "Free rescheduling up to 24 hours before your slot. Cancellations within 24 hours may incur a small driver fee — full details are in your booking confirmation.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <chakra.section bg="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="3xl">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          textAlign="center"
          mb={{ base: "12", md: "14" }}
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
            Frequently Asked
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontWeight="700"
            color="ink"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "5xl" }}
          >
            The details, answered.
          </Heading>
        </MotionBox>

        <Stack gap="3">
          {FAQS.map((item, i) => {
            const open = openIndex === i;
            return (
              <Box
                key={item.q}
                bg="surface"
                rounded="lg"
                border="1px solid"
                borderColor={open ? "gold" : "rgba(0,0,0,0.06)"}
                transition="border-color 200ms"
                overflow="hidden"
              >
                <chakra.button
                  w="full"
                  textAlign="left"
                  p={{ base: "5", md: "6" }}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="4"
                  bg="transparent"
                  cursor="pointer"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                >
                  <Text
                    fontFamily="heading"
                    fontWeight="600"
                    color="ink"
                    fontSize={{ base: "md", md: "lg" }}
                  >
                    {item.q}
                  </Text>
                  <MotionBox
                    color={open ? "gold" : "muted"}
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.3, ease: easeOutExpo }}
                    flexShrink={0}
                  >
                    <HiPlus size={22} />
                  </MotionBox>
                </chakra.button>
                <AnimatePresence initial={false}>
                  {open && (
                    <MotionBox
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: easeOutExpo }}
                      style={{ overflow: "hidden" }}
                    >
                      <Box px={{ base: "5", md: "6" }} pb={{ base: "5", md: "6" }} pt="0">
                        <Text
                          fontFamily="body"
                          color="muted"
                          fontSize="md"
                          lineHeight="1.7"
                        >
                          {item.a}
                        </Text>
                      </Box>
                    </MotionBox>
                  )}
                </AnimatePresence>
              </Box>
            );
          })}
        </Stack>
      </Container>
    </chakra.section>
  );
}
