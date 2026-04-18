// Shared motion constants — all durations 120–220ms, ease-out only
export const FADE_UP = {
  initial:   { opacity: 0, y: 6 },
  animate:   { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: "easeOut" },
} as const;

export const FADE_IN = {
  initial:   { opacity: 0 },
  animate:   { opacity: 1 },
  transition: { duration: 0.15, ease: "easeOut" },
} as const;

export const PAGE = {
  initial:   { opacity: 0 },
  animate:   { opacity: 1 },
  exit:      { opacity: 0 },
  transition: { duration: 0.15, ease: "easeOut" },
} as const;

// Stagger container — max 40ms between children
export const STAGGER = {
  animate: { transition: { staggerChildren: 0.04 } },
} as const;

export const STAGGER_ITEM = {
  initial:   { opacity: 0, y: 5 },
  animate:   { opacity: 1, y: 0 },
  transition: { duration: 0.16, ease: "easeOut" },
} as const;
