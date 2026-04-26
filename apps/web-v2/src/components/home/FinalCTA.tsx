"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ParticleField } from "./ParticleField";
import { easeOutExpo, viewportOnce } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

export function FinalCTA() {
  return (
    <chakra.section
      bg="obsidian"
      color="pearl"
      py={{ base: "24", md: "32" }}
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="-30%"
        left="50%"
        transform="translateX(-50%)"
        w="100%"
        h="120%"
        bg="radial-gradient(ellipse at center, rgba(212,175,55,0.18) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <ParticleField />
      <Container maxW="3xl" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.8, ease: easeOutExpo }}
        >
          <Stack gap="6" align="center" textAlign="center">
            <Text
              color="gold"
              fontFamily="heading"
              fontWeight="500"
              fontSize="sm"
              letterSpacing="0.32em"
              textTransform="uppercase"
            >
              Ready When You Are
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontWeight="800"
              color="pearl"
              letterSpacing="-0.03em"
              fontSize={{ base: "4xl", md: "6xl" }}
              lineHeight="1"
            >
              Ready to Move?
            </Heading>
            <Text
              fontFamily="body"
              color="zinc.400"
              fontSize={{ base: "md", md: "lg" }}
              maxW="md"
              lineHeight="1.7"
              opacity={0.9}
            >
              Get your fixed quote in under two minutes. No callbacks. No surprises.
              Just a beautifully simple booking.
            </Text>
            <Link href="/book">
              <Button
                bg="gold"
                color="obsidian"
                rounded="full"
                px="10"
                h="16"
                fontFamily="body"
                fontWeight="600"
                fontSize="lg"
                boxShadow="goldGlow"
                _hover={{ bg: "goldSoft", transform: "translateY(-2px)" }}
                _active={{ transform: "scale(0.97)" }}
                transition="all 250ms"
                mt="4"
              >
                ✨ Book Your Move
              </Button>
            </Link>
          </Stack>
        </MotionBox>
      </Container>
    </chakra.section>
  );
}
