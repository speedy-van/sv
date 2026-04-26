"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  SimpleGrid,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ParticleField } from "./ParticleField";
import { easeOutExpo, viewportOnce, wordChild, wordStagger } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);
const MotionSpan = motion.create(chakra.span);

const HEADLINE_LINE_1 = ["Moving", "Scotland."];
const HEADLINE_LINE_2 = ["Perfected."];

const STATS = [
  { value: "4.9★", label: "Customer Rated" },
  { value: "1,000+", label: "Moves Delivered" },
  { value: "30+", label: "Towns Covered" },
  { value: "100%", label: "Insured" },
];

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <chakra.section
      position="relative"
      minH={{ base: "100vh", md: "100vh" }}
      bg="obsidian"
      overflow="hidden"
      pt={{ base: "24", md: "28" }}
      pb={{ base: "20", md: "16" }}
    >
      {/* Soft radial gold glow */}
      <Box
        position="absolute"
        top="-20%"
        left="50%"
        transform="translateX(-50%)"
        w="80%"
        h="80%"
        bg="radial-gradient(circle, rgba(212,175,55,0.10) 0%, transparent 60%)"
        pointerEvents="none"
      />

      <ParticleField />

      <Container maxW="6xl" position="relative" zIndex="1">
        <Stack gap={{ base: "8", md: "10" }} align="center" textAlign="center">
          <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: easeOutExpo }}
          >
            <Text
              color="gold"
              fontFamily="heading"
              fontWeight="500"
              fontSize="sm"
              letterSpacing="0.32em"
              textTransform="uppercase"
            >
              Glasgow · Edinburgh · Dundee
            </Text>
          </MotionBox>

          <MotionBox
            variants={reduce ? undefined : wordStagger}
            initial="hidden"
            animate="show"
            maxW="5xl"
          >
            <chakra.h1
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              letterSpacing="-0.03em"
              lineHeight="1"
              fontSize={{ base: "5xl", sm: "6xl", md: "7xl", lg: "8xl" }}
              textShadow="0 4px 30px rgba(0,0,0,0.5)"
            >
              <chakra.span display="block">
                {HEADLINE_LINE_1.map((w, i) => (
                  <MotionSpan
                    key={i}
                    display="inline-block"
                    mr="4"
                    variants={reduce ? undefined : wordChild}
                  >
                    {w}
                  </MotionSpan>
                ))}
              </chakra.span>
              <chakra.span display="block" color="gold">
                {HEADLINE_LINE_2.map((w, i) => (
                  <MotionSpan
                    key={i}
                    display="inline-block"
                    variants={reduce ? undefined : wordChild}
                  >
                    {w}
                  </MotionSpan>
                ))}
              </chakra.span>
            </chakra.h1>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7, ease: easeOutExpo }}
            maxW="lg"
          >
            <Text
              color="zinc.400"
              fontFamily="body"
              fontSize={{ base: "md", md: "lg" }}
              lineHeight="1.7"
              opacity="0.85"
            >
              Professional removals with fixed pricing, full insurance, and drivers
              you can trust. Book online in under two minutes.
            </Text>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7, ease: easeOutExpo }}
          >
            <HStack gap="4" flexWrap="wrap" justify="center">
              <Link href="/book">
                <Button
                  bg="gold"
                  color="obsidian"
                  rounded="full"
                  px="8"
                  h="14"
                  fontFamily="body"
                  fontWeight="600"
                  fontSize="md"
                  boxShadow="goldGlow"
                  _hover={{ bg: "goldSoft", transform: "translateY(-2px)" }}
                  _active={{ transform: "scale(0.97)" }}
                  transition="all 250ms"
                >
                  ✨ Get Your Quote
                </Button>
              </Link>
              <Link href="#services">
                <Button
                  variant="outline"
                  borderColor="rgba(255,255,255,0.25)"
                  color="pearl"
                  bg="transparent"
                  rounded="full"
                  px="8"
                  h="14"
                  fontFamily="body"
                  fontWeight="500"
                  _hover={{ borderColor: "gold", color: "gold" }}
                >
                  View Services ↓
                </Button>
              </Link>
            </HStack>
          </MotionBox>

          {/* Trust strip */}
          <MotionBox
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ delay: 0.2, duration: 0.8, ease: easeOutExpo }}
            mt={{ base: "6", md: "10" }}
            w="full"
            maxW="3xl"
          >
            <Box
              bg="glass"
              border="1px solid"
              borderColor="glassBorder"
              backdropFilter="blur(12px)"
              style={{ WebkitBackdropFilter: "blur(12px)" }}
              rounded="xl"
              p={{ base: "5", md: "6" }}
            >
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={{ base: "5", md: "4" }}>
                {STATS.map((s) => (
                  <Stack key={s.label} gap="1" align="center">
                    <Text
                      fontFamily="heading"
                      fontWeight="700"
                      color="pearl"
                      fontSize={{ base: "2xl", md: "3xl" }}
                    >
                      {s.value}
                    </Text>
                    <Text
                      fontFamily="body"
                      fontSize="xs"
                      color="muted"
                      letterSpacing="0.06em"
                      textTransform="uppercase"
                    >
                      {s.label}
                    </Text>
                  </Stack>
                ))}
              </SimpleGrid>
            </Box>
          </MotionBox>
        </Stack>

        {/* Scroll indicator */}
        <Flex
          position="absolute"
          bottom="6"
          left="50%"
          transform="translateX(-50%)"
          display={{ base: "none", md: "flex" }}
        >
          <MotionBox
            color="gold"
            opacity={0.6}
            animate={
              reduce
                ? undefined
                : { y: [0, 8, 0] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            fontSize="xl"
          >
            ↓
          </MotionBox>
        </Flex>
      </Container>
    </chakra.section>
  );
}
