"use client";

import { Box, Stack, Text, chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MotionDiv = motion.create(chakra.div);

export default function Loading() {
  return (
    <Box
      bg="obsidian"
      color="pearl"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      <Box
        position="absolute"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="600px"
        h="600px"
        bg="radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 60%)"
        pointerEvents="none"
      />
      <Stack gap="6" align="center" position="relative" zIndex={1}>
        <Box position="relative" w="64px" h="64px">
          <MotionDiv
            position="absolute"
            inset="0"
            rounded="full"
            border="2px solid"
            borderColor="rgba(212,175,55,0.2)"
          />
          <MotionDiv
            position="absolute"
            inset="0"
            rounded="full"
            border="2px solid transparent"
            borderTopColor="gold"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          />
          <MotionDiv
            position="absolute"
            inset="22%"
            rounded="full"
            bg="gold"
            animate={{ scale: [1, 0.7, 1], opacity: [1, 0.6, 1] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            boxShadow="goldGlow"
          />
        </Box>
        <Text
          fontFamily="heading"
          fontSize="xs"
          letterSpacing="0.32em"
          textTransform="uppercase"
          color="gold"
          fontWeight="500"
        >
          Speedy Van
        </Text>
      </Stack>
    </Box>
  );
}
