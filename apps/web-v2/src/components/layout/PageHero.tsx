"use client";

import { Box, Container, Heading, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { ParticleField } from "@/components/home/ParticleField";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  particles?: boolean;
}

export function PageHero({ eyebrow, title, subtitle, particles = true }: PageHeroProps) {
  return (
    <chakra.section
      bg="obsidian"
      color="pearl"
      pt={{ base: "32", md: "40" }}
      pb={{ base: "16", md: "24" }}
      position="relative"
      overflow="hidden"
    >
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
      {particles && <ParticleField />}
      <Container maxW="4xl" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
        >
          <Stack gap="5" align="center" textAlign="center">
            {eyebrow && (
              <Text
                color="gold"
                fontFamily="heading"
                fontWeight="500"
                fontSize="sm"
                letterSpacing="0.32em"
                textTransform="uppercase"
              >
                {eyebrow}
              </Text>
            )}
            <Heading
              as="h1"
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              letterSpacing="-0.03em"
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="1.05"
            >
              {title}
            </Heading>
            {subtitle && (
              <Text
                fontFamily="body"
                color="zinc.400"
                fontSize={{ base: "md", md: "lg" }}
                maxW="2xl"
                lineHeight="1.7"
                opacity={0.9}
              >
                {subtitle}
              </Text>
            )}
          </Stack>
        </MotionBox>
      </Container>
    </chakra.section>
  );
}