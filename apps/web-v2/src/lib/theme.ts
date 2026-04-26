"use client";

import {
  createSystem,
  defaultConfig,
  defineConfig,
} from "@chakra-ui/react";

const config = defineConfig({
  globalCss: {
    "html, body": {
      bg: "pearl",
      color: "ink",
      fontFamily: "body",
    },
    "*::selection": {
      bg: "rgba(212, 175, 55, 0.25)",
      color: "obsidian",
    },
  },
  theme: {
    tokens: {
      colors: {
        obsidian: { value: "#09090B" },
        gold: { value: "#D4AF37" },
        goldSoft: { value: "#E6C76B" },
        pearl: { value: "#FAFAF9" },
        surface: { value: "#FFFFFF" },
        ink: { value: "#18181B" },
        muted: { value: "#71717A" },
        emerald: { value: "#059669" },
        crimson: { value: "#DC2626" },
        glass: { value: "rgba(255, 255, 255, 0.08)" },
        glassBorder: { value: "rgba(255, 255, 255, 0.12)" },
        glassDark: { value: "rgba(9, 9, 11, 0.65)" },
      },
      fonts: {
        heading: { value: "var(--font-outfit), system-ui, sans-serif" },
        body: { value: "var(--font-dm-sans), system-ui, sans-serif" },
        mono: { value: "var(--font-jetbrains-mono), ui-monospace, monospace" },
      },
      radii: {
        sm: { value: "8px" },
        md: { value: "12px" },
        lg: { value: "20px" },
        xl: { value: "28px" },
        full: { value: "9999px" },
      },
      shadows: {
        sm: { value: "0 1px 2px rgba(0, 0, 0, 0.05)" },
        md: { value: "0 4px 16px rgba(0, 0, 0, 0.08)" },
        lg: { value: "0 8px 32px rgba(0, 0, 0, 0.12)" },
        xl: { value: "0 16px 48px rgba(0, 0, 0, 0.16)" },
        goldGlow: {
          value:
            "0 0 0 1px rgba(212, 175, 55, 0.4), 0 8px 32px rgba(212, 175, 55, 0.25)",
        },
      },
    },
    semanticTokens: {
      colors: {
        "bg.canvas": { value: "{colors.pearl}" },
        "bg.surface": { value: "{colors.surface}" },
        "bg.dark": { value: "{colors.obsidian}" },
        "fg.default": { value: "{colors.ink}" },
        "fg.muted": { value: "{colors.muted}" },
        "fg.onDark": { value: "{colors.pearl}" },
        accent: { value: "{colors.gold}" },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
