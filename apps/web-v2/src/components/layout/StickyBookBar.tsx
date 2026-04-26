"use client";

import { Box, Button, Flex, chakra } from "@chakra-ui/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiPhone } from "react-icons/hi2";
import { FaWhatsapp } from "react-icons/fa6";
import { SITE } from "@/lib/site";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);

export function StickyBookBar() {
  return (
    <MotionBox
      display={{ base: "block", md: "none" }}
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      zIndex="900"
      bg="rgba(9,9,11,0.92)"
      borderTop="1px solid"
      borderColor="rgba(212,175,55,0.4)"
      backdropFilter="blur(16px)"
      style={{ WebkitBackdropFilter: "blur(16px)" }}
      px="4"
      py="3"
      pb="calc(env(safe-area-inset-bottom) + 12px)"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: easeOutExpo }}
    >
      <Flex gap="2" align="center">
        <chakra.a
          href={SITE.phone.href}
          flex="1"
          h="12"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          gap="2"
          rounded="full"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          fontFamily="body"
          fontWeight="500"
          fontSize="sm"
          aria-label="Call Speedy Van"
        >
          <HiPhone size={18} /> Call
        </chakra.a>
        <chakra.a
          href={SITE.whatsapp.href}
          target="_blank"
          rel="noopener noreferrer"
          flex="1"
          h="12"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          gap="2"
          rounded="full"
          border="1px solid"
          borderColor="glassBorder"
          color="pearl"
          fontFamily="body"
          fontWeight="500"
          fontSize="sm"
          aria-label="WhatsApp Speedy Van"
        >
          <FaWhatsapp size={18} /> Chat
        </chakra.a>
        <Box flex="1.4">
          <Link href="/book" style={{ display: "block" }}>
            <Button
              w="full"
              h="12"
              bg="gold"
              color="obsidian"
              rounded="full"
              fontFamily="body"
              fontWeight="600"
              _hover={{ bg: "goldSoft" }}
              _active={{ transform: "scale(0.97)" }}
            >
              ✨ Book Now
            </Button>
          </Link>
        </Box>
      </Flex>
    </MotionBox>
  );
}
