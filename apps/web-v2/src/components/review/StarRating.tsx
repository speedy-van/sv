"use client";

import { chakra } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";

const MotionPath = motion.create(chakra.path);

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readonly?: boolean;
}

const STAR_PATH =
  "M12 2.5l2.95 6.36 6.97.7-5.18 4.7 1.49 6.84L12 17.77l-6.23 3.33 1.49-6.84-5.18-4.7 6.97-.7L12 2.5z";

export function StarRating({ value, onChange, size = 40, readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const display = hover > 0 ? hover : value;

  function select(v: number) {
    if (readonly || !onChange) return;
    onChange(v);
  }

  return (
    <chakra.div
      role="radiogroup"
      aria-label={`Rate ${value} out of 5 stars`}
      display="inline-flex"
      gap="2"
      onMouseLeave={() => !readonly && setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= display;
        return (
          <motion.button
            key={i}
            type="button"
            aria-label={`${i} star${i === 1 ? "" : "s"}`}
            aria-checked={value === i}
            role="radio"
            disabled={readonly}
            onMouseEnter={() => !readonly && setHover(i)}
            onClick={() => select(i)}
            whileTap={!readonly ? { scale: 0.9 } : undefined}
            whileHover={!readonly ? { scale: 1.05 } : undefined}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: readonly ? "default" : "pointer",
              lineHeight: 0,
            }}
          >
            <chakra.svg
              width={`${size}px`}
              height={`${size}px`}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <MotionPath
                d={STAR_PATH}
                fill={filled ? "#D4AF37" : "transparent"}
                stroke={filled ? "#D4AF37" : "#71717A"}
                strokeWidth="1.5"
                strokeLinejoin="round"
                initial={false}
                animate={{
                  fill: filled ? "#D4AF37" : "rgba(212,175,55,0)",
                  scale: filled ? 1 : 1,
                }}
                transition={{
                  duration: 0.2,
                  delay: filled ? (i - 1) * 0.05 : 0,
                  type: "spring",
                  stiffness: 300,
                  damping: 18,
                }}
              />
            </chakra.svg>
          </motion.button>
        );
      })}
    </chakra.div>
  );
}
