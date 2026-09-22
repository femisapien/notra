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
/** Clip the traveling wash to the panel. */
export const CHAT_EMPTY_DITHER_FRAME_CLASS =
  "pointer-events-none absolute inset-0 overflow-hidden";
export const CHAT_EMPTY_DITHER_SHIFT_CLASS =
  "duration-slower ease-emphasized transition-[translate,opacity] motion-reduce:transition-none";
export const CHAT_EMPTY_DITHER_WASH_CLASS =
  "[mask-image:linear-gradient(to_bottom,transparent,black_6%,black_32%,transparent_88%)]";
export const CHAT_EMPTY_DITHER_PLACEMENT_CLASS = {
  top: "translate-y-0 opacity-60",
  bottom: "translate-y-[calc(100%-8rem)] opacity-45",
} as const;
