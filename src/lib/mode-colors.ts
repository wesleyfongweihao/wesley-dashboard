import { FLEX_CATEGORIES, FIXED_ITEMS } from "@/components/transaction-form";

export type ModeKey = "Flex" | "Fixed" | "Big Amount";
export const MODE_ORDER: ModeKey[] = ["Flex", "Fixed", "Big Amount"];

// Validated 4-step families (dark mode's usable lightness band only fits
// ~4 distinguishable steps, so both light/dark are capped at 4).
const FLEX_SHADES_LIGHT = ["#7fb0e8", "#5598e7", "#2a78d6", "#163f78"];
const FLEX_SHADES_DARK = ["#a8c8ef", "#6ea0e2", "#3987e5", "#1c4d90"];
const FIXED_SHADES_LIGHT = ["#55b98a", "#2f9e6e", "#178a54", "#0a5c3d"];
const FIXED_SHADES_DARK = ["#7fd6ac", "#4fbf8f", "#199e70", "#116246"];
const BIG_AMOUNT_GRAY_LIGHT = "#9a9a94";
const BIG_AMOUNT_GRAY_DARK = "#b8b8b0";

const MODE_BASE_LIGHT: Record<ModeKey, string> = {
  Flex: FLEX_SHADES_LIGHT[2],
  Fixed: FIXED_SHADES_LIGHT[2],
  "Big Amount": BIG_AMOUNT_GRAY_LIGHT,
};
const MODE_BASE_DARK: Record<ModeKey, string> = {
  Flex: FLEX_SHADES_DARK[2],
  Fixed: FIXED_SHADES_DARK[2],
  "Big Amount": BIG_AMOUNT_GRAY_DARK,
};

const FLEX_CATEGORIES_LIST: readonly string[] = FLEX_CATEGORIES;
const FIXED_ITEMS_LIST: readonly string[] = FIXED_ITEMS;

function hashIndex(s: string, mod: number) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % mod;
}

function toModeKey(mode: string): ModeKey {
  return mode === "Flex" || mode === "Fixed" ? mode : "Big Amount";
}

/** Fixed, stable shade index — never derived from amount/rank, so a
 * category's color doesn't drift week to week. Falls back to a
 * deterministic hash for values absent from the known arrays (e.g. a
 * stray "Fruit" vs the canonical "Fruits"). */
function shadeIndexFor(modeKey: ModeKey, category: string): number {
  if (modeKey === "Flex") {
    const idx = FLEX_CATEGORIES_LIST.indexOf(category);
    return idx === -1 ? hashIndex(category, 4) : idx % 4;
  }
  if (modeKey === "Fixed") {
    const idx = FIXED_ITEMS_LIST.indexOf(category);
    return idx === -1 ? hashIndex(category, 4) : idx % 4;
  }
  return 0;
}

export function getCategoryColor(
  mode: string,
  category: string,
  theme: "light" | "dark" = "light"
): string {
  const modeKey = toModeKey(mode);
  if (modeKey === "Big Amount") {
    return theme === "dark" ? BIG_AMOUNT_GRAY_DARK : BIG_AMOUNT_GRAY_LIGHT;
  }
  const idx = shadeIndexFor(modeKey, category);
  const shades =
    modeKey === "Flex"
      ? theme === "dark"
        ? FLEX_SHADES_DARK
        : FLEX_SHADES_LIGHT
      : theme === "dark"
      ? FIXED_SHADES_DARK
      : FIXED_SHADES_LIGHT;
  return shades[idx];
}

export function getModeColor(mode: string, theme: "light" | "dark" = "light"): string {
  const modeKey = toModeKey(mode);
  return theme === "dark" ? MODE_BASE_DARK[modeKey] : MODE_BASE_LIGHT[modeKey];
}

/** Picks readable black/white text for a swatch used as a text background
 * (e.g. the row avatar, the mode pill) — the fixed-index shade a category
 * lands on can be light or dark, so this can't be hardcoded. */
export function getContrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}
