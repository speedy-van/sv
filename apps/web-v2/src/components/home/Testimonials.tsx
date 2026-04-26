"use client";

import {
  Box,
  Container,
  HStack,
  Heading,
  IconButton,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HiChevronLeft, HiChevronRight } from "react-icons/hi2";
import { easeOutExpo, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface Testimonial {
  quote: string;
  name: string;
  location: string;
  service: string;
  rating: 5;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Genuinely the most polished moving experience I've had. Driver arrived ten minutes early, treated every box like it was his own, and the price didn't shift by a penny.",
    name: "Sarah T.",
    location: "Glasgow West End",
    service: "House Removal",
    rating: 5,
  },
  {
    quote:
      "Booked our office relocation on a Tuesday, moved on Saturday, opened on Monday — zero downtime. Total professionals, start to finish.",
    name: "James M.",
    location: "Edinburgh New Town",
    service: "Office Relocation",
    rating: 5,
  },
  {
    quote:
      "I've used three van companies before. None came close. Quiet, careful, fast, and the booking site is honestly nicer than my bank's app.",
    name: "Aisha R.",
    location: "Aberdeen",
    service: "Furniture Delivery",
    rating: 5,
  },
  {
    quote:
      "End-of-tenancy madness handled with grace. They packed, moved, and even helped reassemble. Worth every penny — and the price was already low.",
    name: "Connor B.",
    location: "Dundee",
    service: "Student Move",
    rating: 5,
  },
];

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(id);
  }, [paused]);

  const t = TESTIMONIALS[index];

  return (
    <chakra.section bg="obsidian" color="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="4xl">
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
            What Our Customers Say
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontWeight="700"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "5xl" }}
          >
            Trusted across Scotland
          </Heading>
        </MotionBox>

        <Box
          position="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Box
            bg="glass"
            border="1px solid"
            borderColor="glassBorder"
            backdropFilter="blur(12px)"
            style={{ WebkitBackdropFilter: "blur(12px)" }}
            rounded="xl"
            p={{ base: "8", md: "12" }}
            minH={{ base: "340px", md: "300px" }}
            position="relative"
          >
            <Text
              position="absolute"
              top="2"
              left="6"
              color="gold"
              fontFamily="heading"
              fontWeight="800"
              fontSize="7xl"
              opacity={0.35}
              lineHeight="1"
              aria-hidden="true"
            >
              ❝
            </Text>

            <AnimatePresence mode="wait">
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
              >
                <Stack gap="6" pt={{ base: "8", md: "10" }}>
                  <Text
                    fontFamily="heading"
                    fontWeight="500"
                    color="pearl"
                    fontSize={{ base: "lg", md: "2xl" }}
                    lineHeight="1.5"
                    letterSpacing="-0.01em"
                  >
                    {t.quote}
                  </Text>
                  <HStack gap="1" color="gold" aria-label={`Rated ${t.rating} out of 5 stars`}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Text key={i} fontSize="md">★</Text>
                    ))}
                  </HStack>
                  <Stack gap="0">
                    <Text fontFamily="heading" fontWeight="600" color="pearl">
                      {t.name} · {t.location}
                    </Text>
                    <Text fontFamily="body" fontSize="sm" color="muted">
                      {t.service}
                    </Text>
                  </Stack>
                </Stack>
              </MotionBox>
            </AnimatePresence>
          </Box>

          {/* Controls */}
          <HStack
            justify="space-between"
            mt="6"
            align="center"
          >
            <HStack gap="2">
              {TESTIMONIALS.map((_, i) => (
                <chakra.button
                  key={i}
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => setIndex(i)}
                  w={i === index ? "8" : "2"}
                  h="2"
                  rounded="full"
                  bg={i === index ? "gold" : "muted"}
                  opacity={i === index ? 1 : 0.4}
                  transition="all 250ms"
                  _hover={{ opacity: 1 }}
                />
              ))}
            </HStack>
            <HStack gap="2">
              <IconButton
                aria-label="Previous testimonial"
                variant="ghost"
                color="pearl"
                _hover={{ color: "gold", bg: "glass" }}
                onClick={() =>
                  setIndex((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
                }
              >
                <HiChevronLeft size={22} />
              </IconButton>
              <IconButton
                aria-label="Next testimonial"
                variant="ghost"
                color="pearl"
                _hover={{ color: "gold", bg: "glass" }}
                onClick={() => setIndex((i) => (i + 1) % TESTIMONIALS.length)}
              >
                <HiChevronRight size={22} />
              </IconButton>
            </HStack>
          </HStack>
        </Box>
      </Container>
    </chakra.section>
  );
}
