"use client";

import { Box, Button, IconButton, Stack, Text, chakra } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { HiBell, HiSpeakerWave, HiSpeakerXMark } from "react-icons/hi2";
import { easeOutExpo } from "@/lib/motion";

const MotionBox = motion.create(chakra.div);
const MotionDiv = motion.create(chakra.div);

const API = process.env.NEXT_PUBLIC_API_URL || "";
const SOUND_KEY = "sv-notif-sound";
const POLL_MS = 10000;

interface NotificationItem {
  id: string;
  title: string;
  message?: string;
  emoji?: string;
  read?: boolean;
  createdAt?: string;
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function beep() {
  try {
    const Ctor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.06;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.18);
    o.onended = () => ctx.close();
  } catch {
    /* silent */
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [soundOn, setSoundOn] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  // Hydrate sound preference
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(SOUND_KEY);
    if (stored === "off") setSoundOn(false);
    audioRef.current = new Audio("/sounds/notification.mp3");
    audioRef.current.preload = "auto";
  }, []);

  const playSound = useCallback(() => {
    if (!soundOn) return;
    const a = audioRef.current;
    if (a) {
      a.currentTime = 0;
      a.play().catch(() => beep());
    } else {
      beep();
    }
  }, [soundOn]);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/notifications`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const json = (await res.json()) as
        | NotificationItem[]
        | { items?: NotificationItem[]; notifications?: NotificationItem[] };
      const list: NotificationItem[] = Array.isArray(json)
        ? json
        : json.items ?? json.notifications ?? [];

      const newOnes = list.filter((n) => !seenIds.current.has(n.id));
      if (!firstLoad.current && newOnes.some((n) => !n.read)) {
        playSound();
      }
      list.forEach((n) => seenIds.current.add(n.id));
      firstLoad.current = false;
      setItems(list);
    } catch {
      /* silent */
    }
  }, [playSound]);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, POLL_MS);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const unread = items.filter((n) => !n.read).length;

  function toggleSound() {
    const next = !soundOn;
    setSoundOn(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch(`${API}/api/admin/notifications/read-all`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* silent */
    }
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await fetch(`${API}/api/admin/notifications/${encodeURIComponent(id)}/read`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* silent */
    }
  }

  return (
    <Box position="relative">
      <MotionDiv
        animate={
          unread > 0
            ? { rotate: [0, -12, 12, -8, 8, 0] }
            : { rotate: 0 }
        }
        transition={{ duration: 0.6, repeat: unread > 0 ? Infinity : 0, repeatDelay: 2.4 }}
      >
        <IconButton
          aria-label="Notifications"
          variant="ghost"
          color="pearl"
          onClick={() => setOpen((v) => !v)}
          _hover={{ bg: "glass", color: "gold" }}
          position="relative"
        >
          <HiBell size={22} />
        </IconButton>
      </MotionDiv>
      {unread > 0 && (
        <Box
          position="absolute"
          top="-2px"
          right="-2px"
          minW="18px"
          h="18px"
          px="1"
          rounded="full"
          bg="gold"
          color="obsidian"
          fontSize="10px"
          fontWeight="700"
          fontFamily="mono"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          pointerEvents="none"
          boxShadow="0 0 0 2px #09090B"
        >
          {unread > 99 ? "99+" : unread}
        </Box>
      )}

      <AnimatePresence>
        {open && (
          <MotionBox
            position="absolute"
            top="48px"
            right="0"
            w={{ base: "320px", md: "380px" }}
            maxH="480px"
            bg="obsidian"
            border="1px solid"
            borderColor="glassBorder"
            rounded="lg"
            boxShadow="0 24px 64px rgba(0,0,0,0.6)"
            overflow="hidden"
            zIndex="1500"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: easeOutExpo }}
          >
            <Stack
              direction="row"
              align="center"
              justify="space-between"
              p="4"
              borderBottom="1px solid"
              borderColor="glassBorder"
            >
              <Text fontFamily="heading" fontWeight="600" color="pearl" fontSize="sm">
                Notifications {unread > 0 ? `(${unread})` : ""}
              </Text>
              <Stack direction="row" gap="1" align="center">
                <IconButton
                  aria-label={soundOn ? "Mute notifications" : "Unmute notifications"}
                  size="xs"
                  variant="ghost"
                  color="muted"
                  _hover={{ color: "gold" }}
                  onClick={toggleSound}
                >
                  {soundOn ? <HiSpeakerWave /> : <HiSpeakerXMark />}
                </IconButton>
                {unread > 0 && (
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gold"
                    _hover={{ color: "goldSoft" }}
                    onClick={markAllRead}
                    fontWeight="500"
                  >
                    Mark all read
                  </Button>
                )}
              </Stack>
            </Stack>

            <Box maxH="400px" overflowY="auto">
              {items.length === 0 ? (
                <Box p="8" textAlign="center">
                  <Text fontFamily="body" color="muted" fontSize="sm">
                    No notifications yet 🔔
                  </Text>
                </Box>
              ) : (
                <Stack gap="0">
                  {items.map((n) => (
                    <chakra.button
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      textAlign="left"
                      bg={!n.read ? "rgba(212,175,55,0.06)" : "transparent"}
                      _hover={{ bg: "glass" }}
                      px="4"
                      py="3"
                      borderBottom="1px solid"
                      borderColor="glassBorder"
                      transition="background 200ms"
                    >
                      <Stack direction="row" gap="3" align="flex-start">
                        <Text fontSize="lg" lineHeight="1">
                          {n.emoji || "🔔"}
                        </Text>
                        <Box flex="1" minW="0">
                          <Stack direction="row" gap="2" align="center" justify="space-between">
                            <Text
                              fontFamily="heading"
                              fontWeight={!n.read ? "600" : "500"}
                              color="pearl"
                              fontSize="sm"
                              truncate
                            >
                              {n.title}
                            </Text>
                            <Text fontFamily="mono" color="muted" fontSize="2xs" flexShrink={0}>
                              {timeAgo(n.createdAt)}
                            </Text>
                          </Stack>
                          {n.message && (
                            <Text fontFamily="body" color="muted" fontSize="xs" mt="0.5" lineClamp={2}>
                              {n.message}
                            </Text>
                          )}
                        </Box>
                        {!n.read && (
                          <Box w="8px" h="8px" rounded="full" bg="gold" mt="1.5" flexShrink={0} />
                        )}
                      </Stack>
                    </chakra.button>
                  ))}
                </Stack>
              )}
            </Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
