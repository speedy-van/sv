"use client";

import { useEffect, useMemo, useState } from "react";
import { Box } from "@chakra-ui/react";
import { motion, useReducedMotion } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  shape: "circle" | "square" | "line";
  duration: number;
  delay: number;
  rotate: number;
  opacity: number;
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generate(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const shapes: Particle["shape"][] = ["circle", "square", "line"];
    return {
      id: i,
      x: rand(0, 100),
      y: rand(0, 100),
      size: rand(4, 20),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      duration: rand(15, 40),
      delay: rand(0, 10),
      rotate: rand(0, 360),
      opacity: rand(0.1, 0.3),
    };
  });
}

export function ParticleField() {
  const reduce = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const particles = useMemo(
    () => generate(isMobile ? 5 : 18),
    [isMobile]
  );

  if (reduce) return null;

  return (
    <Box
      position="absolute"
      inset="0"
      overflow="hidden"
      pointerEvents="none"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.shape === "line" ? `${p.size * 3}px` : `${p.size}px`,
            height: p.shape === "line" ? "1px" : `${p.size}px`,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            background:
              p.shape === "line"
                ? "linear-gradient(90deg, transparent, rgba(212,175,55,0.6), transparent)"
                : "rgba(212,175,55,0.5)",
            opacity: p.opacity,
            willChange: "transform, opacity",
          }}
          animate={{
            x: [0, rand(-60, 60), 0],
            y: [0, rand(-60, 60), 0],
            rotate: [p.rotate, p.rotate + 180, p.rotate + 360],
            opacity: [p.opacity, p.opacity * 1.6, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </Box>
  );
}
