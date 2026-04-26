"use client";

import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { easeOutExpo, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

const STEPS = [
  {
    n: "01",
    title: "Tell us what you need",
    desc: "Choose your service and enter your details. Instant pricing — no quote forms, no waiting.",
  },
  {
    n: "02",
    title: "Pick your date and pay",
    desc: "Select from our live availability calendar. Fixed prices, secured by Stripe, confirmed instantly.",
  },
  {
    n: "03",
    title: "We arrive and move",
    desc: "Your insured team arrives on time. You sit back. The move happens beautifully.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <chakra.section bg="obsidian" color="pearl" py={{ base: "20", md: "28" }}>
      <Container maxW="6xl">
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          mb={{ base: "12", md: "16" }}
          textAlign="center"
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
            How It Works
          </Text>
          <Heading
            as="h2"
            fontFamily="heading"
            fontWeight="700"
            letterSpacing="-0.02em"
            fontSize={{ base: "3xl", md: "5xl" }}
            mb="4"
          >
            Three steps. Zero stress.
          </Heading>
          <Text
            color="muted"
            fontFamily="body"
            fontSize={{ base: "md", md: "lg" }}
            maxW="2xl"
            mx="auto"
            lineHeight="1.7"
          >
            We replaced clipboards, callbacks, and surprise fees with one elegant flow.
          </Text>
        </MotionBox>

        <Box position="relative" ref={ref}>
          {/* Connecting line (desktop) */}
          <Box
            position="absolute"
            top="44px"
            left="10%"
            right="10%"
            h="1px"
            display={{ base: "none", md: "block" }}
            overflow="hidden"
          >
            <MotionBox
              h="full"
              bgGradient="linear(to-r, transparent, gold, transparent)"
              style={{ originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.6, ease: easeOutExpo, delay: 0.2 }}
            />
          </Box>

          <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: "10", md: "8" }}>
            {STEPS.map((step, i) => (
              <MotionBox
                key={step.n}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                transition={{
                  duration: 0.6,
                  ease: easeOutExpo,
                  delay: 0.4 + i * 0.4,
                }}
              >
                <Stack gap="6" align={{ base: "flex-start", md: "center" }} textAlign={{ base: "left", md: "center" }}>
                  <Box
                    w="88px"
                    h="88px"
                    rounded="full"
                    border="1.5px solid"
                    borderColor="gold"
                    bg="obsidian"
                    display="inline-flex"
                    alignItems="center"
                    justifyContent="center"
                    color="gold"
                    fontFamily="heading"
                    fontWeight="700"
                    fontSize="2xl"
                    boxShadow="0 0 0 8px rgba(212,175,55,0.06)"
                    position="relative"
                    zIndex={1}
                  >
                    {step.n}
                  </Box>
                  <Box
                    bg="glass"
                    border="1px solid"
                    borderColor="glassBorder"
                    backdropFilter="blur(8px)"
                    style={{ WebkitBackdropFilter: "blur(8px)" }}
                    rounded="lg"
                    p="6"
                    w="full"
                    borderLeftWidth="2px"
                    borderLeftColor="gold"
                  >
                    <Heading
                      as="h3"
                      fontFamily="heading"
                      fontWeight="600"
                      fontSize="xl"
                      color="pearl"
                      mb="2"
                    >
                      {step.title}
                    </Heading>
                    <Text
                      fontFamily="body"
                      color="zinc.400"
                      fontSize="sm"
                      lineHeight="1.7"
                    >
                      {step.desc}
                    </Text>
                  </Box>
                </Stack>
              </MotionBox>
            ))}
          </SimpleGrid>
        </Box>
      </Container>
    </chakra.section>
  );
}
