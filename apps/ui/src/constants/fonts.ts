export const INTER_FONT = {
  name: "Inter",
  variants: [
    {
      src: "public/fonts/inter-normal.woff2",
      weight: "400..700",
      style: "normal",
    },
    {
      src: "public/fonts/inter-italic.woff2",
      weight: "400..700",
      style: "italic",
    },
  ],
} as const;

export const GEIST_MONO_FONT = {
  name: "Geist Mono",
  fallback: "mono",
  variants: [
    {
      src: "public/fonts/geist-mono-normal.woff2",
      weight: "400..600",
      style: "normal",
    },
    {
      src: "public/fonts/geist-mono-italic.woff2",
      weight: "400..600",
      style: "italic",
    },
  ],
} as const;
