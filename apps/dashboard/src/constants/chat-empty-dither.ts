export const CHAT_EMPTY_DITHER_COLORS_LIGHT = {
  colorBack: "#00000000",
  colorFront: "#CBB6EF",
} as const;

export const CHAT_EMPTY_DITHER_COLORS_DARK = {
  colorBack: "#00000000",
  colorFront: "#4C1D95",
} as const;

export const CHAT_EMPTY_DITHER_SHAPE = "simplex" as const;
export const CHAT_EMPTY_DITHER_TYPE = "4x4" as const;
export const CHAT_EMPTY_DITHER_SIZE = 2.2;
export const CHAT_EMPTY_DITHER_SPEED = 0.35;
export const CHAT_EMPTY_DITHER_SCALE = 0.58;
export const CHAT_EMPTY_DITHER_DEFER_MS = 150;
/** Fallback if the canvas never mounts (chunk/WebGL stall). */
export const CHAT_EMPTY_DITHER_REVEAL_FALLBACK_MS = 500;
export const CHAT_EMPTY_DITHER_PLACEMENT_CLASS = {
  top: "inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black_30%,transparent_88%)]",
  bottom:
    "inset-x-0 bottom-0 h-36 opacity-50 [mask-image:linear-gradient(to_top,black_12%,transparent_70%)]",
} as const;
